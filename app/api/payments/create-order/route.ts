import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';

// Get Razorpay keys from environment variables
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// Only log in development mode
if (process.env.NODE_ENV === 'development') {
  console.log('RAZORPAY_KEY_ID:', RAZORPAY_KEY_ID ? 'Exists' : 'Missing');
  console.log('RAZORPAY_KEY_SECRET:', RAZORPAY_KEY_SECRET ? 'Exists' : 'Missing');
}

export async function POST(request: Request) {
  try {
    const { amount, currency, receipt, notes } = await request.json();

    // Validate input
    if (!amount || !currency || !receipt) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a mock order for testing purposes
    // This simulates a successful Razorpay order creation
    const mockOrderId = `order_${Date.now()}${Math.floor(Math.random() * 1000)}`;
    // Debug log to help troubleshoot amount issues
    console.log('Original amount received:', amount, typeof amount);

    // Razorpay expects amount in paise (smallest currency unit)
    // Our database may store amounts with decimal places (like 539.1), so we need to convert to paise
    const amountInPaise = Math.round(amount * 100);

    console.log('Amount in paise:', amountInPaise);

    const order = {
      id: mockOrderId,
      entity: "order",
      amount: amountInPaise,
      amount_paid: 0,
      amount_due: amountInPaise,
      currency: currency,
      receipt: receipt,
      status: "created",
      attempts: 0,
      notes: notes,
      created_at: Math.floor(Date.now() / 1000)
    };

    console.log('Mock order created:', order);

    // Store order in database
    try {
      const { db } = await connectToDatabase();
      await db.collection('orders').insertOne({
        orderId: order.id,
        amount: amount, // Store original amount in rupees
        amountInPaise: order.amount, // Also store amount in paise for reference
        currency: order.currency,
        receipt: order.receipt,
        notes: order.notes,
        status: order.status,
        createdAt: new Date(),
      });
      console.log('Order saved to database');
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Continue even if database save fails
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { message: 'Failed to create order' },
      { status: 500 }
    );
  }
}
