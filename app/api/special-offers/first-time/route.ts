import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Check if a user is eligible for first-time booking discount
export async function GET(request: Request) {
  try {
    // Verify user authentication
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const userId = (decoded as { userId?: string }).userId;
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID not found in token" },
        { status: 400 }
      );
    }

    // Check if user is an admin
    const userRole = (decoded as { role?: string }).role;
    if (userRole === 'admin') {
      return NextResponse.json({
        success: true,
        message: "Admin users are not eligible for special offers",
        isEligible: false,
        offer: null
      });
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Check if user has any previous bookings
    const bookingsCount = await db.collection("bookings").countDocuments({
      userId: userId,
      status: { $ne: "cancelled" } // Don't count cancelled bookings
    });

    // Get the first-time booking offer
    const firstTimeOffer = await db.collection("specialOffers").findOne({
      type: "first-booking",
      isActive: true,
      startDate: { $lte: new Date().toISOString() },
      endDate: { $gte: new Date().toISOString() }
    });

    // If no first-time offer is configured, create a default one
    let offer = firstTimeOffer;
    if (!offer) {
      // Create a default first-time booking offer
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
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString(), // Jan 1 of current year
        endDate: new Date(new Date().getFullYear() + 1, 11, 31).toISOString(), // Dec 31 of next year
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        // Try to insert the default offer
        const result = await db.collection("specialOffers").insertOne(defaultOffer);
        offer = {
          ...defaultOffer,
          _id: result.insertedId
        };
      } catch (error) {
        console.error("Error creating default first-time booking offer:", error);
        // Continue without creating a default offer
      }
    }

    // Determine if user is eligible
    const isEligible = bookingsCount === 0;

    return NextResponse.json({
      success: true,
      isEligible,
      bookingsCount,
      offer: isEligible ? offer : null
    });
  } catch (error) {
    console.error("Error checking first-time booking eligibility:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
