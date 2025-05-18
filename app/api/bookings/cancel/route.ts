import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import { sendBookingUpdateEmail } from '@/app/lib/email';
import { createCancellationNotification } from '@/app/lib/adminNotifications';

export async function POST(request: Request) {
  try {
    const { bookingId, orderId, reason } = await request.json();

    // Validate input
    if (!bookingId || !orderId) {
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

    // Update booking status to cancelled
    await db.collection('bookings').updateOne(
      { _id: booking._id },
      {
        $set: {
          bookingStatus: 'cancelled',
          cancellationReason: reason,
          cancelledAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Update order status if exists
    if (orderId) {
      await db.collection('orders').updateOne(
        { orderId },
        {
          $set: {
            status: 'cancelled',
            cancellationReason: reason,
            cancelledAt: new Date(),
            updatedAt: new Date()
          }
        }
      );
    }

    // Send email notification
    try {
      if (booking.customerEmail) {
        await sendBookingUpdateEmail({
          type: 'cancellation',
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          service: booking.service,
          bookingDate: booking.bookingDate,
          bookingTime: booking.bookingTime,
          reason,
          bookingId: bookingId,
          orderId
        });
      }
    } catch (emailError) {
      console.error('Error sending booking cancellation email:', emailError);
      // Continue even if email fails
    }

    // Create admin notification for cancellation
    let adminNotificationCreated = false;
    try {
      adminNotificationCreated = await createCancellationNotification({
        bookingId: booking.bookingId || bookingId,
        _id: booking._id.toString(),
        customerName: booking.customerName,
        service: booking.service,
        date: booking.bookingDate,
        time: booking.bookingTime
      }, reason, true); // Cancellations are always important

      console.log('Admin cancellation notification created:', adminNotificationCreated);
    } catch (notificationError) {
      console.error('Error creating admin cancellation notification:', notificationError);
      // Continue even if notification creation fails
    }

    return NextResponse.json(
      {
        message: 'Booking cancelled successfully',
        booking: {
          ...booking,
          bookingStatus: 'cancelled',
          cancellationReason: reason,
          cancelledAt: new Date()
        },
        adminNotificationCreated
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cancel booking error:', error);
    return NextResponse.json(
      { message: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}
