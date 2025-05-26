import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "../../../../lib/auth";
import { ObjectId } from "mongodb";

// Mark a job as completed by technician
export async function POST(request: Request) {
  try {
    // Verify technician authentication
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);

    if (!decoded || typeof decoded !== "object" || !("userId" in decoded)) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const userId = (decoded as { userId: string }).userId;

    // Get completion data from request body
    const { bookingId, notes, partsUsed, additionalCharges } = await request.json();

    // Validate required fields
    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "Booking ID is required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Find technician
    const technician = await db.collection("technicians").findOne({
      _id: new ObjectId(userId)
    });

    if (!technician) {
      return NextResponse.json(
        { success: false, message: "Technician not found" },
        { status: 404 }
      );
    }

    // Find booking
    const orConditions = [
      ...(ObjectId.isValid(bookingId) ? [{ _id: new ObjectId(bookingId) }] : []),
      { id: bookingId },
      { bookingId: bookingId }
    ];
    const booking = await db.collection("bookings").findOne({
      $or: orConditions,
      technicianId: technician._id.toString()
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found or not assigned to this technician" },
        { status: 404 }
      );
    }

    // Check if booking is in the correct status
    if (booking.status !== "confirmed" && booking.status !== "in-progress") {
      return NextResponse.json(
        { success: false, message: "Booking must be confirmed or in-progress to be completed" },
        { status: 400 }
      );
    }

    // Calculate total amount including additional charges
    let totalAmount = booking.amount || 0;
    if (additionalCharges && additionalCharges.length > 0) {
      const additionalTotal = additionalCharges.reduce((sum: number, charge: { amount: number }) => sum + charge.amount, 0);
      totalAmount += additionalTotal;
    }

    // Update booking as completed
    await db.collection("bookings").updateOne(
      { _id: booking._id },
      {
        $set: {
          status: "completed",
          completedAt: new Date(),
          completedBy: technician.name,
          completedById: technician._id.toString(),
          serviceNotes: notes,
          partsUsed: partsUsed || [],
          additionalCharges: additionalCharges || [],
          finalAmount: totalAmount,
          updatedAt: new Date()
        }
      }
    );

    // Update technician status and stats
    await db.collection("technicians").updateOne(
      { _id: technician._id },
      {
        $set: {
          status: "active",
          updatedAt: new Date()
        },
        $inc: {
          completedBookings: 1,
          "earnings.total": totalAmount,
          "earnings.pending": totalAmount
        }
      }
    );

    // Create notification for customer
    const customerNotification = {
      recipientId: booking.userId || booking.customerEmail,
      recipientType: "customer",
      title: "Service Completed",
      message: `Your ${booking.service} service has been completed. Please rate your experience.`,
      bookingId: booking._id.toString(),
      status: "unread",
      createdAt: new Date()
    };

    await db.collection("notifications").insertOne(customerNotification);

    // Create notification for admin
    const adminNotification = {
      recipientType: "admin",
      title: "Service Completed",
      message: `Technician ${technician.name} has completed the ${booking.service} service.`,
      bookingId: booking._id.toString(),
      status: "unread",
      createdAt: new Date()
    };

    await db.collection("notifications").insertOne(adminNotification);

    return NextResponse.json({
      success: true,
      message: "Service marked as completed successfully",
      booking: {
        ...booking,
        status: "completed",
        completedAt: new Date(),
        completedBy: technician.name,
        serviceNotes: notes,
        partsUsed: partsUsed || [],
        additionalCharges: additionalCharges || [],
        finalAmount: totalAmount
      }
    });
  } catch (error) {
    console.error("Error completing service:", error);
    return NextResponse.json(
      { success: false, message: "Failed to mark service as completed" },
      { status: 500 }
    );
  }
}
