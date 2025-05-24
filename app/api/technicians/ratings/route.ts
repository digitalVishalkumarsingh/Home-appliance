import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest, AuthError, JwtPayload } from "@/app/lib/auth";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { logger } from "@/app/config/logger";

// Schema for POST request validation
const RatingSchema = z.object({
  technicianId: z.string().min(1, "Technician ID is required"),
  bookingId: z.string().min(1, "Booking ID is required"),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
  comment: z.string().optional(),
  service: z.string().optional(),
}).strict();

// GET handler to fetch technician ratings
export async function GET(request: NextRequest) {
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
    if (!userId) {
      logger.warn("Invalid token: missing userId", { userId, role });
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const technicianId = url.searchParams.get("technicianId");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100); // Cap limit at 100
    const skip = Math.max(parseInt(url.searchParams.get("skip") || "0"), 0); // Ensure non-negative skip

    // Validate input
    if (!technicianId) {
      logger.warn("Missing technicianId parameter", { userId });
      return NextResponse.json(
        { success: false, message: "Technician ID is required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Find technician by userId or _id
    const orConditions = [];
    if (ObjectId.isValid(technicianId)) {
      orConditions.push({ _id: new ObjectId(technicianId) });
    }
    orConditions.push({ userId: technicianId });
    const technician = await db.collection("technicians").findOne({
      $or: orConditions,
    });

    if (!technician) {
      logger.warn("Technician not found", { userId, technicianId });
      return NextResponse.json(
        { success: false, message: "Technician not found" },
        { status: 404 }
      );
    }

    // Restrict access to technicians viewing their own ratings or authorized roles
    if (role !== "technician" || (role === "technician" && technician.userId !== userId)) {
      logger.warn("Unauthorized access to ratings", { userId, technicianId, role });
      return NextResponse.json(
        { success: false, message: "Unauthorized: Cannot view ratings for this technician" },
        { status: 403 }
      );
    }

    // Get ratings for the technician
    const ratings = await db
      .collection("ratings")
      .find({ technicianId: technician._id.toString() })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count of ratings
    const totalRatings = await db.collection("ratings").countDocuments({ technicianId: technician._id.toString() });

    // If no ratings, return empty response with defaults
    if (!ratings || ratings.length === 0) {
      logger.debug("No ratings found for technician", { userId, technicianId: technician._id.toString() });
      return NextResponse.json({
        success: true,
        ratings: [],
        summary: {
          averageRating: 0,
          totalRatings: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        },
        pagination: {
          total: 0,
          limit,
          skip,
          hasMore: false,
        },
      });
    }

    // Get customer names for ratings
    const userIds = ratings
      .map((rating) => (ObjectId.isValid(rating.userId) ? new ObjectId(rating.userId) : null))
      .filter((id): id is ObjectId => id !== null);
    const users = await db
      .collection("users")
      .find({ _id: { $in: userIds } })
      .project({ _id: 1, name: 1 })
      .toArray();

    // Map user names to ratings and serialize
    const ratingsWithCustomerNames = ratings.map((rating) => {
      const user = users.find((u) => u._id.toString() === rating.userId);
      return {
        ...rating,
        _id: rating._id.toString(),
        createdAt: rating.createdAt instanceof Date ? rating.createdAt.toISOString() : rating.createdAt,
        customerName: user?.name || "Anonymous",
      };
    });

    // Calculate summary metrics
    const totalRatingValue = ratings.reduce((sum, r) => sum + (r.rating || 0), 0);
    const averageRating = totalRatings > 0 ? Number((totalRatingValue / totalRatings).toFixed(2)) : 0;

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        ratingDistribution[r.rating as keyof typeof ratingDistribution]++;
      }
    });

    logger.debug("Technician ratings retrieved", {
      userId,
      technicianId: technician._id.toString(),
      totalRatings,
      limit,
      skip,
    });

    return NextResponse.json({
      success: true,
      ratings: ratingsWithCustomerNames,
      summary: {
        averageRating,
        totalRatings,
        ratingDistribution,
      },
      pagination: {
        total: totalRatings,
        limit,
        skip,
        hasMore: skip + limit < totalRatings,
      },
    });
  } catch (error) {
    logger.error("Error fetching technician ratings", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, message: "Failed to fetch technician ratings" },
      { status: 500 }
    );
  }
}

