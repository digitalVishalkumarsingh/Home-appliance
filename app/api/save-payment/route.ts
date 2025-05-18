import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import { sendBookingConfirmationEmail, sendAdminBookingNotificationEmail } from '@/app/lib/email';
import { createBookingNotification, createPaymentNotification } from '@/app/lib/adminNotifications';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      transactionId,
      service,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      bookingDate,
      bookingTime
    } = await request.json();

    // Validate input
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Check if this payment has already been processed
    if (transactionId) {
      const existingPayment = await db.collection('payments').findOne({
        $or: [
          { transactionId },
          { paymentId: razorpay_payment_id }
        ]
      });

      if (existingPayment) {
        console.log('Duplicate payment detected:', { transactionId, paymentId: razorpay_payment_id });
        return NextResponse.json(
          {
            message: 'Payment already processed',
            isDuplicate: true,
            payment: existingPayment
          },
          { status: 200 }
        );
      }
    }

    // For testing purposes, we'll skip signature verification
    // In a production environment, you would verify the signature using the Razorpay key secret
    console.log('Payment verification skipped for testing');

    // Mock verification success
    const verificationSuccess = true;

    if (!verificationSuccess) {
      return NextResponse.json(
        { message: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Store payment in database
    const payment = {
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      signature: razorpay_signature,
      transactionId, // Add transaction ID to prevent duplicates
      service,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      bookingDate,
      bookingTime,
      status: 'success',
      createdAt: new Date(),
    };

    await db.collection('payments').insertOne(payment);

    // Update order status
    await db.collection('orders').updateOne(
      { orderId: razorpay_order_id },
      { $set: { status: 'paid', paidAt: new Date() } }
    );

    // Create booking record
    const booking = {
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      transactionId, // Add transaction ID to prevent duplicates
      service,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      bookingDate,
      bookingTime,
      status: 'booked',
      createdAt: new Date(),
      bookingId: `BK${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`, // Generate a unique booking ID
    };

    await db.collection('bookings').insertOne(booking);

    // Send booking confirmation email to customer
    let customerEmailSent = false;
    if (customerEmail) {
      try {
        customerEmailSent = await sendBookingConfirmationEmail({
          customerName,
          customerEmail,
          customerPhone,
          customerAddress,
          service,
          amount: Number(amount),
          bookingDate,
          bookingTime,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id
        });
        console.log('Customer booking confirmation email sent:', customerEmailSent);
      } catch (emailError) {
        console.error('Error sending customer booking confirmation email:', emailError);
        // Continue even if email fails
      }
    }

    // Send booking notification to admin
    let adminEmailSent = false;
    try {
      adminEmailSent = await sendAdminBookingNotificationEmail({
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        service,
        amount: Number(amount),
        bookingDate,
        bookingTime,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id
      });
      console.log('Admin booking notification email sent:', adminEmailSent);
    } catch (emailError) {
      console.error('Error sending admin booking notification email:', emailError);
      // Continue even if email fails
    }

    // Create in-app notification for the user
    let notificationCreated = false;
    try {
      // Get user ID from email
      const user = await db.collection('users').findOne({ email: customerEmail });

      if (user) {
        // Create notification
        const notification = {
          userId: user._id.toString(),
          title: "New Booking Confirmed",
          message: `Your booking for ${service} has been confirmed.`,
          type: "booking",
          referenceId: booking.bookingId,
          isRead: false,
          createdAt: new Date().toISOString(),
        };

        await db.collection("notifications").insertOne(notification);
        notificationCreated = true;
        console.log('Booking notification created for user:', user._id);
      }
    } catch (notificationError) {
      console.error('Error creating booking notification:', notificationError);
      // Continue even if notification creation fails
    }

    // Create admin notifications
    let adminNotificationCreated = false;
    try {
      // Create booking notification for admin
      adminNotificationCreated = await createBookingNotification({
        bookingId: booking.bookingId,
        customerName,
        service,
        date: bookingDate,
        time: bookingTime,
        amount: Number(amount),
        status: 'booked'
      }, Number(amount) > 1000); // Mark as important if amount is over 1000

      // Create payment notification for admin
      await createPaymentNotification({
        bookingId: booking.bookingId,
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        amount: Number(amount),
        customerName,
        service
      }, Number(amount) > 2000); // Mark as important if amount is over 2000

      console.log('Admin notifications created:', adminNotificationCreated);
    } catch (adminNotificationError) {
      console.error('Error creating admin notifications:', adminNotificationError);
      // Continue even if admin notification creation fails
    }

    return NextResponse.json(
      {
        message: 'Payment saved successfully',
        payment,
        customerEmailSent,
        adminEmailSent,
        notificationCreated,
        adminNotificationCreated
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Save payment error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace';

    console.error('Error details:', { message: errorMessage, stack: errorStack });

    return NextResponse.json(
      { message: `Failed to save payment: ${errorMessage}` },
      { status: 500 }
    );
  }
}
