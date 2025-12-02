import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Available time slots (matching the calendar view)
const TIME_SLOTS = [
  '10:00', '10:30', '10:45', '11:00', '11:30', '11:45',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
];

// Generate dates for the next 3 months
function generateDateRange() {
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Start from tomorrow
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() + 1);
  
  // End 3 months from now
  const endDate = new Date(today);
  endDate.setMonth(endDate.getMonth() + 3);
  
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    // Skip Sundays (day 0) - adjust if needed
    if (currentDate.getDay() !== 0) {
      dates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get('serviceType');
    
    // Get all dates in range
    const dateRange = generateDateRange();
    
    // Get all existing bookings (all services, not filtered by serviceType for availability check)
    // This ensures we check all bookings to see what's actually booked
    const existingBookings = await prisma.booking.findMany({
      where: {
        status: {
          in: ['pending', 'confirmed'],
        },
      },
      select: {
        date: true,
        time: true,
        serviceType: true,
      },
    });
    
    // Get all blocked slots
    const blockedSlots = await prisma.blockedSlot.findMany({
      select: {
        date: true,
        time: true,
      },
    });
    
    // Create a set of booked slots for quick lookup
    // Format: "YYYY-MM-DD_TIME" for all bookings and blocked slots
    const bookedSlots = new Set();
    existingBookings.forEach(booking => {
      // Convert date to YYYY-MM-DD format for comparison
      const bookingDate = new Date(booking.date);
      const dateStr = bookingDate.toISOString().split('T')[0];
      bookedSlots.add(`${dateStr}_${booking.time}`);
    });
    
    // Add blocked slots to booked slots
    blockedSlots.forEach(block => {
      const blockDate = new Date(block.date);
      const dateStr = blockDate.toISOString().split('T')[0];
      bookedSlots.add(`${dateStr}_${block.time}`);
    });
    
    // Build available slots
    const availableSlots = [];
    
    dateRange.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      const availableTimes = [];
      
      TIME_SLOTS.forEach(time => {
        const slotKey = `${dateStr}_${time}`;
        if (!bookedSlots.has(slotKey)) {
          availableTimes.push(time);
        }
      });
      
      if (availableTimes.length > 0) {
        availableSlots.push({
          date: dateStr,
          dateObj: date,
          times: availableTimes,
        });
      }
    });
    
    return NextResponse.json(availableSlots);
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json(
      { error: "Kunde inte hämta tillgängliga tider" },
      { status: 500 }
    );
  }
}

