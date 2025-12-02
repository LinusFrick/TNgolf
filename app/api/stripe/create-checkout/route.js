import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../../auth/[...nextauth]/route";
import Stripe from "stripe";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
});

const SERVICE_TYPES = {
  'golftraning': { name: 'Golfträning', price: 1079 },
  'mental-traning': { name: 'Mental träning (Golf & Mind)', price: 1079 },
  'gruppträning': { name: 'Gruppträning', price: 1079 },
};

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Ej autentiserad" },
        { status: 401 }
      );
    }

    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: "Boknings-ID krävs" },
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

    if (booking.paymentStatus === 'paid') {
      return NextResponse.json(
        { error: "Bokningen är redan betald" },
        { status: 400 }
      );
    }

    const service = SERVICE_TYPES[booking.serviceType];
    if (!service) {
      return NextResponse.json(
        { error: "Ogiltig tjänsttyp" },
        { status: 400 }
      );
    }

    const amount = service.price;
    const dateStr = new Date(booking.date).toLocaleDateString('sv-SE');

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'sek',
            product_data: {
              name: service.name,
              description: `${service.name} - ${dateStr} ${booking.time}`,
            },
            unit_amount: amount * 100, // Stripe använder öre (cents)
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/boka?booking=${bookingId}&payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/boka?booking=${bookingId}&payment=cancelled`,
      customer_email: booking.user.email,
      metadata: {
        bookingId: booking.id,
        userId: booking.userId,
        serviceType: booking.serviceType,
      },
    });

    // Update booking with Stripe session ID
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        stripeSessionId: checkoutSession.id,
        paymentStatus: 'pending',
        amount: amount,
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("Error creating Stripe checkout:", error);
    return NextResponse.json(
      { error: "Kunde inte skapa betalning" },
      { status: 500 }
    );
  }
}

