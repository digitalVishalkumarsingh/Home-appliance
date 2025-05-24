import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';

// Razorpay initialization
import Razorpay from 'razorpay';

// Get Razorpay keys from environment variables
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// Only log in development mode
if (process.env.NODE_ENV === 'development') {
  console.log('RAZORPAY_KEY_ID:', RAZORPAY_KEY_ID ? 'Exists' : 'Missing');
  console.log('RAZORPAY_KEY_SECRET:', RAZORPAY_KEY_SECRET ? 'Exists' : 'Missing');
}

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error('Razorpay keys are missing in environment variables');
}

// Initialize Razorpay with fallback for testing
let razorpay;
try {
  razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: RAZORPAY_KEY_SECRET || 'test_secret_placeholder',
  });
} catch (error) {
  console.error('Failed to initialize Razorpay:', error);
  // Create a mock Razorpay instance for testing
  razorpay = {
    orders: {
      create: async () => ({ id: 'mock_order_' + Date.now() })
    }
  };
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
    const order = {
      id: mockOrderId,
      entity: "order",
      amount: amount * 100,
      amount_paid: 0,
      amount_due: amount * 100,
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
      const { db } = await connectToDatabase({ timeoutMs: 10000 });
      await db.collection('orders').insertOne({
        orderId: order.id,
        amount: order.amount,
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
