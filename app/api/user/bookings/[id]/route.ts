import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Get a specific booking for a user
export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
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

    if (!decoded || typeof decoded !== "object" || !("userId" in decoded)) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // Get params from context
    const params = await context.params;
    const bookingId = params.id;

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get user details to match by email and phone as well
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { email: 1, phone: 1 } }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Try to find booking by ID or bookingId
    let booking;
    let objectId;

    try {
      objectId = new ObjectId(bookingId);
      booking = await db.collection("bookings").findOne({
        _id: objectId,
        $or: [
          { userId: decoded.userId },
          { customerEmail: user.email },
          { email: user.email },
          { customerPhone: user.phone },
          { phone: user.phone }
        ]
      });
    } catch (error) {
      // If bookingId is not a valid ObjectId, try finding by bookingId field
      booking = await db.collection("bookings").findOne({
        bookingId: bookingId,
        $or: [
          { userId: decoded.userId },
          { customerEmail: user.email },
          { email: user.email },
          { customerPhone: user.phone },
          { phone: user.phone }
        ]
      });
    }

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found or not authorized to view this booking" },
        { status: 404 }
      );
    }

    // Get payment information if available
    const payment = await db.collection("payments").findOne({
      $or: [
        { bookingId: booking.bookingId || booking._id.toString() },
        { orderId: booking.orderId }
      ]
    });

    // Get applied discount information if available
    const appliedDiscount = await db.collection("appliedDiscounts").findOne({
      $or: [
        { bookingId: booking.bookingId || booking._id.toString() },
        { orderId: booking.orderId }
      ]
    });

    // Get available offers for this service category
    const serviceCategory = booking.serviceCategory || 
                           (booking.service && booking.service.toLowerCase().includes('washing') ? 'washing-machine-services' : 
                           (booking.service && booking.service.toLowerCase().includes('ac') ? 'ac-services' : 'general-services'));
    
    const availableOffers = await db.collection("discounts").find({
      $or: [
        { applicableCategories: { $in: [serviceCategory] } },
        { applicableCategories: { $in: ["all"] } }
      ],
      isActive: true,
      expiryDate: { $gt: new Date().toISOString() }
    }).toArray();

    // Combine booking, payment, and discount information
    const bookingWithDetails = {
      ...booking,
      payment: payment || null,
      paymentStatus: payment ? payment.status : booking.paymentStatus || "pending",
      // Ensure address fields are properly included
      address: booking.address || booking.customerAddress || null,
      customerAddress: booking.customerAddress || booking.address || null,
      // Ensure date and time fields are properly included
      date: booking.date || booking.scheduledDate || booking.serviceDate || booking.bookingDate || null,
      time: booking.time || booking.scheduledTime || booking.serviceTime || booking.bookingTime || null,
      // Include discount information
      appliedDiscount: appliedDiscount || null,
      availableOffers: availableOffers || []
    };

    return NextResponse.json({
      success: true,
      booking: bookingWithDetails
    });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
