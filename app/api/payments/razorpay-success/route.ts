import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";

export async function GET(request: Request) {
  try {
    // Get payment ID and order ID from URL
    const url = new URL(request.url);
    const paymentId = url.searchParams.get("razorpay_payment_id");
    const orderId = url.searchParams.get("razorpay_order_id");
    const bookingId = url.searchParams.get("bookingId");

    if (!paymentId || !orderId || !bookingId) {
      return NextResponse.json(
        { success: false, message: "Missing payment details" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Get payment details from database
    const payment = await db.collection("payments").findOne({ razorpayOrderId: orderId });
    
    if (!payment) {
      return NextResponse.json(
        { success: false, message: "Payment not found" },
        { status: 404 }
      );
    }

    // If payment is still pending but we have a payment ID, update it
    if (payment.status === "pending" && paymentId) {
      // Update payment status
      await db.collection("payments").updateOne(
        { razorpayOrderId: orderId },
        {
          $set: {
            status: "completed",
            razorpayPaymentId: paymentId,
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
    }

    // Redirect to order confirmation page
    return NextResponse.redirect(new URL(`/profile/orders?success=true&bookingId=${bookingId}`, request.url));
  } catch (error) {
    console.error("Razorpay success error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
