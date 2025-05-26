import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Get a specific booking
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);

    if (!decoded || (decoded as {role?: string}).role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Get params from context
    const params = await context.params;
    const bookingId = params.id;

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

    // Get payment information if available
    const payment = await db.collection("payments").findOne({
      bookingId: booking.bookingId || booking._id.toString()
    });

    // Combine booking and payment information
    const bookingWithPayment = {
      ...booking,
      payment: payment || null,
      paymentStatus: payment ? payment.status : booking.paymentStatus || "pending",
      // Ensure address fields are properly included
      address: booking.address || booking.customerAddress || null,
      customerAddress: booking.customerAddress || booking.address || null,
      // Ensure date and time fields are properly included
      date: booking.date || booking.scheduledDate || booking.serviceDate || booking.bookingDate || null,
      time: booking.time || booking.scheduledTime || booking.serviceTime || booking.bookingTime || null
    };

    return NextResponse.json({
      success: true,
      booking: bookingWithPayment
    });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update a booking
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
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
    const bookingId = params.id;
    const updateData = await request.json();

    // Validate ObjectId
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(bookingId);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Invalid booking ID format" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Find booking by ID
    const booking = await db.collection("bookings").findOne({ _id: objectId });

    if (!booking) {
      // Try finding by bookingId field as fallback
      const bookingByAltId = await db.collection("bookings").findOne({ bookingId: bookingId });

      if (!bookingByAltId) {
        return NextResponse.json(
          { success: false, message: "Booking not found" },
          { status: 404 }
        );
      }

      // Update booking by bookingId
      const result = await db
        .collection("bookings")
        .updateOne({ bookingId: bookingId }, { $set: updateData });

      if (result.modifiedCount === 0) {
        return NextResponse.json(
          { success: false, message: "No changes made to the booking" },
          { status: 304 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Booking updated successfully",
      });
    }

    // Update booking by _id
    const result = await db
      .collection("bookings")
      .updateOne({ _id: objectId }, { $set: updateData });

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, message: "No changes made to the booking" },
        { status: 304 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Booking updated successfully",
    });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete a booking
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
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
    const bookingId = params.id;

    // Validate ObjectId
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(bookingId);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Invalid booking ID format" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Find booking by ID
    const booking = await db.collection("bookings").findOne({ _id: objectId });

    if (!booking) {
      // Try finding by bookingId field as fallback
      const bookingByAltId = await db.collection("bookings").findOne({ bookingId: bookingId });

      if (!bookingByAltId) {
        return NextResponse.json(
          { success: false, message: "Booking not found" },
          { status: 404 }
        );
      }

      // Delete booking by bookingId
      const result = await db.collection("bookings").deleteOne({ bookingId: bookingId });

      if (result.deletedCount === 0) {
        return NextResponse.json(
          { success: false, message: "Failed to delete booking" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Booking deleted successfully",
      });
    }

    // Delete booking by _id
    const result = await db.collection("bookings").deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Failed to delete booking" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}