// POST handler to submit a rating for a technician
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
    if (!userId || role !== "customer") {
      logger.warn("Unauthorized rating submission", { userId, role });
      return NextResponse.json(
        { success: false, message: "Unauthorized: Customer role required" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    let ratingData: z.infer<typeof RatingSchema>;
    try {
      ratingData = RatingSchema.parse(body);
    } catch (validationError) {
      logger.warn("Invalid rating data", {
        error: validationError instanceof Error ? validationError.message : "Unknown validation error",
      });
      return NextResponse.json(
        {
          success: false,
          message: `Invalid rating data: ${validationError instanceof z.ZodError ? validationError.errors.map(e => e.message).join(", ") : "Unknown validation error"}`,
        },
        { status: 400 }
      );
    }

    const { technicianId, bookingId, rating, comment, service } = ratingData;

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Find technician
    const orConditions = [];
    if (ObjectId.isValid(technicianId)) {
      orConditions.push({ _id: new ObjectId(technicianId) });
    }
    orConditions.push({ userId: technicianId });
    const technician = await db.collection("technicians").findOne({
      $or: orConditions,
    });

    if (!technician) {
      logger.warn("Technician not found", { userId, technicianId });
      return NextResponse.json(
        { success: false, message: "Technician not found" },
        { status: 404 }
      );
    }

    // Find booking
    const bookingFilter: any = {
      userId,
      technicianId: technician._id.toString(),
      status: "completed",
    };
    if (ObjectId.isValid(bookingId)) {
      bookingFilter._id = new ObjectId(bookingId);
    } else {
      // If bookingId is not valid, booking will not be found
      logger.warn("Invalid bookingId format", { userId, bookingId });
      return NextResponse.json(
        { success: false, message: "Invalid booking ID format" },
        { status: 400 }
      );
    }
    const booking = await db.collection("bookings").findOne(bookingFilter);

    if (!booking) {
      logger.warn("Invalid or unauthorized booking", { userId, bookingId, technicianId: technician._id.toString() });
      return NextResponse.json(
        { success: false, message: "Booking not found or not eligible for rating" },
        { status: 404 }
      );
    }

    // Check if user has already rated this booking
    const existingRating = await db.collection("ratings").findOne({
      bookingId: booking._id.toString(),
      userId,
    });

    if (existingRating) {
      logger.warn("Duplicate rating attempt", { userId, bookingId, technicianId: technician._id.toString() });
      return NextResponse.json(
        { success: false, message: "You have already rated this booking" },
        { status: 400 }
      );
    }

    // Create new rating
    const now = new Date();
    const newRating = {
      bookingId: booking._id.toString(),
      userId,
      technicianId: technician._id.toString(),
      rating,
      comment: comment || "",
      service: service || booking.service || "Unknown Service",
      createdAt: now,
    };

    const result = await db.collection("ratings").insertOne(newRating);

    // Update booking with rating information
    await db.collection("bookings").updateOne(
      { _id: booking._id },
      { $set: { rated: true, ratingId: result.insertedId.toString(), updatedAt: now } }
    );

    // Update technician's average rating
    const allRatings = await db.collection("ratings").find({ technicianId: technician._id.toString() }).toArray();
    const averageRating = allRatings.length > 0
      ? Number((allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length).toFixed(2))
      : 0;

    await db.collection("technicians").updateOne(
      { _id: technician._id },
      { $set: { averageRating, updatedAt: now } }
    );

    logger.debug("Rating submitted", {
      userId,
      technicianId: technician._id.toString(),
      bookingId,
      rating,
    });

    return NextResponse.json({
      success: true,
      message: "Rating submitted successfully",
      rating: {
        ...newRating,
        _id: result.insertedId.toString(),
        createdAt: newRating.createdAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error submitting rating", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, message: "Failed to submit rating" },
      { status: 500 }
    );
  }
}