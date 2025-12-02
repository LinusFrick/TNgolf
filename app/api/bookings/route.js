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

    const { serviceType, date, time, notes } = await request.json();

    if (!serviceType || !date || !time) {
      return NextResponse.json(
        { error: "Tjänst, datum och tid krävs" },
        { status: 400 }
      );
    }

    // Check if time slot is already booked
    const existingBooking = await prisma.booking.findFirst({
      where: {
        date: new Date(date),
        time: time,
        status: {
          in: ['pending', 'confirmed'],
        },
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: "Denna tid är redan bokad" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.create({
      data: {
        userId: session.user.id,
        serviceType,
        date: new Date(date),
        time,
        notes: notes || null,
        status: 'pending',
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Kunde inte skapa bokning" },
      { status: 500 }
    );
  }
}

