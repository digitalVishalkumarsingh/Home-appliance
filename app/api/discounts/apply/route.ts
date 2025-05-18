import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Apply discount to a service price
export async function POST(request: Request) {
  try {
    // Verify user authentication (optional, can be used without login)
    const token = getTokenFromRequest(request);
    let userId = null;

    if (token) {
      try {
        const decoded = verifyToken(token);
        if (decoded && typeof decoded === 'object' && 'userId' in decoded) {
          userId = decoded.userId;
        }
      } catch (error) {
        // Token verification failed, but we'll still allow the request
        console.error("Token verification failed:", error);
      }
    }

    // Parse request body
    const { discountId, serviceId, categoryId, originalPrice } = await request.json();

    // Validate required fields
    if (!discountId || !originalPrice || (!serviceId && !categoryId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields. Need discountId, originalPrice, and either serviceId or categoryId."
        },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Find the discount
    let discount;
    try {
      discount = await db.collection("discounts").findOne({
        _id: new ObjectId(discountId),
        isActive: true,
        startDate: { $lte: new Date().toISOString() },
        endDate: { $gte: new Date().toISOString() }
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Invalid discount ID" },
        { status: 400 }
      );
    }

    if (!discount) {
      return NextResponse.json(
        { success: false, message: "Discount not found or not active" },
        { status: 404 }
      );
    }

    // Verify the discount applies to the service or category
    if (serviceId) {
      // Get the service to check its category
      const service = await db.collection("services").findOne({
        $or: [
          { _id: new ObjectId(serviceId) },
          { id: serviceId }
        ]
      });

      if (!service) {
        return NextResponse.json(
          { success: false, message: "Service not found" },
          { status: 404 }
        );
      }

      // Check if the service's category matches the discount's category
      if (service.categoryId && service.categoryId.toString() !== discount.categoryId) {
        return NextResponse.json(
          { success: false, message: "Discount not applicable to this service" },
          { status: 400 }
        );
      }
    } else if (categoryId && categoryId !== discount.categoryId) {
      return NextResponse.json(
        { success: false, message: "Discount not applicable to this category" },
        { status: 400 }
      );
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

    if (discount.discountType === "percentage") {
      discountAmount = (price * discount.discountValue) / 100;
      discountedPrice = price - discountAmount;
    } else if (discount.discountType === "fixed") {
      discountAmount = discount.discountValue;
      discountedPrice = price - discountAmount;
    }

    // Ensure the discounted price is not negative
    discountedPrice = Math.max(0, discountedPrice);

    // Format the prices - round only for display
    const formattedOriginalPrice = `₹${Math.round(price)}`;
    const formattedDiscountedPrice = `₹${Math.round(discountedPrice)}`;
    const formattedDiscountAmount = `₹${Math.round(discountAmount)}`;

    // Record discount usage if user is logged in
    if (userId) {
      await db.collection("discountUsage").insertOne({
        userId,
        discountId: discount._id.toString(),
        serviceId: serviceId || null,
        categoryId: categoryId || null,
        originalPrice: price,
        discountedPrice,
        discountAmount,
        appliedAt: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      discount: {
        ...discount,
        originalPrice: price,
        discountedPrice,
        discountAmount,
        formattedOriginalPrice,
        formattedDiscountedPrice,
        formattedDiscountAmount,
        savings: discount.discountType === "percentage"
          ? `${discount.discountValue}% off`
          : `₹${discount.discountValue} off`
      }
    });
  } catch (error) {
    console.error("Error applying discount:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

