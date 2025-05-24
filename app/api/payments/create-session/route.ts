import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import stripe from "@/app/lib/stripe";
import { ObjectId } from "mongodb";

// Interfaces
interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

interface CreateSessionRequest {
  bookingId: string;
  amount: number;
  description: string;
}

export async function POST(request: Request) {
  try {
    // Extract token from request
    const token = getTokenFromRequest(new NextRequest(request));
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = (await verifyToken(token)) as JwtPayload;
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    // Parse request body
    const { bookingId, amount, description }: CreateSessionRequest = await request.json();

    // Validate input
    if (!bookingId || !amount) {
      return NextResponse.json(
        { success: false, message: "Booking ID and amount are required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Find booking
    const booking = await db.collection("bookings").findOne({ bookingId });
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `Booking #${bookingId}`,
              description: description || `Payment for service: ${booking.serviceName || booking.service}`,
            },
            unit_amount: amount * 100, // Convert to cents/paise
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_API_URL}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_API_URL}/payments/cancel?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        bookingId,
        userId: decoded.userId,
      },
    });

    // Create payment record in database
    await db.collection("payments").insertOne({
      bookingId,
      userId: decoded.userId,
      amount,
      currency: "inr",
      status: "pending",
      stripeSessionId: session.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Update booking with payment information
    await db.collection("bookings").updateOne(
      { bookingId },
      {
        $set: {
          paymentStatus: "pending",
          amount,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Payment session created",
      sessionId: session.id,
      sessionUrl: session.url,
    });
  } catch (error) {
    console.error("Create payment session error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
