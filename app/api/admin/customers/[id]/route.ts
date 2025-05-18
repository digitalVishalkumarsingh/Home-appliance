import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Get a specific customer
export async function GET(
  request: Request,
  context: { params: { id: string } }
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
    const customerId = params.id;

    // Validate ObjectId
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(customerId);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Invalid customer ID format" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Find customer by ID
    const customer = await db.collection("users").findOne(
      { _id: objectId, role: "user" },
      { projection: { password: 0 } } // Exclude password field
    );

    if (!customer) {
      return NextResponse.json(
        { success: false, message: "Customer not found" },
        { status: 404 }
      );
    }

    // Get customer stats
    // Count total bookings
    const bookingCount = await db.collection("bookings").countDocuments({
      $or: [
        { userId: customer._id.toString() },
        { customerEmail: customer.email },
        { customerPhone: customer.phone }
      ]
    });

    // Count completed bookings
    const completedBookingCount = await db.collection("bookings").countDocuments({
      $or: [
        { userId: customer._id.toString() },
        { customerEmail: customer.email },
        { customerPhone: customer.phone }
      ],
      status: "completed"
    });

    // Calculate total spent
    const bookings = await db.collection("bookings").find({
      $or: [
        { userId: customer._id.toString() },
        { customerEmail: customer.email },
        { customerPhone: customer.phone }
      ],
      status: "completed"
    }).toArray();

    const totalSpent = bookings.reduce((sum, booking) => sum + (booking.amount || 0), 0);

    // Get last booking date
    const lastBooking = await db.collection("bookings").find({
      $or: [
        { userId: customer._id.toString() },
        { customerEmail: customer.email },
        { customerPhone: customer.phone }
      ]
    }).sort({ createdAt: -1 }).limit(1).toArray();

    const customerWithStats = {
      ...customer,
      stats: {
        bookingCount,
        completedBookingCount,
        totalSpent,
        lastBookingDate: lastBooking.length > 0 ? lastBooking[0].createdAt : null
      }
    };

    return NextResponse.json({
      success: true,
      customer: customerWithStats
    });
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
