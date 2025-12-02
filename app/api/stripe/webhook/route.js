import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import { sendBookingConfirmationEmail } from "../../lib/email";

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
            status: "confirmed",
            stripePaymentIntentId: session.payment_intent,
          },
        });

        // Send confirmation email
        try {
          await sendBookingConfirmationEmail(booking, booking.user);
          console.log(`Booking ${booking.id} confirmed and paid - confirmation email sent`);
        } catch (emailError) {
          // Log error but don't fail the webhook
          console.error(`Failed to send confirmation email for booking ${booking.id}:`, emailError);
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

