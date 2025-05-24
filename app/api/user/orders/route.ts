import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Interfaces
interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export async function GET(request: Request) {
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
    const decoded = await verifyToken(token) as JwtPayload;
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Get user's bookings
    const bookings = await db
      .collection("bookings")
      .find({ 
        $or: [
          { userId: decoded.userId },
          { name: { $regex: new RegExp(decoded.email.split('@')[0], 'i') } } // Match by email username part
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Get payment information for each booking
    const bookingsWithPayments = await Promise.all(
      bookings.map(async (booking) => {
        const payment = await db
          .collection("payments")
          .findOne({ bookingId: booking.bookingId });
        
        return {
          ...booking,
          payment: payment || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      orders: bookingsWithPayments,
    });
  } catch (error) {
    console.error("Get user orders error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
