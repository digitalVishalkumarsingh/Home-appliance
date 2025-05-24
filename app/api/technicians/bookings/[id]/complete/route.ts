import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";
import { z } from "zod";

// Validation schema for request body
const CompleteBookingSchema = z.object({
  notes: z.string().max(500, "Notes must be 500 characters or less").optional(),
}).strict();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const session = await connectToDatabase({ timeoutMs: 10000 });
  const { db, client } = session;

  try {
    // Verify authentication
    const token = getTokenFromRequest(new NextRequest(request));
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

    const userId = (decoded as { userId: string }).userId;

    // Validate request body
    const body = await request.json();
    const parsedBody = CompleteBookingSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { success: false, message: `Invalid input: ${parsedBody.error.message}` },
        { status: 400 }
      );
    }
    const { notes } = parsedBody.data;

    // Validate booking ID
    const bookingId = resolvedParams.id;
    if (!ObjectId.isValid(bookingId)) {
      return NextResponse.json(
        { success: false, message: "Invalid booking ID" },
        { status: 400 }
      );
    }

    // Verify user role
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Invalid user ID" },
        { status: 403 }
      );
    }
    const user = await db.collection("users").findOne({
      _id: new ObjectId(userId),
    });
    if (!user || user.role !== "technician") {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Technician role required" },
        { status: 403 }
      );
    }

    // Start MongoDB transaction
    const transactionSession = client.startSession();
    let response;

    try {
      await transactionSession.withTransaction(async () => {
        // Find technician
        const technician = await db.collection("technicians").findOne(
          { userId },
          { session: transactionSession }
        );
        if (!technician) {
          throw new Error("Technician profile not found");
        }

        // Find booking
        const booking = await db.collection("bookings").findOne(
          {
            _id: new ObjectId(bookingId),
            technicianId: technician._id.toString(),
            status: "in_progress",
          },
          { session: transactionSession }
        );
        if (!booking) {
          throw new Error("Booking not found, not assigned to you, or not in progress");
        }

        // Validate booking data
        if (!booking.userId || !booking.service) {
          throw new Error("Booking is missing required fields (userId or service)");
        }
        if (!booking.amount || booking.amount < 0) {
          throw new Error("Invalid or missing booking amount");
        }

        // Get commission rate
        const settingsDoc = await db.collection("settings").findOne(
          { key: "commission" },
          { session: transactionSession }
        );
        const adminCommissionPercentage = settingsDoc?.value && Number.isFinite(settingsDoc.value) && settingsDoc.value >= 0
          ? settingsDoc.value
          : 30; // Default 30%

        // Calculate earnings
        const totalAmount = booking.amount;
        const adminCommission = Math.round((totalAmount * adminCommissionPercentage) / 100);
        const technicianEarnings = totalAmount - adminCommission;

        // Update booking status
        const now = new Date();
        const updateData: any = {
          status: "completed",
          completedAt: now,
          updatedAt: now,
          earnings: {
            total: totalAmount,
            adminCommission,
            technicianEarnings,
            adminCommissionPercentage,
            status: "pending",
          },
        };
        if (notes) {
          updateData.notes = notes;
        }

        const updateResult = await db.collection("bookings").updateOne(
          { _id: booking._id },
          { $set: updateData },
          { session: transactionSession }
        );
        if (updateResult.modifiedCount === 0) {
          throw new Error("Failed to update booking status");
        }

        // Update technician status
        await db.collection("technicians").updateOne(
          { _id: technician._id },
          {
            $set: {
              status: "available",
              updatedAt: now,
              lastActive: now,
            },
          },
          { session: transactionSession }
        );

        // Create earnings record
        const earnings = {
          technicianId: technician._id.toString(),
          technicianName: technician.name,
          bookingId: booking._id.toString(),
          bookingReference: booking._id.toString(),
          amount: totalAmount,
          adminCommission,
          technicianEarnings,
          adminCommissionPercentage,
          status: "pending",
          createdAt: now,
          updatedAt: now,
        };
        await db.collection("earnings").insertOne(earnings, { session: transactionSession });

        // Create customer notification
        const customerNotification = {
          recipientId: booking.userId,
          recipientType: "customer",
          title: "Service Completed",
          message: `${technician.name} has completed your ${booking.service} booking. Please rate your experience.`,
          type: "booking_update",
          referenceId: booking._id.toString(),
          isRead: false,
          createdAt: now,
          updatedAt: now,
        };
        await db.collection("notifications").insertOne(customerNotification, { session: transactionSession });

        // Create admin notification
        const adminNotification = {
          recipientType: "admin",
          title: "Service Completed",
          message: `Technician ${technician.name} has completed booking #${booking._id.toString()}.`,
          type: "booking_update",
          referenceId: booking._id.toString(),
          isRead: false,
          createdAt: now,
          updatedAt: now,
        };
        await db.collection("notifications").insertOne(adminNotification, { session: transactionSession });

        response = {
          success: true,
          message: "Booking completed successfully",
          booking: {
            _id: booking._id.toString(),
            status: "completed",
            completedAt: now.toISOString(),
            earnings: {
              total: totalAmount,
              technicianEarnings,
              adminCommission,
              adminCommissionPercentage,
            },
          },
        };
      });
    } finally {
      await transactionSession.endSession();
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error completing booking:", error);
    const message =
      error.message.includes("not found") || error.message.includes("Invalid booking ID")
        ? error.message
        : error.message.includes("required fields") || error.message.includes("booking amount")
          ? error.message
          : error.name === "MongoTimeoutError"
            ? "Database connection timed out"
            : error.name === "MongoServerError" && error.code === 11000
              ? "Database error: Duplicate key"
              : "Failed to complete booking";
    return NextResponse.json(
      { success: false, message },
      {
        status:
          error.message.includes("not found")
            ? 404
            : error.message.includes("required fields") || error.message.includes("booking amount")
              ? 400
              : error.message.includes("Invalid booking ID")
                ? 400
                : error.name === "MongoTimeoutError"
                  ? 504
                  : error.name === "MongoServerError" && error.code === 11000
                    ? 409
                    : 500,
      }
    );
  } finally {
    await client.close();
  }
}