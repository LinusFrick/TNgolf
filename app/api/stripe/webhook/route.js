import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import { sendNewBookingNotificationEmail } from "../../lib/email";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
});

// Important: Disable body parsing for webhooks
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "No signature" },
        { status: 400 }
      );
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle the event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Find booking by session ID with user information
      const booking = await prisma.booking.findFirst({
        where: { stripeSessionId: session.id },
        include: { user: true },
      });

      if (booking) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            paymentStatus: "paid",
            // Keep status as "pending" - admin needs to confirm
            stripePaymentIntentId: session.payment_intent,
          },
        });

        // Get receipt URL from Stripe
        let receiptUrl = null;
        try {
          if (session.payment_intent) {
            const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent, {
              expand: ['charges'],
            });
            if (paymentIntent.charges?.data?.length > 0) {
              const charge = paymentIntent.charges.data[0];
              receiptUrl = charge.receipt_url;
            }
          }
        } catch (receiptError) {
          console.error('Error fetching receipt URL:', receiptError);
          // Continue without receipt URL
        }

        // Send email to admin instead of confirmation to customer
        try {
          await sendNewBookingNotificationEmail(booking, booking.user, receiptUrl);
          console.log(`Booking ${booking.id} paid - admin notification sent`);
        } catch (emailError) {
          // Log error but don't fail the webhook
          console.error(`Failed to send admin notification for booking ${booking.id}:`, emailError);
        }
      }
    } else if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object;

      const booking = await prisma.booking.findFirst({
        where: { stripeSessionId: session.id },
      });

      if (booking) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            paymentStatus: "failed",
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

