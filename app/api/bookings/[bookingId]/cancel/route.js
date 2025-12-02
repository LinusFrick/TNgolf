import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { sendCancellationRequestEmail } from "../../../../lib/email";

const prisma = new PrismaClient();

export async function POST(request, { params }) {
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
    const bookingId = resolvedParams?.bookingId || params?.bookingId;

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
        { error: "Du har inte behörighet att avboka denna bokning" },
        { status: 403 }
      );
    }

    // Check if already cancelled or cancellation already requested
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: "Bokningen är redan avbokad" },
        { status: 400 }
      );
    }

    if (booking.cancellationRequest === 'pending') {
      return NextResponse.json(
        { error: "Avbokningsförfrågan är redan skickad och väntar på svar" },
        { status: 400 }
      );
    }

    // Update booking with cancellation request
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        cancellationRequest: 'pending',
        cancellationRequestedAt: new Date(),
      },
    });

    // Send email to admin
    try {
      await sendCancellationRequestEmail(updatedBooking, booking.user);
    } catch (emailError) {
      console.error('Failed to send cancellation request email:', emailError);
      // Continue even if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Avbokningsförfrågan har skickats till admin",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Error requesting cancellation:", error);
    return NextResponse.json(
      { error: "Kunde inte skicka avbokningsförfrågan" },
      { status: 500 }
    );
  }
}

