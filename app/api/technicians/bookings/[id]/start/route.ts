import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";
import { logger } from "../../../../../config/logger";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify technician authentication
    const token = getTokenFromRequest(new NextRequest(request));

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

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Find technician
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: "Technician not found" },
        { status: 404 }
      );
    }

    const technician = await db.collection("technicians").findOne(
      { _id: new ObjectId(userId) },
      { timeout: true }
    );

    if (!technician) {
      return NextResponse.json(
        { success: false, message: "Technician not found" },
        { status: 404 }
      );
    }

    // Find booking
    const resolvedParams = await params;
    const bookingId = resolvedParams.id;
    if (!bookingId || !ObjectId.isValid(bookingId)) {
      return NextResponse.json(
        { success: false, message: "Valid Booking ID is required" },
        { status: 400 }
      );
    }

    const booking = await db.collection("bookings").findOne(
      {
        _id: new ObjectId(bookingId),
        technicianId: technician._id.toString(),
        status: "assigned"
      },
      { timeout: true }
    );

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found, not assigned to you, or already started" },
        { status: 404 }
      );
    }

    // Update booking status
    const now = new Date();
    const result = await db.collection("bookings").updateOne(
      { _id: booking._id },
      {
        $set: {
          status: "in_progress",
          startedAt: now,
          updatedAt: now
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Failed to update booking status" },
        { status: 500 }
      );
    }

    // Create notification for customer
    const customerNotification = {
      recipientId: booking.userId,
      recipientType: "customer",
      title: "Service Started",
      message: `${technician.name} has started working on your ${booking.service} booking.`,
      type: "booking_update",
      referenceId: booking._id.toString(),
      isRead: false,
      createdAt: now
    };

    await db.collection("notifications").insertOne(customerNotification);

    // Create notification for admin
    const adminNotification = {
      recipientType: "admin",
      title: "Service Started",
      message: `Technician ${technician.name} has started working on booking #${booking.bookingId || booking._id.toString()}.`,
      type: "booking_update",
      referenceId: booking._id.toString(),
      isRead: false,
      createdAt: now
    };

    await db.collection("notifications").insertOne(adminNotification);

    return NextResponse.json({
      success: true,
      message: "Booking started successfully",
      booking: {
        _id: booking._id,
        status: "in_progress",
        startedAt: now
      }
    });
  } catch (error) {
    await logger.error("Error starting booking", { error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json(
      { success: false, message: "Failed to start booking" },
      { status: 500 }
    );
  }
}