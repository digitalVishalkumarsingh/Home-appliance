import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import { sendBookingReminderEmail } from '@/app/lib/email';
import { getTokenFromRequest, verifyToken } from '@/app/lib/auth';

// Interface for JWT payload
interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export async function POST(request: Request) {
  try {
    // Check authentication for admin or user
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token) as JwtPayload;
    if (!decoded) {
      return NextResponse.json(
        { message: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Parse request body
    const { bookingId, orderId } = await request.json();

    // Validate input
    if (!bookingId && !orderId) {
      return NextResponse.json(
        { message: 'Booking ID or Order ID is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Find the booking
    const booking = await db.collection('bookings').findOne({
      $or: [
        { bookingId },
        { paymentId: bookingId },
        { orderId }
      ]
    });

    if (!booking) {
      return NextResponse.json(
        { message: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to send reminder
    const isAdmin = decoded.role === 'admin';
    const isOwner = booking.customerEmail === decoded.email;
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { message: 'You do not have permission to send reminders for this booking' },
        { status: 403 }
      );
    }

    // Calculate hours remaining until booking
    let hoursRemaining = 48; // Default value
    if (booking.bookingDate) {
      const bookingDateTime = new Date(`${booking.bookingDate} ${booking.bookingTime || '12:00'}`);
      const now = new Date();
      const diffMs = bookingDateTime.getTime() - now.getTime();
      hoursRemaining = Math.floor(diffMs / (1000 * 60 * 60));
    }

    // Send reminder email
    const reminderSent = await sendBookingReminderEmail({
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      service: booking.service,
      bookingDate: booking.bookingDate,
      bookingTime: booking.bookingTime,
      bookingId: booking.bookingId || booking.paymentId,
      orderId: booking.orderId,
      hoursRemaining
    });

    // Update booking with reminder sent timestamp
    await db.collection('bookings').updateOne(
      { _id: booking._id },
      {
        $set: {
          lastReminderSent: new Date(),
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json(
      {
        message: 'Booking reminder sent successfully',
        reminderSent
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Send booking reminder error:', error);
    return NextResponse.json(
      { message: 'Failed to send booking reminder' },
      { status: 500 }
    );
  }
}
