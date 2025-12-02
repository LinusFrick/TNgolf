import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../../auth/[...nextauth]/route";
import Stripe from "stripe";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
});

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Ej autentiserad" },
        { status: 401 }
      );
    }

    // In Next.js 15+, params might be a Promise
    const resolvedParams = await params;
    const { bookingId } = resolvedParams || params;

    if (!bookingId) {
      return NextResponse.json(
        { error: "Boknings-ID krävs" },
        { status: 400 }
      );
    }

    // Fetch booking with user
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Bokning hittades inte" },
        { status: 404 }
      );
    }

    // Verify user owns the booking
    if (booking.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Du har inte behörighet att visa detta kvitto" },
        { status: 403 }
      );
    }

    // Fetch receipt data from Stripe
    let receiptData = null;
    if (booking.stripePaymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(booking.stripePaymentIntentId, {
          expand: ['charges'],
        });

        if (paymentIntent.charges?.data?.length > 0) {
          const charge = paymentIntent.charges.data[0];
          receiptData = {
            paymentIntentId: paymentIntent.id,
            chargeId: charge.id,
            paymentDate: new Date(charge.created * 1000).toLocaleDateString('sv-SE', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            paymentMethod: charge.payment_method_details?.card?.brand 
              ? `${charge.payment_method_details.card.brand.toUpperCase()} •••• ${charge.payment_method_details.card.last4}`
              : 'Kort',
            receiptUrl: charge.receipt_url,
          };
        }
      } catch (stripeError) {
        console.error('Error fetching Stripe receipt data:', stripeError);
        // Continue without Stripe data
      }
    }

        return NextResponse.json({
          booking: {
            id: booking.id,
            serviceType: booking.serviceType,
            date: booking.date,
            time: booking.time,
            notes: booking.notes,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            amount: booking.amount,
            cancellationRequest: booking.cancellationRequest,
            cancellationRequestedAt: booking.cancellationRequestedAt,
            createdAt: booking.createdAt,
          },
          receiptData,
        });
  } catch (error) {
    console.error("Error fetching receipt:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta kvitto" },
      { status: 500 }
    );
  }
}

