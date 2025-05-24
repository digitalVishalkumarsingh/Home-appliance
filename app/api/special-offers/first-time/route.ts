import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest, AuthError, JwtPayload } from "@/app/lib/auth";
import { ObjectId } from "mongodb";
import { logger } from "@/app/config/logger";

// Check if a user is eligible for first-time booking discount
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
      logger.warn("User ID not found in token", { token });
      return NextResponse.json(
        { success: false, message: "Invalid token payload" },
        { status: 400 }
      );
    }

    // Check if user is an admin
    if (role === "admin") {
      logger.debug("Admin user checked for eligibility", { userId });
      return NextResponse.json({
        success: true,
        message: "Admin users are not eligible for special offers",
        isEligible: false,
        offer: null,
      });
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Check if user has any previous bookings
    const bookingsCount = await db.collection("bookings").countDocuments({
      userId: new ObjectId(userId), // Convert to ObjectId for MongoDB query
      status: { $ne: "cancelled" }, // Exclude cancelled bookings
    });

    // Get the first-time booking offer
    const currentDate = new Date();
    const firstTimeOffer = await db.collection("specialOffers").findOne({
      type: "first-booking",
      isActive: true,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    });

    // If no first-time offer exists, use a default (avoid auto-insertion)
    const defaultOffer = {
      title: "First-Time Booking Discount",
      description: "Special discount for your first booking with us!",
      type: "first-booking",
      discountType: "percentage",
      discountValue: 10, // 10% discount
      code: "FIRSTBOOKING",
      minOrderValue: 0,
      maxDiscountAmount: 500, // Maximum discount of ₹500
      isActive: true,
      startDate: new Date(currentDate.getFullYear(), 0, 1),
      endDate: new Date(currentDate.getFullYear() + 1, 11, 31),
      createdAt: currentDate,
      updatedAt: currentDate,
    };

    const offer = firstTimeOffer || defaultOffer;

    // Determine if user is eligible
    const isEligible = bookingsCount === 0;

    logger.debug("First-time booking eligibility checked", {
      userId,
      bookingsCount,
      isEligible,
      offerId: firstTimeOffer?._id?.toString() || "default",
    });

    return NextResponse.json({
      success: true,
      isEligible,
      bookingsCount,
      offer: isEligible ? offer : null,
    });
  } catch (error) {
    logger.error("Error checking first-time booking eligibility", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}