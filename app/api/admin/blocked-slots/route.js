import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../../auth/[...nextauth]/route";
import { isCoachEmail } from "../../../lib/isCoach";

const prisma = new PrismaClient();

// GET - Get all blocked slots
export async function GET(request) {
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

    const blockedSlots = await prisma.blockedSlot.findMany({
      orderBy: {
        date: 'asc',
      },
    });

    return NextResponse.json(blockedSlots);
  } catch (error) {
    console.error("Error fetching blocked slots:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta blockerade tider" },
      { status: 500 }
    );
  }
}

// POST - Block a time slot
export async function POST(request) {
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

    const { date, time, reason } = await request.json();

    if (!date || !time) {
      return NextResponse.json(
        { error: "Datum och tid krävs" },
        { status: 400 }
      );
    }

    // Check if slot is already booked
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

    // Check if already blocked - use the unique constraint
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    
    // Check if slot is already blocked
    const existingBlock = await prisma.blockedSlot.findFirst({
      where: {
        date: dateObj,
        time: time,
      },
    });

    if (existingBlock) {
      return NextResponse.json(
        { error: "Denna tid är redan blockerad" },
        { status: 400 }
      );
    }

    const blockedSlot = await prisma.blockedSlot.create({
      data: {
        date: dateObj,
        time,
        reason: reason || null,
      },
    });

    return NextResponse.json(blockedSlot, { status: 201 });
  } catch (error) {
    console.error("Error blocking slot:", error);
    return NextResponse.json(
      { error: "Kunde inte blockera tid" },
      { status: 500 }
    );
  }
}

// DELETE - Unblock a time slot
export async function DELETE(request) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "ID krävs" },
        { status: 400 }
      );
    }

    await prisma.blockedSlot.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Blockering borttagen" });
  } catch (error) {
    console.error("Error unblocking slot:", error);
    return NextResponse.json(
      { error: "Kunde inte ta bort blockering" },
      { status: 500 }
    );
  }
}

