import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Helper function to handle both PATCH and PUT requests
async function updatePaymentStatus(request: Request, context: { params: { id: string } }) {
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
    const params = context.params;
    const bookingId = params.id;

    // Get status from request body
    const { paymentStatus } = await request.json();

    if (!paymentStatus) {
      return NextResponse.json(
        { success: false, message: "Payment status is required" },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ["pending", "paid", "failed", "refunded"];
    if (!validStatuses.includes(paymentStatus)) {
      return NextResponse.json(
        { success: false, message: "Invalid payment status value" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // First try to find booking by bookingId field (for BK format IDs)
    let booking = await db.collection("bookings").findOne({ bookingId: bookingId });

    // If not found and the ID looks like a MongoDB ObjectId, try finding by _id
    if (!booking && /^[0-9a-fA-F]{24}$/.test(bookingId)) {
      try {
        const objectId = new ObjectId(bookingId);
        booking = await db.collection("bookings").findOne({ _id: objectId });
      } catch (error) {
        console.error("Error converting to ObjectId:", error);
        // Continue with the flow, booking will remain null
      }
    }

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Update booking payment status
    const updateResult = await db.collection("bookings").updateOne(
      booking._id ? { _id: booking._id } : { bookingId },
      { 
        $set: { 
          paymentStatus,
          updatedAt: new Date().toISOString()
        } 
      }
    );

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Failed to update payment status" },
        { status: 500 }
      );
    }

    // If there's a payment record, update it too
    const payment = await db.collection("payments").findOne({
      bookingId: booking.bookingId || booking._id.toString()
    });

    if (payment) {
      // Map booking payment status to payment status
      const paymentRecordStatus = 
        paymentStatus === "paid" ? "completed" :
        paymentStatus === "failed" ? "failed" :
        paymentStatus === "refunded" ? "refunded" : "pending";

      await db.collection("payments").updateOne(
        { _id: payment._id },
        { 
          $set: { 
            status: paymentRecordStatus,
            updatedAt: new Date().toISOString(),
            updatedBy: (decoded as {userId?: string}).userId || "admin",
            manuallyUpdated: true
          } 
        }
      );
    }

    // Create notification for the customer
    try {
      const notificationTitle = 
        paymentStatus === "paid" ? "Payment Confirmed" :
        paymentStatus === "refunded" ? "Payment Refunded" :
        paymentStatus === "failed" ? "Payment Failed" : "Payment Status Updated";
      
      const notificationMessage = 
        paymentStatus === "paid" ? `Your payment for booking ${booking.bookingId || booking._id} has been confirmed.` :
        paymentStatus === "refunded" ? `Your payment for booking ${booking.bookingId || booking._id} has been refunded.` :
        paymentStatus === "failed" ? `Your payment for booking ${booking.bookingId || booking._id} has failed.` :
        `Your payment status for booking ${booking.bookingId || booking._id} has been updated to ${paymentStatus}.`;

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
          type: "payment",
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
      message: `Payment status updated to ${paymentStatus}`,
      paymentStatus
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Export PATCH and PUT methods that use the helper function
export async function PATCH(request: Request, context: { params: { id: string } }) {
  return updatePaymentStatus(request, context);
}

export async function PUT(request: Request, context: { params: { id: string } }) {
  return updatePaymentStatus(request, context);
}
