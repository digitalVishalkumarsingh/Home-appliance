import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/app/lib/auth";

export async function POST(request: Request) {
  try {
    // Verify user authentication
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded || typeof decoded === 'string' || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // Parse request body
    const { bookingId, service, date, time } = await request.json();

    // Validate required fields
    if (!bookingId || !service) {
      return NextResponse.json(
        { success: false, message: "Booking ID and service are required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get booking details
    const booking = await db.collection("bookings").findOne({ 
      $or: [
        { _id: bookingId },
        { bookingId: bookingId }
      ]
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Format date and time for display
    const formattedDate = date ? new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) : 'Not scheduled';
    
    const formattedTime = time || 'Not specified';

    // Create notification
    const notification = {
      userId: decoded.userId,
      title: "New Booking Confirmed",
      message: `Your booking for ${service} on ${formattedDate} at ${formattedTime} has been confirmed.`,
      type: "booking",
      referenceId: booking._id.toString(),
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection("notifications").insertOne(notification);

    return NextResponse.json({
      success: true,
      message: "Booking notification created",
      notification: {
        ...notification,
        _id: result.insertedId,
      },
    });
  } catch (error) {
    console.error("Error creating booking notification:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
