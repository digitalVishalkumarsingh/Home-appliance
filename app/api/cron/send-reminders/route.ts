import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import { sendBookingReminderEmail } from '@/app/lib/email';

// This endpoint should be called by a cron job service like Vercel Cron
// or an external service like cron-job.org
export async function GET(request: Request) {
  try {
    // Optional: Add API key validation for security
    const url = new URL(request.url);
    const apiKey = url.searchParams.get('apiKey');
    
    if (!apiKey || apiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get current date
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format dates for query
    const todayStr = now.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Find bookings for today and tomorrow that haven't received reminders in the last 12 hours
    const bookings = await db.collection('bookings').find({
      $or: [
        { bookingDate: todayStr },
        { bookingDate: tomorrowStr }
      ],
      bookingStatus: { $nin: ['cancelled', 'completed'] },
      $or: [
        { lastReminderSent: { $exists: false } },
        { lastReminderSent: { $lt: new Date(now.getTime() - 12 * 60 * 60 * 1000) } }
      ]
    }).toArray();

    console.log(`Found ${bookings.length} bookings that need reminders`);

    // Send reminders for each booking
    const results = await Promise.all(bookings.map(async (booking) => {
      try {
        // Calculate hours remaining until booking
        let hoursRemaining = 48; // Default value
        if (booking.bookingDate) {
          const bookingDateTime = new Date(`${booking.bookingDate} ${booking.bookingTime || '12:00'}`);
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

        return {
          bookingId: booking.bookingId || booking.paymentId,
          success: reminderSent
        };
      } catch (error) {
        console.error(`Error sending reminder for booking ${booking.bookingId || booking.paymentId}:`, error);
        return {
          bookingId: booking.bookingId || booking.paymentId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }));

    // Count successful reminders
    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      message: `Sent ${successCount} of ${bookings.length} booking reminders`,
      results
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { 
        message: 'Failed to process booking reminders',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
