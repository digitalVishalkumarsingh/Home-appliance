import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Get all active special offers for users
export async function GET(request: Request) {
  try {
    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get current date
    const now = new Date().toISOString();

    // Check if user is authenticated
    const token = getTokenFromRequest(request);
    let userId = null;
    let userCreatedAt = null;
    let isNewUser = false;

    if (token) {
      try {
        const decoded = verifyToken(token);
        if (decoded && typeof decoded === 'object' && 'userId' in decoded) {
          userId = decoded.userId;

          // Get user creation date to determine if they're a new user
          const user = await db.collection("users").findOne({
            _id: new ObjectId(userId)
          });

          if (user) {
            userCreatedAt = user.createdAt;

            // Consider a user "new" if their account is less than 7 days old
            const creationDate = new Date(userCreatedAt);
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            isNewUser = creationDate > sevenDaysAgo;
          }
        }
      } catch (error) {
        console.error("Token verification failed:", error);
        // Continue without user context
      }
    }

    // Build query based on user status
    let query: any = {
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    };

    // Filter by user type if authenticated
    if (userId) {
      if (isNewUser) {
        // New users can see offers for new users and all users
        query.userType = { $in: ["new", "all"] };

        // Create a notification for the new user about special offers
        try {
          // Check if we've already created a notification for this user
          const existingNotification = await db.collection("notifications").findOne({
            userId,
            type: "new_user_offer"
          });

          if (!existingNotification) {
            // Create a notification about special offers for new users
            await db.collection("notifications").insertOne({
              userId,
              title: "Welcome Discount!",
              message: "As a new user, you have access to exclusive discounts on our services. Check them out!",
              type: "new_user_offer",
              isRead: false,
              createdAt: new Date().toISOString()
            });
          }
        } catch (notificationError) {
          console.error("Error creating new user offer notification:", notificationError);
          // Continue even if notification creation fails
        }
      } else {
        // Existing users can see offers for existing users and all users
        query.userType = { $in: ["existing", "all"] };
      }
    } else {
      // Unauthenticated users can only see offers for all users
      query.userType = "all";
    }

    // Find all active special offers matching the criteria
    let specialOffers = [];
    try {
      const cursor = db.collection("specialOffers").find(query);

      // Check if sort method exists and is a function
      if (cursor.sort && typeof cursor.sort === 'function') {
        const sortedCursor = cursor.sort({ createdAt: -1 });

        // Check if toArray method exists and is a function
        if (sortedCursor.toArray && typeof sortedCursor.toArray === 'function') {
          specialOffers = await sortedCursor.toArray();
        }
      }
    } catch (queryError) {
      console.error("Error in MongoDB query:", queryError);
      // Continue with empty specialOffers array
    }

    // If user is authenticated, check usage limits
    if (userId) {
      // Get usage data for this user
      let offerUsage = [];
      try {
        const cursor = db.collection("specialOfferUsage").find({ userId: userId });

        // Check if toArray method exists and is a function
        if (cursor.toArray && typeof cursor.toArray === 'function') {
          offerUsage = await cursor.toArray();
        }
      } catch (queryError) {
        console.error("Error in MongoDB query for offer usage:", queryError);
        // Continue with empty offerUsage array
      }

      // Create a map of offer usage counts
      const usageCounts: Record<string, number> = {};
      offerUsage.forEach(usage => {
        const offerId = usage.offerId.toString();
        usageCounts[offerId] = (usageCounts[offerId] || 0) + 1;
      });

      // Filter out offers that have reached their per-user limit
      const filteredOffers = specialOffers.filter(offer => {
        const offerId = offer._id.toString();
        const usageCount = usageCounts[offerId] || 0;

        // If there's a per-user limit and it's been reached, filter out this offer
        if (offer.usagePerUser && usageCount >= offer.usagePerUser) {
          return false;
        }

        return true;
      });

      return NextResponse.json({
        success: true,
        specialOffers: filteredOffers,
        isNewUser,
      });
    } else {
      // For unauthenticated users, return all matching offers
      return NextResponse.json({
        success: true,
        specialOffers,
        isAuthenticated: false,
      });
    }
  } catch (error) {
    console.error("Error fetching special offers:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Apply a special offer
export async function POST(request: Request) {
  try {
    // Parse request body
    const { offerId, serviceId, originalPrice } = await request.json();

    // Validate required fields
    if (!offerId || !originalPrice) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields. Need offerId and originalPrice."
        },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get current date
    const now = new Date().toISOString();

    // Find the special offer
    let specialOffer;
    try {
      specialOffer = await db.collection("specialOffers").findOne({
        _id: new ObjectId(offerId),
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now }
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Invalid offer ID" },
        { status: 400 }
      );
    }

    if (!specialOffer) {
      return NextResponse.json(
        { success: false, message: "Special offer not found or not active" },
        { status: 404 }
      );
    }

    // Check if user is authenticated
    const token = getTokenFromRequest(request);
    let userId = null;
    let userCreatedAt = null;
    let isNewUser = false;

    if (token) {
      try {
        const decoded = verifyToken(token);
        if (decoded && typeof decoded === 'object' && 'userId' in decoded) {
          userId = decoded.userId;

          // Get user creation date
          const user = await db.collection("users").findOne({
            _id: new ObjectId(userId)
          });

          if (user) {
            userCreatedAt = user.createdAt;

            // Consider a user "new" if their account is less than 7 days old
            const creationDate = new Date(userCreatedAt);
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            isNewUser = creationDate > sevenDaysAgo;
          }
        }
      } catch (error) {
        console.error("Token verification failed:", error);
        // Continue without user context
      }
    }

    // Check if the user type matches
    if (userId) {
      if (specialOffer.userType === "new" && !isNewUser) {
        return NextResponse.json(
          { success: false, message: "This offer is only for new users" },
          { status: 403 }
        );
      }

      if (specialOffer.userType === "existing" && isNewUser) {
        return NextResponse.json(
          { success: false, message: "This offer is only for existing users" },
          { status: 403 }
        );
      }

      // Check if the user has already used this offer
      if (specialOffer.usagePerUser) {
        const userUsageCount = await db.collection("specialOfferUsage").countDocuments({
          userId: userId,
          offerId: specialOffer._id
        });

        if (userUsageCount >= specialOffer.usagePerUser) {
          return NextResponse.json(
            { success: false, message: "You have already used this offer the maximum number of times" },
            { status: 403 }
          );
        }
      }
    } else if (specialOffer.userType !== "all") {
      // Unauthenticated users can only use offers for all users
      return NextResponse.json(
        { success: false, message: "You need to be logged in to use this offer" },
        { status: 403 }
      );
    }

    // Check total usage limit
    if (specialOffer.usageLimit) {
      const totalUsageCount = await db.collection("specialOfferUsage").countDocuments({
        offerId: specialOffer._id
      });

      if (totalUsageCount >= specialOffer.usageLimit) {
        return NextResponse.json(
          { success: false, message: "This offer has reached its usage limit" },
          { status: 403 }
        );
      }
    }

    // Parse the original price
    let price = parseFloat(originalPrice);
    if (isNaN(price)) {
      // Try to extract numeric value from string like "₹599"
      const numericValue = originalPrice.replace(/[^0-9.]/g, '');
      price = parseFloat(numericValue);

      if (isNaN(price)) {
        return NextResponse.json(
          { success: false, message: "Invalid price format" },
          { status: 400 }
        );
      }
    }

    // Calculate discounted price
    let discountedPrice = price;
    let discountAmount = 0;

    if (specialOffer.discountType === "percentage") {
      discountAmount = (price * specialOffer.discountValue) / 100;
      discountedPrice = price - discountAmount;
    } else {
      discountAmount = specialOffer.discountValue;
      discountedPrice = price - discountAmount;
    }

    // Ensure the discounted price is not negative
    discountedPrice = Math.max(0, discountedPrice);

    // Format the prices
    const formattedOriginalPrice = `₹${price.toFixed(0)}`;
    const formattedDiscountedPrice = `₹${discountedPrice.toFixed(0)}`;
    const formattedDiscountAmount = `₹${discountAmount.toFixed(0)}`;

    // Record offer usage if user is logged in
    if (userId) {
      await db.collection("specialOfferUsage").insertOne({
        userId,
        offerId: specialOffer._id,
        serviceId: serviceId || null,
        originalPrice: price,
        discountedPrice,
        discountAmount,
        appliedAt: new Date().toISOString()
      });
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
          : `₹${specialOffer.discountValue} off`
      }
    });
  } catch (error) {
    console.error("Error applying special offer:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
