import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Helper function to handle both PATCH and PUT requests
async function updateBookingStatus(request: Request, context: { params: Promise<{ id: string }> }) {
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

    // Get params from context
    const params = await context.params;
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Booking ID is required" },
        { status: 400 }
      );
    }

    // Get status from request body
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json(
        { success: false, message: "Status is required" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status value" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Find booking by ID (try different ID formats)
    const booking = await db.collection("bookings").findOne({
      $or: [
        { _id: ObjectId.isValid(id) ? new ObjectId(id) : null },
        { id: id },
        { bookingId: id }
      ]
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Update booking status
    const result = await db.collection("bookings").updateOne(
      {
        $or: [
          { _id: ObjectId.isValid(id) ? new ObjectId(id) : null },
          { id: id },
          { bookingId: id }
        ]
      },
      {
        $set: {
          status,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Create notification for the customer
    try {
      const notificationTitle =
        status === "confirmed" ? "Booking Confirmed" :
        status === "completed" ? "Service Completed" :
        status === "cancelled" ? "Booking Cancelled" : "Booking Update";

      const notificationMessage =
        status === "confirmed" ? `Your booking for ${booking.service} has been confirmed.` :
        status === "completed" ? `Your service for ${booking.service} has been marked as completed.` :
        status === "cancelled" ? `Your booking for ${booking.service} has been cancelled.` :
        `Your booking status has been updated to ${status}.`;

      // Find user by email or phone
      const user = await db.collection("users").findOne({
        $or: [
          { email: booking.customerEmail || booking.email },
          { phone: booking.customerPhone || booking.phone }
        ]
      });

      if (user) {
        // Create notification
        await db.collection("notifications").insertOne({
          userId: user._id.toString(),
          title: notificationTitle,
          message: notificationMessage,
          type: "booking",
          referenceId: booking.bookingId || booking._id.toString(),
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
      // Continue even if notification creation fails
    }

    return NextResponse.json({
      success: true,
      message: `Booking status updated to ${status}`,
      booking: {
        id: booking.id || booking._id.toString(),
        status: status
      }
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
  return NextResponse.json(
    { success: false, message: "Internal server error" },
    { status: 500 }
  );
}

// Export PATCH and PUT methods that use the helper function
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return updateBookingStatus(request, context);
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  return updateBookingStatus(request, context);
}
