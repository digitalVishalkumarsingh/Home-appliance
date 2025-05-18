import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Define interfaces
interface SpecialOffer {
  _id?: string | ObjectId;
  name: string;
  description: string;
  offerCode?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  userType: "new" | "existing" | "all";
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usagePerUser?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Get all special offers (admin only)
export async function GET(request: Request) {
  try {
    // Verify admin authentication
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || typeof decoded !== "object" || !("role" in decoded) || decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get all special offers
    const specialOffers = await db
      .collection("specialOffers")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      specialOffers,
    });
  } catch (error) {
    console.error("Error fetching special offers:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create a new special offer (admin only)
export async function POST(request: Request) {
  try {
    // Verify admin authentication
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || typeof decoded !== "object" || !("role" in decoded) || decoded.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admin access required" },
        { status: 403 }
      );
    }

    // Parse request body
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.discountType || data.discountValue === undefined || !data.userType || !data.startDate || !data.endDate) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate discount value
    if (data.discountType === "percentage" && (data.discountValue < 0 || data.discountValue > 100)) {
      return NextResponse.json(
        { success: false, message: "Percentage discount must be between 0 and 100" },
        { status: 400 }
      );
    }

    if (data.discountType === "fixed" && data.discountValue < 0) {
      return NextResponse.json(
        { success: false, message: "Fixed discount must be a positive number" },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { success: false, message: "Invalid date format" },
        { status: 400 }
      );
    }

    if (endDate < startDate) {
      return NextResponse.json(
        { success: false, message: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Check if offer code already exists (if provided)
    if (data.offerCode) {
      const existingOffer = await db.collection("specialOffers").findOne({
        offerCode: data.offerCode,
      });

      if (existingOffer) {
        return NextResponse.json(
          { success: false, message: "Offer code already exists" },
          { status: 409 }
        );
      }
    }

    // Create new special offer
    const newSpecialOffer: SpecialOffer = {
      name: data.name,
      description: data.description || "",
      offerCode: data.offerCode || undefined,
      discountType: data.discountType,
      discountValue: Number(data.discountValue),
      userType: data.userType,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
      usageLimit: data.usageLimit ? Number(data.usageLimit) : undefined,
      usagePerUser: data.usagePerUser ? Number(data.usagePerUser) : undefined,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection("specialOffers").insertOne(newSpecialOffer);

    return NextResponse.json({
      success: true,
      message: "Special offer created successfully",
      specialOffer: {
        ...newSpecialOffer,
        _id: result.insertedId,
      },
    });
  } catch (error) {
    console.error("Error creating special offer:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
