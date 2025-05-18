import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import { sendBookingUpdateEmail } from '@/app/lib/email';

export async function POST(request: Request) {
  try {
    const { bookingId, orderId, newDate, newTime } = await request.json();

    // Validate input
    if (!bookingId || !orderId || !newDate || !newTime) {
      return NextResponse.json(
        { message: 'Missing required fields' },
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

    // Update booking with new date and time
    await db.collection('bookings').updateOne(
      { _id: booking._id },
      {
        $set: {
          bookingDate: newDate,
          bookingTime: newTime,
          updatedAt: new Date(),
          bookingStatus: 'rescheduled'
        }
      }
    );

    // Update order notes if exists
    if (orderId) {
      await db.collection('orders').updateOne(
        { orderId },
        {
          $set: {
            'notes.bookingDate': newDate,
            'notes.bookingTime': newTime,
            updatedAt: new Date()
          }
        }
      );
    }

    // Send email notification
    try {
      if (booking.customerEmail) {
        await sendBookingUpdateEmail({
          type: 'reschedule',
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          service: booking.service,
          oldDate: booking.bookingDate,
          oldTime: booking.bookingTime,
          newDate,
          newTime,
          bookingId: bookingId,
          orderId
        });
      }
    } catch (emailError) {
      console.error('Error sending booking update email:', emailError);
      // Continue even if email fails
    }

    return NextResponse.json(
      {
        message: 'Booking rescheduled successfully',
        booking: {
          ...booking,
          bookingDate: newDate,
          bookingTime: newTime,
          bookingStatus: 'rescheduled'
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reschedule booking error:', error);
    return NextResponse.json(
      { message: 'Failed to reschedule booking' },
      { status: 500 }
    );
  }
}
