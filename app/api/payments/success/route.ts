import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import stripe from "@/app/lib/stripe";

export async function GET(request: Request) {
  try {
    // Get session ID from URL
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: "Session ID is required" },
        { status: 400 }
      );
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Invalid session ID" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get payment details from database
    const payment = await db.collection("payments").findOne({ stripeSessionId: sessionId });
    
    if (!payment) {
      return NextResponse.json(
        { success: false, message: "Payment not found" },
        { status: 404 }
      );
    }

    // If payment is still pending but session is complete, update it
    if (payment.status === "pending" && session.payment_status === "paid") {
      // Update payment status
      await db.collection("payments").updateOne(
        { stripeSessionId: sessionId },
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
        { bookingId: payment.bookingId },
        {
          $set: {
            paymentStatus: "paid",
            updatedAt: new Date(),
          },
        }
      );
    }

    // Redirect to order confirmation page
    return NextResponse.redirect(new URL(`/profile/orders?success=true&bookingId=${payment.bookingId}`, request.url));
  } catch (error) {
    console.error("Payment success error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
