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

// Get a specific special offer by ID (admin only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const id = (await params).id;

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

    // Find the special offer by ID
    let specialOffer;
    try {
      specialOffer = await db.collection("specialOffers").findOne({
        _id: new ObjectId(id),
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Invalid offer ID" },
        { status: 400 }
      );
    }

    if (!specialOffer) {
      return NextResponse.json(
        { success: false, message: "Special offer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      specialOffer,
    });
  } catch (error) {
    console.error("Error fetching special offer:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update a special offer (admin only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const id = (await params).id;

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

    // Check if offer exists
    let specialOffer;
    try {
      specialOffer = await db.collection("specialOffers").findOne({
        _id: new ObjectId(id),
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Invalid offer ID" },
        { status: 400 }
      );
    }

    if (!specialOffer) {
      return NextResponse.json(
        { success: false, message: "Special offer not found" },
        { status: 404 }
      );
    }

    // Check if offer code already exists (if provided and changed)
    if (data.offerCode && data.offerCode !== specialOffer.offerCode) {
      const existingOffer = await db.collection("specialOffers").findOne({
        offerCode: data.offerCode,
        _id: { $ne: new ObjectId(id) },
      });

      if (existingOffer) {
        return NextResponse.json(
          { success: false, message: "Offer code already exists" },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: Partial<SpecialOffer> = {
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
      updatedAt: new Date().toISOString(),
    };

    // Update the special offer
    await db.collection("specialOffers").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // Get the updated offer
    const updatedOffer = await db.collection("specialOffers").findOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json({
      success: true,
      message: "Special offer updated successfully",
      specialOffer: updatedOffer,
    });
  } catch (error) {
    console.error("Error updating special offer:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete a special offer (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const id = params.id;

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

    // Check if offer exists
    let specialOffer;
    try {
      specialOffer = await db.collection("specialOffers").findOne({
        _id: new ObjectId(id),
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Invalid offer ID" },
        { status: 400 }
      );
    }

    if (!specialOffer) {
      return NextResponse.json(
        { success: false, message: "Special offer not found" },
        { status: 404 }
      );
    }

    // Delete the special offer
    await db.collection("specialOffers").deleteOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json({
      success: true,
      message: "Special offer deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting special offer:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
