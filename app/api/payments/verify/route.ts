import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import crypto from "crypto";

// Interfaces
interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export async function POST(request: Request) {
  try {
    // Extract token from request
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken(token) as JwtPayload;
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    // Parse request body
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature }: VerifyPaymentRequest = await request.json();

    // Validate input
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { success: false, message: "All payment details are required" },
        { status: 400 }
      );
    }

    // Verify payment signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json(
        { success: false, message: "Server configuration error" },
        { status: 500 }
      );
    }

    // Create a signature using the order ID and payment ID
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    // Compare the signatures
    const isSignatureValid = expectedSignature === razorpaySignature;

    if (!isSignatureValid) {
      return NextResponse.json(
        { success: false, message: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Find payment by Razorpay order ID
    const payment = await db.collection("payments").findOne({ razorpayOrderId });
    if (!payment) {
      return NextResponse.json(
        { success: false, message: "Payment record not found" },
        { status: 404 }
      );
    }

    // Update payment status
    await db.collection("payments").updateOne(
      { razorpayOrderId },
      {
        $set: {
          status: "completed",
          razorpayPaymentId,
          razorpaySignature,
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

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
    });
  } catch (error) {
    console.error("Verify payment error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
