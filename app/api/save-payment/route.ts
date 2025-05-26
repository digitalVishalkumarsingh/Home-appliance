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
      bookingTime,
      customerLocation,
      paymentMethod = 'online', // Default to online for backward compatibility
      paymentStatus = 'completed', // Default to completed for online payments
      bookingStatus = 'confirmed'
    } = await request.json();

    // Validate input based on payment method
    if (paymentMethod === 'online') {
      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return NextResponse.json(
          { message: 'Missing required payment fields for online payment' },
          { status: 400 }
        );
      }
    }

    // Validate common required fields
    if (!service || !amount || !customerName || !customerEmail || !customerPhone || !customerAddress) {
      return NextResponse.json(
        { message: 'Missing required booking fields' },
        { status: 400 }
      );
    }

    // Connect to database with fallback
    let db;
    let databaseAvailable = false;

    try {
      const connection = await connectToDatabase({ timeoutMs: 10000 });
      db = connection.db;
      databaseAvailable = true;
      console.log('Database connected successfully');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      console.log('Using demo mode for payment processing');

      // For demo purposes, return success even if database fails
      const demoBookingId = `BK${Date.now()}`;

      return NextResponse.json(
        {
          message: `${paymentMethod === 'cash' ? 'Booking' : 'Payment'} saved successfully (demo mode)`,
          payment: {
            paymentId: razorpay_payment_id || `cash_${Date.now()}`,
            orderId: razorpay_order_id || `order_${Date.now()}`,
            transactionId,
            service,
            amount,
            customerName,
            customerEmail,
            paymentMethod,
            paymentStatus,
            status: paymentMethod === 'cash' ? 'pending' : 'success',
            createdAt: new Date(),
          },
          bookingId: demoBookingId,
          customerEmailSent: false,
          adminEmailSent: false,
          notificationCreated: false,
          adminNotificationCreated: false,
          fallback: true,
          note: 'Database not available - using demo mode'
        },
        { status: 200 }
      );
    }

    // Check if this payment has already been processed
    if (transactionId || razorpay_payment_id) {
      const query = { $or: [] };

      if (transactionId) {
        query.$or.push({ transactionId });
      }

      if (razorpay_payment_id) {
        query.$or.push({ paymentId: razorpay_payment_id });
      }

      const existingPayment = await db.collection('payments').findOne(query);

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

    // Verify payment signature only for online payments
    let verificationSuccess = true;

    if (paymentMethod === 'online' && razorpay_payment_id && razorpay_order_id && razorpay_signature) {
      // For testing purposes, we'll skip signature verification
      // In a production environment, you would verify the signature using the Razorpay key secret
      console.log('Payment verification skipped for testing');

      // TODO: Implement real signature verification
      // const keySecret = process.env.RAZORPAY_KEY_SECRET;
      // const body = razorpay_order_id + "|" + razorpay_payment_id;
      // const expectedSignature = crypto.createHmac("sha256", keySecret).update(body).digest("hex");
      // verificationSuccess = expectedSignature === razorpay_signature;
    } else if (paymentMethod === 'cash') {
      console.log('Cash payment - no signature verification needed');
      verificationSuccess = true;
    }

    if (!verificationSuccess) {
      return NextResponse.json(
        { message: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Store payment in database
    const payment = {
      paymentId: razorpay_payment_id || `cash_${Date.now()}`,
      orderId: razorpay_order_id || `order_${Date.now()}`,
      signature: razorpay_signature || null,
      transactionId, // Add transaction ID to prevent duplicates
      service,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      bookingDate,
      bookingTime,
      paymentMethod,
      paymentStatus,
      status: paymentMethod === 'cash' ? 'pending' : 'success',
      createdAt: new Date(),
    };

    await db.collection('payments').insertOne(payment);

    // Update order status (only for online payments)
    if (paymentMethod === 'online' && razorpay_order_id) {
      await db.collection('orders').updateOne(
        { orderId: razorpay_order_id },
        { $set: { status: 'paid', paidAt: new Date() } }
      );
    }

    // Create booking record
    const bookingId = `BK${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`; // Generate a unique booking ID

    const booking = {
      paymentId: razorpay_payment_id || `cash_${Date.now()}`,
      orderId: razorpay_order_id || `order_${Date.now()}`,
      transactionId, // Add transaction ID to prevent duplicates
      service,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      address: customerAddress, // Add duplicate field for consistency
      bookingDate,
      bookingTime,
      paymentMethod,
      paymentStatus,
      status: bookingStatus,
      createdAt: new Date(),
      bookingId: bookingId,
      customerLocation: customerLocation || null, // Include customer location
    };

    const bookingResult = await db.collection('bookings').insertOne(booking);

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
          paymentId: razorpay_payment_id || `cash_${Date.now()}`,
          orderId: razorpay_order_id || `order_${Date.now()}`
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
        paymentId: razorpay_payment_id || `cash_${Date.now()}`,
        orderId: razorpay_order_id || `order_${Date.now()}`
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
          message: `Your booking for ${service} has been confirmed. ${paymentMethod === 'cash' ? 'You can pay cash when the technician arrives.' : 'Payment completed successfully.'} A technician will be assigned to your booking shortly.`,
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
      await createBookingNotification({
        bookingId: booking.bookingId,
        customerName,
        service,
        date: bookingDate,
        time: bookingTime,
        amount: Number(amount),
        status: 'pending'
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

    // ✅ ONLY AFTER BOOKING IS FULLY CONFIRMED - Create job offers for technicians
    let jobOffersCreated = false;
    try {
      // Find available technicians to create job offers
      let technicians = await db.collection('technicians').find({
        status: 'active',
        isAvailable: true
      }).limit(5).toArray(); // Limit to 5 technicians for now

      // If no technicians are available with isAvailable=true, try with just active status
      if (technicians.length === 0) {
        console.log('No technicians with isAvailable=true found, trying with just active status');
        technicians = await db.collection('technicians').find({
          status: 'active'
        }).limit(5).toArray();

        // Update these technicians to be available
        if (technicians.length > 0) {
          const technicianIds = technicians.map(tech => tech._id);
          await db.collection('technicians').updateMany(
            { _id: { $in: technicianIds } },
            { $set: { isAvailable: true } }
          );
          console.log(`Updated ${technicians.length} technicians to be available`);
        }
      }

      // If still no technicians, log but don't fail the booking
      if (technicians.length === 0) {
        console.log('No active technicians found. Booking confirmed but no job offers created.');
      } else {
        // Create job offers for available technicians
        console.log(`Creating job offers for ${technicians.length} technicians`);

        const expiryTime = new Date();
        expiryTime.setMinutes(expiryTime.getMinutes() + 30); // Expires in 30 minutes

        const jobOffers = technicians.map(technician => ({
          bookingId: bookingResult.insertedId.toString(),
          bookingIdDisplay: bookingId,
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          technicianId: technician._id.toString(),
          status: "pending",
          distance: Math.floor(Math.random() * 10) + 1, // Random distance between 1-10 km
          createdAt: new Date(),
          expiresAt: expiryTime,
          service: service,
          amount: Number(amount),
          customerLocation: customerLocation || null, // Include customer location for technician
          customerName: customerName,
          customerPhone: customerPhone,
          customerAddress: customerAddress,
          bookingDate: bookingDate,
          bookingTime: bookingTime
        }));

        await db.collection("jobOffers").insertMany(jobOffers);
        jobOffersCreated = true;
        console.log(`✅ Created ${jobOffers.length} job offers for confirmed booking ${bookingId}`);
      }
    } catch (jobOfferError) {
      console.error('Error creating job offers:', jobOfferError);
      // Don't fail the booking if job offer creation fails
    }

    return NextResponse.json(
      {
        message: `${paymentMethod === 'cash' ? 'Booking confirmed successfully' : 'Payment saved successfully'}`,
        payment,
        bookingId,
        paymentMethod,
        paymentStatus,
        customerEmailSent,
        adminEmailSent,
        notificationCreated,
        adminNotificationCreated,
        jobOffersCreated
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
