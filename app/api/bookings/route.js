import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Ej autentiserad" },
        { status: 401 }
      );
    }

    const bookings = await prisma.booking.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta bokningar" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Ej autentiserad" },
        { status: 401 }
      );
    }

    const { serviceType, date, time, notes, paymentMethod } = await request.json();

    if (!serviceType || !date || !time) {
      return NextResponse.json(
        { error: "Tjänst, datum och tid krävs" },
        { status: 400 }
      );
    }

    // Parse date correctly to avoid timezone issues
    // date is in format "YYYY-MM-DD"
    const [year, month, day] = date.split('-').map(Number);
    const bookingDate = new Date(year, month - 1, day, 0, 0, 0, 0); // month is 0-indexed
    
    // Validate date - no bookings on Sundays (day 0)
    if (bookingDate.getDay() === 0) {
      return NextResponse.json(
        { error: "Bokningar är inte tillåtna på söndagar" },
        { status: 400 }
      );
    }

    // Validate that date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDate < today) {
      return NextResponse.json(
        { error: "Du kan inte boka ett datum som redan har passerat" },
        { status: 400 }
      );
    }

    // Clean up old pending bookings that haven't been paid (older than 30 minutes)
    // This frees up time slots if someone started booking but didn't complete payment
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    await prisma.booking.deleteMany({
      where: {
        status: 'pending',
        paymentStatus: 'pending',
        createdAt: {
          lt: thirtyMinutesAgo,
        },
      },
    });

    // Check if time slot is already booked
    // Only check for confirmed bookings or paid bookings (not pending payments)
    const existingBooking = await prisma.booking.findFirst({
      where: {
        date: bookingDate,
        time: time,
        OR: [
          { status: 'confirmed' },
          { paymentStatus: 'paid' }, // Paid but not yet confirmed by admin
        ],
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: "Denna tid är redan bokad" },
        { status: 400 }
      );
    }

    // Get service price
    const SERVICE_TYPES = {
      'golftraning': { price: 1079 },
      'mental-traning': { price: 1079 },
      'gruppträning': { price: 1079 },
    };
    const service = SERVICE_TYPES[serviceType];
    const amount = service ? service.price : 0;

    const booking = await prisma.booking.create({
      data: {
        userId: session.user.id,
        serviceType,
        date: bookingDate, // Use the correctly parsed date
        time,
        notes: notes || null,
        paymentMethod: paymentMethod || null,
        paymentStatus: paymentMethod === 'stripe' ? 'pending' : null,
        amount: paymentMethod === 'stripe' ? amount : null,
        status: 'pending',
      },
    });

    // If Stripe payment, return booking with payment initiation flag
    if (paymentMethod === 'stripe') {
      return NextResponse.json({
        ...booking,
        requiresPayment: true,
      }, { status: 201 });
    }

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Kunde inte skapa bokning" },
      { status: 500 }
    );
  }
}

