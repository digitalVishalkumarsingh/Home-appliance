import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest, AuthError, JwtPayload } from "@/app/lib/auth";
import { ObjectId } from "mongodb";
import { logger } from "@/app/config/logger";

// Get all active special offers for users
export async function GET(request: NextRequest) {
  try {
    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });
    const now = new Date();

    // Check if user is authenticated
    let userId: string | null = null;
    let isNewUser = false;
    try {
      const token = getTokenFromRequest(request);
      const decoded = await verifyToken(token);
      userId = decoded.userId;

      // Get user creation date to determine if they're a new user
      const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
      if (user && user.createdAt) {
        const creationDate = new Date(user.createdAt);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        isNewUser = creationDate > sevenDaysAgo;
        logger.debug("User status checked", { userId, isNewUser });
      }
    } catch (error) {
      logger.warn("Token verification failed, proceeding as unauthenticated", {
        error: error instanceof Error ? error.message : "Unknown error",
        code: error instanceof AuthError ? error.code : "UNKNOWN",
      });
    }

    // Build query for special offers
    const query: any = {
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    };

    if (userId) {
      query.userType = { $in: isNewUser ? ["new", "all"] : ["existing", "all"] };
    } else {
      query.userType = "all";
    }

    // Fetch active special offers
    const specialOffers = await db
      .collection("specialOffers")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Create notification for new users
    if (userId && isNewUser) {
      try {
        const existingNotification = await db.collection("notifications").findOne({
          userId,
          type: "new_user_offer",
        });

        if (!existingNotification) {
          await db.collection("notifications").insertOne({
            userId,
            title: "Welcome Discount!",
            message: "As a new user, you have access to exclusive discounts on our services. Check them out!",
            type: "new_user_offer",
            isRead: false,
            createdAt: now,
          });
          logger.debug("New user notification created", { userId });
        }
      } catch (error) {
        logger.warn("Failed to create new user notification", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Filter offers based on usage limits for authenticated users
    if (userId) {
      const offerUsage = await db
        .collection("specialOfferUsage")
        .find({ userId })
        .toArray();

      const usageCounts: Record<string, number> = {};
      offerUsage.forEach((usage) => {
        const offerId = usage.offerId.toString();
        usageCounts[offerId] = (usageCounts[offerId] || 0) + 1;
      });

      const filteredOffers = specialOffers.filter((offer) => {
        const offerId = offer._id.toString();
        const usageCount = usageCounts[offerId] || 0;
        return !offer.usagePerUser || usageCount < offer.usagePerUser;
      });

      return NextResponse.json({
        success: true,
        specialOffers: filteredOffers,
        isNewUser,
      });
    }

    return NextResponse.json({
      success: true,
      specialOffers,
      isAuthenticated: false,
    });
  } catch (error) {
    logger.error("Error fetching special offers", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Apply a special offer
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { offerId, serviceId, originalPrice } = body;

    if (!offerId || originalPrice === undefined) {
      logger.warn("Missing required fields in request body", { offerId, originalPrice });
      return NextResponse.json(
        { success: false, message: "Missing required fields: offerId and originalPrice" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });
    const now = new Date();

    // Find the special offer
    const specialOffer = await db.collection("specialOffers").findOne({
      _id: new ObjectId(offerId),
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    if (!specialOffer) {
      logger.warn("Special offer not found or inactive", { offerId });
      return NextResponse.json(
        { success: false, message: "Special offer not found or not active" },
        { status: 404 }
      );
    }

    // Check if user is authenticated
    let userId: string | null = null;
    let isNewUser = false;
    try {
      const token = getTokenFromRequest(request);
      const decoded = await verifyToken(token);
      userId = decoded.userId;

      const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
      if (user && user.createdAt) {
        const creationDate = new Date(user.createdAt);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        isNewUser = creationDate > sevenDaysAgo;
      }
    } catch (error) {
      logger.warn("Token verification failed for POST request", {
        error: error instanceof Error ? error.message : "Unknown error",
        code: error instanceof AuthError ? error.code : "UNKNOWN",
      });
    }

    // Validate user type
    if (userId) {
      if (specialOffer.userType === "new" && !isNewUser) {
        logger.warn("Offer restricted to new users", { userId, offerId });
        return NextResponse.json(
          { success: false, message: "This offer is only for new users" },
          { status: 403 }
        );
      }
      if (specialOffer.userType === "existing" && isNewUser) {
        logger.warn("Offer restricted to existing users", { userId, offerId });
        return NextResponse.json(
          { success: false, message: "This offer is only for existing users" },
          { status: 403 }
        );
      }

      // Check per-user usage limit
      if (specialOffer.usagePerUser) {
        const userUsageCount = await db.collection("specialOfferUsage").countDocuments({
          userId,
          offerId: specialOffer._id,
        });
        if (userUsageCount >= specialOffer.usagePerUser) {
          logger.warn("User exceeded offer usage limit", { userId, offerId, userUsageCount });
          return NextResponse.json(
            { success: false, message: "You have reached the maximum usage for this offer" },
            { status: 403 }
          );
        }
      }
    } else if (specialOffer.userType !== "all") {
      logger.warn("Authentication required for offer", { offerId });
      return NextResponse.json(
        { success: false, message: "You must be logged in to use this offer" },
        { status: 401 }
      );
    }

    // Check total usage limit
    if (specialOffer.usageLimit) {
      const totalUsageCount = await db.collection("specialOfferUsage").countDocuments({
        offerId: specialOffer._id,
      });
      if (totalUsageCount >= specialOffer.usageLimit) {
        logger.warn("Offer reached total usage limit", { offerId, totalUsageCount });
        return NextResponse.json(
          { success: false, message: "This offer has reached its total usage limit" },
          { status: 403 }
        );
      }
    }

    // Parse and validate price
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

    // Calculate discounted price
    let discountAmount = 0;
    let discountedPrice = price;
    if (specialOffer.discountType === "percentage") {
      discountAmount = (price * specialOffer.discountValue) / 100;
    } else {
      discountAmount = specialOffer.discountValue;
    }
    discountedPrice = Math.max(0, price - discountAmount);

    // Format prices
    const formattedOriginalPrice = `₹${price.toFixed(0)}`;
    const formattedDiscountedPrice = `₹${discountedPrice.toFixed(0)}`;
    const formattedDiscountAmount = `₹${discountAmount.toFixed(0)}`;

    // Record offer usage for authenticated users
    if (userId) {
      await db.collection("specialOfferUsage").insertOne({
        userId,
        offerId: specialOffer._id,
        serviceId: serviceId ? new ObjectId(serviceId) : null,
        originalPrice: price,
        discountedPrice,
        discountAmount,
        appliedAt: now,
      });
      logger.debug("Offer usage recorded", { userId, offerId, serviceId });
    }

    return NextResponse.json({
      success: true,
      specialOffer: {
        ...specialOffer,
        originalPrice: price,
        discountedPrice,
        discountAmount,
        formattedOriginalPrice,
        formattedDiscountedPrice,
        formattedDiscountAmount,
        savings: specialOffer.discountType === "percentage"
          ? `${specialOffer.discountValue}% off`
          : `₹${specialOffer.discountValue} off`,
      },
    });
  } catch (error) {
    logger.error("Error applying special offer", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}