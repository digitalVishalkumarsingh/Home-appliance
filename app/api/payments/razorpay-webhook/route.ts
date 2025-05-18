import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { headers } from "next/headers";
import crypto from "crypto";

// Disable body parsing for raw body access
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to read the request body as text
async function readBody(readable: ReadableStream): Promise<string> {
  const chunks: Uint8Array[] = [];
  const reader = readable.getReader();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  return new TextDecoder().decode(Buffer.concat(chunks));
}

export async function POST(request: Request) {
  try {
    // Get the signature from the headers
    const headersList = headers();
    const signature = headersList.get("x-razorpay-signature");
    
    if (!signature) {
      return NextResponse.json(
        { success: false, message: "Missing Razorpay signature" },
        { status: 400 }
      );
    }

    // Get the webhook secret from environment variables
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not set");
      return NextResponse.json(
        { success: false, message: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Get the raw body
    const body = await readBody(request.body as ReadableStream);
    
    // Verify the signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("Webhook signature verification failed");
      return NextResponse.json(
        { success: false, message: "Invalid signature" },
        { status: 400 }
      );
    }

    // Parse the event data
    const event = JSON.parse(body);
    
    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Handle the event based on its type
    switch (event.event) {
      case "payment.authorized": {
        const payment = event.payload.payment.entity;
        const orderId = payment.order_id;
        
        // Find the payment record by Razorpay order ID
        const paymentRecord = await db.collection("payments").findOne({ razorpayOrderId: orderId });
        
        if (!paymentRecord) {
          console.error(`Payment record not found for order ID: ${orderId}`);
          return NextResponse.json(
            { success: false, message: "Payment record not found" },
            { status: 404 }
          );
        }

        // Update payment status in database
        await db.collection("payments").updateOne(
          { razorpayOrderId: orderId },
          {
            $set: {
              status: "completed",
              razorpayPaymentId: payment.id,
              paymentMethod: payment.method,
              updatedAt: new Date(),
            },
          }
        );

        // Update booking status
        await db.collection("bookings").updateOne(
          { bookingId: paymentRecord.bookingId },
          {
            $set: {
              paymentStatus: "paid",
              updatedAt: new Date(),
            },
          }
        );

        break;
      }
      case "payment.failed": {
        const payment = event.payload.payment.entity;
        const orderId = payment.order_id;
        
        // Update payment status in database
        await db.collection("payments").updateOne(
          { razorpayOrderId: orderId },
          {
            $set: {
              status: "failed",
              razorpayPaymentId: payment.id,
              updatedAt: new Date(),
            },
          }
        );
        
        break;
      }
      // Add more event handlers as needed
    }

    return NextResponse.json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error("Webhook error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
