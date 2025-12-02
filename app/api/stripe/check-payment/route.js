import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../../auth/[...nextauth]/route";
import Stripe from "stripe";
import { sendNewBookingNotificationEmail } from "../../../lib/email";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
});

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Ej autentiserad" },
        { status: 401 }
      );
    }

    const { bookingId, sessionId } = await request.json();

    if (!bookingId || !sessionId) {
      return NextResponse.json(
        { error: "Boknings-ID och session-ID krävs" },
        { status: 400 }
      );
    }

    // Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true },
    });

    if (!booking || booking.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Bokning hittades inte" },
        { status: 404 }
      );
    }

    // Check payment status with Stripe
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

    // If payment is completed and booking is not yet paid, update payment status only
    if (stripeSession.payment_status === 'paid' && booking.paymentStatus !== 'paid') {
      // Update booking - keep status as "pending" for admin approval
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: "paid",
          // Keep status as "pending" - admin needs to confirm
          stripePaymentIntentId: stripeSession.payment_intent,
        },
      });

      // Get receipt URL from Stripe
      let receiptUrl = null;
      try {
        if (stripeSession.payment_intent) {
          const paymentIntent = await stripe.paymentIntents.retrieve(stripeSession.payment_intent, {
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
        console.log(`Booking ${booking.id} paid - admin notification sent (fallback)`);
        return NextResponse.json({
          success: true,
          message: "Betalning mottagen, väntar på admin-bekräftelse",
          paymentStatus: "paid",
        });
      } catch (emailError) {
        console.error(`Failed to send admin notification for booking ${booking.id}:`, emailError);
        return NextResponse.json({
          success: true,
          message: "Betalning mottagen, men admin-notifikation kunde inte skickas",
          paymentStatus: "paid",
          emailError: emailError.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      paymentStatus: stripeSession.payment_status,
      bookingStatus: booking.status,
    });
  } catch (error) {
    console.error("Error checking payment status:", error);
    return NextResponse.json(
      { error: "Kunde inte kontrollera betalningsstatus" },
      { status: 500 }
    );
  }
}

