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
    const { paymentMethod, amount, notes } = body;

    if (!paymentMethod || !amount) {
      return NextResponse.json(
        { success: false, message: "Payment method and amount are required" },
        { status: 400 }
      );
    }

    // Validate amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Find technician
    if (!ObjectId.isValid(decoded.userId)) {
      return NextResponse.json(
        { success: false, message: "Invalid technician ID" },
        { status: 400 }
      );
    }
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

    // Check if booking is completed
    if (booking.status !== "completed") {
      return NextResponse.json(
        { success: false, message: "Booking must be completed before recording payment" },
        { status: 400 }
      );
    }

    // Check if payment is already recorded
    if (booking.paymentStatus === "paid") {
      return NextResponse.json(
        { success: false, message: "Payment is already recorded for this booking" },
        { status: 400 }
      );
    }

    // Get the admin commission rate from settings
    const settingsDoc = await db.collection("settings").findOne({ key: "commission" }, { timeout: true });
    const adminCommissionPercentage = settingsDoc?.value || 30; // Default to 30% if not set

    // Calculate admin commission
    const adminCommission = Math.round((parsedAmount * adminCommissionPercentage) / 100);
    const technicianEarnings = parsedAmount - adminCommission;

    // Create payment record
    const payment = {
      bookingId: booking._id.toString(),
      paymentMethod,
      amount: parsedAmount,
      adminCommission,
      technicianEarnings,
      adminCommissionPercentage,
      notes: notes || "Cash collected by technician",
      collectedBy: technician._id.toString(),
      collectedByName: technician.name,
      status: "completed",
      createdAt: new Date(),
    };

    // Save payment record
    await db.collection("payments").insertOne(payment);

    // Update booking payment status
    await db.collection("bookings").updateOne(
      { _id: booking._id },
      {
        $set: {
          paymentStatus: "paid",
          paymentMethod,
          paymentDate: new Date(),
          updatedAt: new Date(),
          earnings: {
            total: parsedAmount,
            adminCommission,
            technicianEarnings,
            adminCommissionPercentage
          }
        }
      }
    );

    // Update technician earnings
    await db.collection("technicians").updateOne(
      { _id: technician._id },
      {
        $inc: {
          totalEarnings: technicianEarnings,
          pendingEarnings: technicianEarnings,
          completedBookings: 1
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );

    // Create notification for customer
    const customerNotification = {
      recipientId: booking.userId.toString(),
      recipientType: "customer",
      type: "payment_received",
      title: "Payment Received",
      message: `Your payment of ₹${parsedAmount} for ${booking.service} has been received.`,
      bookingId: booking._id.toString(),
      amount: parsedAmount,
      read: false,
      createdAt: new Date(),
    };

    // Save customer notification
    await db.collection("notifications").insertOne(customerNotification);

    // Create notification for admin
    const adminNotification = {
      recipientType: "admin",
      type: "payment_received",
      title: "Payment Received",
      message: `Payment of ₹${parsedAmount} received for booking #${booking.bookingId || booking._id}`,
      bookingId: booking._id.toString(),
      technicianId: technician._id.toString(),
      technicianName: technician.name,
      amount: parsedAmount,
      adminCommission,
      read: false,
      createdAt: new Date(),
    };

    // Save admin notification
    await db.collection("notifications").insertOne(adminNotification);

    // Return success
    return NextResponse.json({
      success: true,
      message: "Payment recorded successfully",
      payment: {
        amount: parsedAmount,
        adminCommission,
        technicianEarnings,
        adminCommissionPercentage
      }
    });
  } catch (error) {
    await logger.error("Error recording payment", { error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json(
      { success: false, message: "Failed to record payment" },
      { status: 500 }
    );
  }
}