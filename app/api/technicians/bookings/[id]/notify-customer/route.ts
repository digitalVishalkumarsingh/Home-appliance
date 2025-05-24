import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken } from "@/app/lib/auth";
import { ObjectId } from "mongodb";
import { logger } from "../../../../../config/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.userId || decoded.role !== "technician") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Get booking ID from params
    const bookingId = params.id;
    if (!bookingId || !ObjectId.isValid(bookingId)) {
      return NextResponse.json(
        { success: false, message: "Valid Booking ID is required" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { notificationType, message } = body;

    if (!notificationType) {
      return NextResponse.json(
        { success: false, message: "Notification type is required" },
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Validate technician ObjectId
    if (!ObjectId.isValid(decoded.userId)) {
      return NextResponse.json(
        { success: false, message: "Invalid technician ID" },
        { status: 400 }
      );
    }

    // Find technician
    const technician = await db.collection("technicians").findOne(
      { _id: new ObjectId(decoded.userId) },
      { timeout: true }
    );

    if (!technician) {
      return NextResponse.json(
        { success: false, message: "Technician not found" },
        { status: 404 }
      );
    }

    // Find booking
    const booking = await db.collection("bookings").findOne(
      { _id: new ObjectId(bookingId) },
      { timeout: true }
    );

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if technician is assigned to this booking
    if (booking.technicianId && booking.technicianId.toString() !== technician._id.toString()) {
      return NextResponse.json(
        { success: false, message: "You are not assigned to this booking" },
        { status: 403 }
      );
    }

    // Create notification for customer
    const notification = {
      recipientId: booking.userId.toString(),
      recipientType: "customer",
      type: notificationType,
      title: "Technician Update",
      message: message || "Your technician is on the way to your location.",
      bookingId: booking._id.toString(),
      technicianId: technician._id.toString(),
      technicianName: technician.name,
      read: false,
      createdAt: new Date(),
    };

    // Save notification
    await db.collection("notifications").insertOne(notification);

    // Update booking status if needed
    if (booking.status === "pending") {
      await db.collection("bookings").updateOne(
        { _id: booking._id },
        { 
          $set: { 
            status: "in-progress",
            technicianId: technician._id,
            technicianName: technician.name,
            updatedAt: new Date()
          } 
        }
      );
    }

    // Return success
    return NextResponse.json({
      success: true,
      message: "Customer notification sent successfully"
    });
  } catch (error) {
    await logger.error("Error notifying customer", { error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json(
      { success: false, message: "Failed to notify customer" },
      { status: 500 }
    );
  }
}