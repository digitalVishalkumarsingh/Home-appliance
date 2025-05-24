"use server";

import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest, isTechnician, JwtPayload } from "@/app/lib/auth";
import { logger } from "@/app/config/logger";
import { ObjectId } from "mongodb";

// Create or update a test job offer for a technician
export async function POST(request: Request) {
  try {
    // Verify authentication
    const token = getTokenFromRequest(new NextRequest(request));
    if (!token) {
      logger.warn("No authentication token provided");
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify token and role
    let decoded: JwtPayload;
    try {
      decoded = await verifyToken(token);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Invalid token";
      logger.error("Token verification failed", { error: errorMessage });
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    if (!isTechnician(decoded)) {
      logger.warn("Non-technician attempted to create job offer", { userId: decoded.userId });
      return NextResponse.json(
        { success: false, message: "Technician role required" },
        { status: 403 }
      );
    }

    const userId = decoded.userId;

    // Validate ObjectId
    if (!ObjectId.isValid(userId)) {
      logger.error("Invalid userId format", { userId });
      return NextResponse.json(
        { success: false, message: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Find technician
    const technician = await db.collection("technicians").findOne({
      _id: new ObjectId(userId),
    });

    if (!technician) {
      logger.error("Technician not found", { userId });
      return NextResponse.json(
        { success: false, message: "Technician not found" },
        { status: 404 }
      );
    }

    // Helper function to create job offer
    const createJobOffer = async (bookingId: string) => {
      const expiryTime = new Date();
      expiryTime.setMinutes(expiryTime.getMinutes() + 30); // Expires in 30 minutes
      const jobOffer = {
        bookingId,
        technicianId: technician._id.toString(),
        status: "pending" as const,
        distance: 3.5, // Hardcoded for test; consider env or request body
        createdAt: new Date(),
        expiresAt: expiryTime,
      };
      await db.collection("jobOffers").insertOne(jobOffer);
      return jobOffer;
    };

    // Find a pending booking
    const booking = await db.collection("bookings").findOne({
      status: "pending",
    });

    if (!booking) {
      // Create a test booking
      const newBooking = {
        service: "AC Repair", // Hardcoded for test; consider env or request body
        status: "pending" as const,
        customerName: "Test Customer",
        customerPhone: "+91 98765 43210",
        customerEmail: "test@example.com",
        address: "123 Test Street, Test City",
        amount: 1200,
        notes: "AC not cooling properly. Fan works but compressor not starting.",
        urgency: "high" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection("bookings").insertOne(newBooking);
      const jobOffer = await createJobOffer(result.insertedId.toString());

      logger.info("Test job offer created for new booking", {
        userId,
        bookingId: result.insertedId.toString(),
      });

      return NextResponse.json({
        success: true,
        message: "Test job offer created successfully",
        jobOffer,
      });
    }

    // Check for existing job offer
    const existingOffer = await db.collection("jobOffers").findOne({
      bookingId: booking._id.toString(),
      technicianId: technician._id.toString(),
    });

    if (existingOffer) {
      // Update existing offer
      const expiryTime = new Date();
      expiryTime.setMinutes(expiryTime.getMinutes() + 30);

      await db.collection("jobOffers").updateOne(
        { _id: existingOffer._id },
        {
          $set: {
            status: "pending",
            expiresAt: expiryTime,
            updatedAt: new Date(),
          },
        }
      );

      logger.info("Existing job offer updated", {
        userId,
        bookingId: booking._id.toString(),
      });

      return NextResponse.json({
        success: true,
        message: "Existing job offer updated successfully",
        jobOffer: {
          ...existingOffer,
          status: "pending",
          expiresAt: expiryTime,
          updatedAt: new Date(),
        },
      });
    }

    // Create new job offer for existing booking
    const jobOffer = await createJobOffer(booking._id.toString());

    logger.info("Test job offer created for existing booking", {
      userId,
      bookingId: booking._id.toString(),
    });

    return NextResponse.json({
      success: true,
      message: "Test job offer created successfully",
      jobOffer,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Error creating test job offer", { error: errorMessage, userId: "unknown" });
    return NextResponse.json(
      { success: false, message: `Failed to create test job offer: ${errorMessage}` },
      { status: 500 }
    );
  }
}