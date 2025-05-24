import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";

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

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Get payment details from database
    const payment = await db.collection("payments").findOne({ stripeSessionId: sessionId });
    
    if (!payment) {
      return NextResponse.json(
        { success: false, message: "Payment not found" },
        { status: 404 }
      );
    }

    // Update payment status to cancelled
    await db.collection("payments").updateOne(
      { stripeSessionId: sessionId },
      {
        $set: {
          status: "cancelled",
          updatedAt: new Date(),
        },
      }
    );

    // Redirect to booking page with cancelled status
    return NextResponse.redirect(new URL(`/profile/orders?cancelled=true&bookingId=${payment.bookingId}`, request.url));
  } catch (error) {
    console.error("Payment cancel error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
