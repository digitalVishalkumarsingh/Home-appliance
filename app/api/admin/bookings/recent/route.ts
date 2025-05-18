import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";

// Get recent bookings for admin dashboard
export async function GET(request: Request) {
  try {
    // Verify admin authentication
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded || (decoded as {role?: string}).role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Parse URL to get limit parameter
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 5;

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get recent bookings
    const recentBookings = await db
      .collection("bookings")
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    // Process bookings to ensure consistent format
    const processedBookings = recentBookings.map(booking => {
      // Ensure _id is converted to string
      const bookingId = booking._id ? booking._id.toString() : booking.id;

      return {
        ...booking,
        _id: bookingId,
        id: bookingId,
        // Ensure these fields exist with default values if missing
        status: booking.status || "pending",
        paymentStatus: booking.paymentStatus || "pending",
        amount: booking.amount || 0,
        createdAt: booking.createdAt || new Date().toISOString()
      };
    });

    // Always return a valid JSON response with success flag
    return NextResponse.json({
      success: true,
      bookings: processedBookings || []
    });
  } catch (error) {
    console.error("Error fetching recent bookings:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
