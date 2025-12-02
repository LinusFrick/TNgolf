import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { isCoachEmail } from "../../../../lib/isCoach";
import { sendBookingConfirmationEmail, sendCancellationConfirmationEmail } from "../../../../lib/email";
import Stripe from "stripe";

const prisma = new PrismaClient();

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Ej autentiserad" },
        { status: 401 }
      );
    }

    if (!isCoachEmail(session.user.email)) {
      return NextResponse.json(
        { error: "Ingen behörighet" },
        { status: 403 }
      );
    }

    // In Next.js 15+, params might be a Promise
    const resolvedParams = await params;
    const { id } = resolvedParams || params;
    const { status } = await request.json();

    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: "Ogiltig status" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Bokning hittades inte" },
        { status: 404 }
      );
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // När admin bekräftar bokningen, skicka bekräftelse till kunden
    if (status === 'confirmed' && booking.paymentStatus === 'paid') {
      // Get receipt URL from Stripe if available
      let receiptUrl = null;
      if (booking.stripePaymentIntentId) {
        try {
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: "2024-12-18.acacia",
          });
          const paymentIntent = await stripe.paymentIntents.retrieve(booking.stripePaymentIntentId, {
            expand: ['charges'],
          });
          if (paymentIntent.charges?.data?.length > 0) {
            const charge = paymentIntent.charges.data[0];
            receiptUrl = charge.receipt_url;
          }
        } catch (stripeError) {
          console.error('Error fetching receipt URL:', stripeError);
          // Continue without receipt URL
        }
      }

      // Send confirmation email to customer
      try {
        await sendBookingConfirmationEmail(updatedBooking, updatedBooking.user, receiptUrl);
        console.log(`Booking ${booking.id} confirmed by admin - confirmation email sent to customer`);
      } catch (emailError) {
        console.error(`Failed to send confirmation email:`, emailError);
        // Continue even if email fails
      }
    }

    // När admin avbokar bokningen, skicka bekräftelse till kunden
    if (status === 'cancelled') {
      try {
        await sendCancellationConfirmationEmail(updatedBooking, updatedBooking.user);
        console.log(`Booking ${booking.id} cancelled by admin - cancellation confirmation email sent to customer`);
      } catch (emailError) {
        console.error(`Failed to send cancellation confirmation email:`, emailError);
        // Continue even if email fails
      }
    }

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Kunde inte uppdatera bokning" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Ej autentiserad" },
        { status: 401 }
      );
    }

    if (!isCoachEmail(session.user.email)) {
      return NextResponse.json(
        { error: "Ingen behörighet" },
        { status: 403 }
      );
    }

    // In Next.js 15+, params might be a Promise
    const resolvedParams = await params;
    const { id } = resolvedParams || params;

    await prisma.booking.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Bokning raderad" });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return NextResponse.json(
      { error: "Kunde inte radera bokning" },
      { status: 500 }
    );
  }
}

