import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { isCoachEmail } from "../../../../lib/isCoach";

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

    const { id } = params;
    const { status } = await request.json();

    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: "Ogiltig status" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.update({
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

    return NextResponse.json(booking);
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

    const { id } = params;

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

