import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest, AuthError, JwtPayload } from "@/app/lib/auth";
import { ObjectId } from "mongodb";
import { logger } from "@/app/config/logger";

// Auto-apply special offers based on user eligibility
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

    const { userId, role, email } = decoded;
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

    // Parse and validate request body
    const body = await request.json();
    const { serviceId, originalPrice } = body;

    if (originalPrice === undefined) {
      logger.warn("Missing required field: originalPrice", { body });
      return NextResponse.json(
        { success: false, message: "Original price is required" },
        { status: 400 }
      );
    }

    // Validate price
    let price: number;
    if (typeof originalPrice === "number") {
      price = originalPrice;
    } else if (typeof originalPrice === "string") {
      price = parseFloat(originalPrice.replace(/[^0-9.]/g, ""));
    } else {
      logger.warn("Invalid price format", { originalPrice });
      return NextResponse.json(
        { success: false, message: "Invalid price format" },
        { status: 400 }
      );
    }
    if (isNaN(price) || price < 0) {
      logger.warn("Invalid price value", { originalPrice, price });
      return NextResponse.json(
        { success: false, message: "Price must be a valid non-negative number" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });
    const now = new Date();

    // Check if user has any previous bookings
    const bookingsCount = await db.collection("bookings").countDocuments({
      $or: [{ userId }, { customerEmail: email || "" }],
      status: { $ne: "cancelled" },
    });

    // If not the user's first booking, return no offer
    if (bookingsCount > 0) {
      logger.debug("User ineligible due to existing bookings", { userId, bookingsCount });
      return NextResponse.json({
        success: true,
        message: "User is not eligible for first-time booking offer",
        isEligible: false,
        offer: null,
      });
    }

    // Get the first-time booking offer
    const firstTimeOffer = await db.collection("specialOffers").findOne({
      type: "first-booking",
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    // Use default offer if none exists (without auto-insertion)
    const defaultOffer = {
      title: "First-Time Booking Discount",
      description: "Special discount for your first booking with us!",
      type: "first-booking",
      discountType: "percentage",
      discountValue: 10,
      code: "FIRSTBOOKING",
      minOrderValue: 0,
      maxDiscountAmount: 500,
      isActive: true,
      startDate: new Date(now.getFullYear(), 0, 1),
      endDate: new Date(now.getFullYear() + 1, 11, 31),
      createdAt: now,
      updatedAt: now,
    };

    const offer = firstTimeOffer || defaultOffer;
    logger.debug("First-time offer selected", {
      userId,
      offerId: firstTimeOffer?._id?.toString() || "default",
    });

    // Validate minimum order value
    if (offer.minOrderValue && price < offer.minOrderValue) {
      logger.warn("Price below minimum order value", { userId, price, minOrderValue: offer.minOrderValue });
      return NextResponse.json({
        success: false,
        message: `Price must be at least ₹${offer.minOrderValue} to apply this offer`,
        isEligible: true,
        offer: null,
      });
    }

    // Calculate discount
    let discountAmount = 0;
    let discountedPrice = price;
    if (offer.discountType === "percentage") {
      discountAmount = (price * offer.discountValue) / 100;
      if (offer.maxDiscountAmount && discountAmount > offer.maxDiscountAmount) {
        discountAmount = offer.maxDiscountAmount;
      }
    } else {
      discountAmount = offer.discountValue;
    }
    discountedPrice = Math.max(0, price - discountAmount);

    // Format prices
    const formattedOriginalPrice = `₹${Math.round(price)}`;
    const formattedDiscountedPrice = `₹${Math.round(discountedPrice)}`;
    const formattedDiscountAmount = `₹${Math.round(discountAmount)}`;

    // Create applied offer object
    const appliedOffer = {
      ...offer,
      _id: firstTimeOffer?._id || null,
      originalPrice: price,
      discountedPrice,
      discountAmount,
      formattedOriginalPrice,
      formattedDiscountedPrice,
      formattedDiscountAmount,
      savings: offer.discountType === "percentage" ? `${offer.discountValue}% off` : `₹${offer.discountValue} off`,
      isAutoApplied: true,
    };

    // Record offer usage
    if (firstTimeOffer) {
      await db.collection("specialOfferUsage").insertOne({
        userId,
        offerId: firstTimeOffer._id,
        serviceId: serviceId ? new ObjectId(serviceId) : null,
        originalPrice: price,
        discountedPrice,
        discountAmount,
        appliedAt: now,
      });
      logger.debug("Offer usage recorded", { userId, offerId: firstTimeOffer._id.toString(), serviceId });
    }

    return NextResponse.json({
      success: true,
      message: "First-time booking offer applied automatically",
      isEligible: true,
      offer: appliedOffer,
    });
  } catch (error) {
    logger.error("Error auto-applying special offer", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}