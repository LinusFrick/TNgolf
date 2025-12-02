import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../auth/[...nextauth]/route";
import { sendBookingConfirmationEmail } from "../../lib/email";

const prisma = new PrismaClient();

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

    if (booking.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Du har inte behörighet för denna bokning" },
        { status: 403 }
      );
    }

    // Send test email
    try {
      const result = await sendBookingConfirmationEmail(booking, booking.user);
      return NextResponse.json({
        success: true,
        message: "Test-e-post skickad!",
        emailResult: result,
      });
    } catch (emailError) {
      console.error("Error sending test email:", emailError);
      return NextResponse.json(
        {
          success: false,
          error: "Kunde inte skicka e-post",
          details: emailError.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in test email endpoint:", error);
    return NextResponse.json(
      { error: "Något gick fel" },
      { status: 500 }
    );
  }
}

