import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';

export async function GET(request: Request) {
  try {
    // Get the email from the query parameters
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { message: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Connect to the database
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Find orders by customer email
    // First check in the payments collection
    const payments = await db.collection('payments').find({
      'customerEmail': email
    }).toArray();

    // Get order IDs from payments
    const orderIds = payments.map(payment => payment.razorpay_order_id);

    // Find orders in the orders collection
    let orders = await db.collection('orders').find({
      $or: [
        { 'notes.customerEmail': email },
        { orderId: { $in: orderIds } }
      ]
    }).sort({ createdAt: -1 }).toArray();

    // Merge payment information with orders
    orders = orders.map(order => {
      const payment = payments.find(p => p.razorpay_order_id === order.orderId);
      if (payment) {
        return {
          ...order,
          paymentId: payment.razorpay_payment_id,
          status: 'paid'
        };
      }
      return order;
    });

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { message: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
