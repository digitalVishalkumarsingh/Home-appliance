import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Toggle the active status of a special offer (admin only)
export async function PATCH(
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
    const isActive = data.isActive;

    if (isActive === undefined) {
      return NextResponse.json(
        { success: false, message: "Missing isActive field" },
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

    // Update the active status
    await db.collection("specialOffers").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          isActive: isActive,
          updatedAt: new Date().toISOString()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: `Special offer ${isActive ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    console.error("Error toggling special offer status:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
