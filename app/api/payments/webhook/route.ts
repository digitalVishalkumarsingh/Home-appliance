import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import stripe from "@/app/lib/stripe";
import { headers } from "next/headers";

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
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");
    
    if (!signature) {
      return NextResponse.json(
        { success: false, message: "Missing Stripe signature" },
        { status: 400 }
      );
    }

    // Get the webhook secret from environment variables
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not set");
      return NextResponse.json(
        { success: false, message: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Get the raw body
    const body = await readBody(request.body as ReadableStream);
    
    // Verify the event
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      return NextResponse.json(
        { success: false, message: "Invalid signature" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const { bookingId, userId } = session.metadata;

        // Update payment status in database
        await db.collection("payments").updateOne(
          { stripeSessionId: session.id },
          {
            $set: {
              status: "completed",
              stripePaymentId: session.payment_intent,
              paymentMethod: session.payment_method_types[0],
              updatedAt: new Date(),
            },
          }
        );

        // Update booking status
        await db.collection("bookings").updateOne(
          { bookingId },
          {
            $set: {
              paymentStatus: "paid",
              updatedAt: new Date(),
            },
          }
        );

        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as any;
        
        // Update payment status in database
        await db.collection("payments").updateOne(
          { stripeSessionId: session.id },
          {
            $set: {
              status: "failed",
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

