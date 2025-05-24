import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Get user's bookings
export async function GET(request: Request) {
  try {
    // Verify user authentication
    const nextRequest = request instanceof Request && !(request instanceof NextRequest)
      ? new NextRequest(request.url, { headers: request.headers, method: request.method, body: (request as any).body })
      : (request as NextRequest);
    const token = getTokenFromRequest(nextRequest);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded || typeof decoded !== "object" || !("userId" in decoded)) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Get user details to match by email and phone as well
    const userIdStr = typeof decoded.userId === "string" ? decoded.userId : String(decoded.userId);
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(userIdStr) },
      { projection: { email: 1, phone: 1 } }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Build query to find bookings by user ID, email, or phone
    const query = {
      $or: [
        { userId: decoded.userId },
        { customerEmail: user.email },
        { email: user.email },
        { customerPhone: user.phone },
        { phone: user.phone }
      ]
    };

    // Parse query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const skip = parseInt(url.searchParams.get("skip") || "0");

    // Add status filter if provided
    if (status) {
      query.$or = query.$or.map(condition => ({
        ...condition,
        $or: [
          { status: status },
          { bookingStatus: status }
        ]
      }));
    }

    // Get bookings
    const bookings = await db
      .collection("bookings")
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get orders that might contain booking information
    const orders = await db
      .collection("orders")
      .find({
        $or: [
          { "notes.customerEmail": user.email },
          { "notes.email": user.email },
          { "notes.customerPhone": user.phone },
          { "notes.phone": user.phone }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Combine bookings and orders, removing duplicates
    const allBookings = [...bookings];
    
    // Add orders that don't have a corresponding booking
    for (const order of orders) {
      // Check if this order is already included in bookings
      const existingBooking = bookings.find(
        booking => 
          booking.orderId === order.orderId || 
          booking.bookingId === order.bookingId
      );
      
      if (!existingBooking) {
        // Convert order to booking format
        allBookings.push({
          _id: order._id,
          orderId: order.orderId,
          bookingId: order.bookingId,
          service: order.notes?.service || "Service",
          customerName: order.notes?.customerName,
          customerEmail: order.notes?.customerEmail,
          customerPhone: order.notes?.customerPhone,
          address: order.notes?.customerAddress,
          date: order.notes?.bookingDate,
          time: order.notes?.bookingTime,
          status: order.status || "pending",
          paymentStatus: order.paymentStatus || "pending",
          amount: order.amount || 0,
          createdAt: order.createdAt || new Date(),
          notes: order.notes || {}
        });
      }
    }

    // Get total count for pagination
    const totalCount = await db
      .collection("bookings")
      .countDocuments(query);

    return NextResponse.json({
      success: true,
      bookings: allBookings,
      totalCount,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
