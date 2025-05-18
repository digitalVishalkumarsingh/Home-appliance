import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";

export async function GET(request: Request) {
  try {
    // Get order ID and booking ID from URL
    const url = new URL(request.url);
    const orderId = url.searchParams.get("razorpay_order_id");
    const bookingId = url.searchParams.get("bookingId");

    if (!orderId || !bookingId) {
      return NextResponse.json(
        { success: false, message: "Missing payment details" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get payment details from database
    const payment = await db.collection("payments").findOne({ razorpayOrderId: orderId });
    
    if (!payment) {
      return NextResponse.json(
        { success: false, message: "Payment not found" },
        { status: 404 }
      );
    }

    // Update payment status to cancelled
    await db.collection("payments").updateOne(
      { razorpayOrderId: orderId },
      {
        $set: {
          status: "cancelled",
          updatedAt: new Date(),
        },
      }
    );

    // Redirect to booking page with cancelled status
    return NextResponse.redirect(new URL(`/profile/orders?cancelled=true&bookingId=${bookingId}`, request.url));
  } catch (error) {
    console.error("Razorpay cancel error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
