import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest, AuthError, JwtPayload } from "@/app/lib/auth";
import { ObjectId } from "mongodb";
import { logger } from "@/app/config/logger";

// Accept a job offer
export async function POST(request: NextRequest) {
  try {
    // Extract and verify token
    let token: string;
    try {
      token = getTokenFromRequest(request);
    } catch (error) {
      logger.warn("Failed to extract token", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    let decoded: JwtPayload;
    try {
      decoded = await verifyToken(token);
    } catch (error) {
      logger.error("Token verification failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        code: error instanceof AuthError ? error.code : "UNKNOWN",
      });
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const { userId, role } = decoded;
    if (!userId || role !== "technician") {
      logger.warn("Unauthorized access or invalid token", { userId, role });
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const { jobId } = await request.json();
    if (!jobId || typeof jobId !== "string") {
      logger.warn("Invalid or missing jobId", { jobId });
      return NextResponse.json(
        { success: false, message: "Job ID is required and must be a string" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });
    const now = new Date();

    // Find technician by userId
    const technician = await db.collection("technicians").findOne({ userId });
    if (!technician) {
      logger.warn("Technician not found", { userId });
      return NextResponse.json(
        { success: false, message: "Technician profile not found" },
        { status: 404 }
      );
    }

    // Find job offer or job notification
    let jobOffer = await db.collection("jobOffers").findOne({
      _id: new ObjectId(jobId),
      technicianId: technician._id.toString(),
      status: "pending",
    });

    // If not found in jobOffers, check job_notifications
    let jobNotification = null;
    if (!jobOffer) {
      if (ObjectId.isValid(jobId)) {
        jobNotification = await db.collection("job_notifications").findOne({
          _id: new ObjectId(jobId),
          status: "pending"
        });
      } else {
        jobNotification = await db.collection("job_notifications").findOne({
          _id: jobId,
          status: "pending"
        });
      }

      if (jobNotification) {
        // Convert job notification to job offer format for compatibility
        jobOffer = {
          _id: jobNotification._id,
          bookingId: jobNotification.bookingId,
          technicianId: technician._id.toString(),
          status: "pending",
          serviceName: jobNotification.serviceName,
          customerName: jobNotification.customerName,
          address: jobNotification.address,
          amount: jobNotification.amount,
          urgency: jobNotification.urgency,
          createdAt: jobNotification.createdAt
        };
      }
    }
    if (!jobOffer) {
      logger.warn("Job offer not found or already processed", { jobId, technicianId: technician._id.toString() });
      return NextResponse.json(
        { success: false, message: "Job offer not found or already processed" },
        { status: 404 }
      );
    }

    // Check if job offer is still valid
    const offerExpiryTime = new Date(jobOffer.expiresAt);
    if (now > offerExpiryTime) {
      logger.warn("Job offer expired", { jobId, expiresAt: jobOffer.expiresAt });
      return NextResponse.json(
        { success: false, message: "Job offer has expired" },
        { status: 400 }
      );
    }

    // Start a MongoDB transaction
    const { client } = await connectToDatabase({ timeoutMs: 10000 });
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        // Update job offer or job notification status
        let jobUpdateResult;
        if (jobNotification) {
          // Update job notification status
          jobUpdateResult = await db.collection("job_notifications").updateOne(
            { _id: jobOffer._id },
            {
              $set: {
                status: "accepted",
                acceptedBy: technician._id.toString(),
                technicianName: technician.name,
                acceptedAt: now,
              },
            },
            { session }
          );
        } else {
          // Update job offer status
          jobUpdateResult = await db.collection("jobOffers").updateOne(
            { _id: jobOffer._id },
            {
              $set: {
                status: "accepted",
                technicianId: technician._id.toString(),
                technicianName: technician.name,
                acceptedAt: now,
              },
            },
            { session }
          );
        }
        if (jobUpdateResult.modifiedCount === 0) {
          throw new Error("Failed to update job status");
        }

        // Update booking with technician assignment
        const bookingQuery = ObjectId.isValid(jobOffer.bookingId)
          ? { _id: new ObjectId(jobOffer.bookingId) }
          : { bookingId: jobOffer.bookingId };

        const bookingUpdateResult = await db.collection("bookings").updateOne(
          bookingQuery,
          {
            $set: {
              status: "assigned",
              technicianId: technician._id.toString(),
              technicianName: technician.name,
              technicianPhone: technician.phone,
              assignedAt: now,
              updatedAt: now,
            },
          },
          { session }
        );
        if (bookingUpdateResult.modifiedCount === 0) {
          throw new Error("Failed to update booking");
        }

        // Update technician status to busy
        const technicianUpdateResult = await db.collection("technicians").updateOne(
          { _id: technician._id },
          {
            $set: {
              status: "busy",
              updatedAt: now,
              lastActive: now,
            },
          },
          { session }
        );
        if (technicianUpdateResult.modifiedCount === 0) {
          throw new Error("Failed to update technician status");
        }

        // Create notification for customer
        const booking = await db.collection("bookings").findOne({ _id: new ObjectId(jobOffer.bookingId) }, { session });
        if (booking) {
          await db.collection("notifications").insertOne(
            {
              recipientId: booking.userId || booking.customerEmail,
              recipientType: "customer",
              title: "Technician Assigned",
              message: `A technician has been assigned to your ${booking.service} booking.`,
              technicianName: technician.name,
              bookingId: booking._id.toString(),
              status: "unread",
              createdAt: now,
            },
            { session }
          );
        }

        // Create notification for admin
        await db.collection("notifications").insertOne(
          {
            recipientType: "admin",
            title: "Job Accepted",
            message: `Technician ${technician.name} has accepted the job for booking #${jobOffer.bookingId}.`,
            technicianId: technician._id.toString(),
            bookingId: jobOffer.bookingId,
            status: "unread",
            createdAt: now,
          },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    // Calculate earnings
    const bookingQuery = ObjectId.isValid(jobOffer.bookingId)
      ? { _id: new ObjectId(jobOffer.bookingId) }
      : { bookingId: jobOffer.bookingId };
    const booking = await db.collection("bookings").findOne(bookingQuery);
    const settingsDoc = await db.collection("settings").findOne({ key: "commission" });
    const adminCommissionPercentage = settingsDoc?.value || 30; // Default to 30%
    const totalAmount = booking?.amount || 0;
    const adminCommission = Math.round((totalAmount * adminCommissionPercentage) / 100);
    const technicianEarnings = totalAmount - adminCommission;

    logger.debug("Job accepted successfully", {
      userId,
      jobId,
      technicianId: technician._id.toString(),
      bookingId: jobOffer.bookingId,
    });

    return NextResponse.json({
      success: true,
      message: "Job accepted successfully",
      job: {
        id: jobOffer._id.toString(),
        bookingId: jobOffer.bookingId,
        status: "assigned",
        earnings: {
          total: totalAmount,
          technicianEarnings,
          adminCommission,
          adminCommissionPercentage,
        },
      },
    });
  } catch (error) {
    logger.error("Error accepting job", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, message: "Failed to accept job" },
      { status: 500 }
    );
  }
}