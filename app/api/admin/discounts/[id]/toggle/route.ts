import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Toggle discount active status
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded || (decoded as {role?: string}).role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Validate ObjectId
    let discountId;
    try {
      discountId = new ObjectId(params.id);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Invalid discount ID" },
        { status: 400 }
      );
    }

    // Get current discount
    const discount = await db.collection("discounts").findOne({ _id: discountId });

    if (!discount) {
      return NextResponse.json(
        { success: false, message: "Discount not found" },
        { status: 404 }
      );
    }

    // Toggle isActive status
    const newStatus = !discount.isActive;

    // Update discount
    const result = await db.collection("discounts").updateOne(
      { _id: discountId },
      {
        $set: {
          isActive: newStatus,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Failed to update discount status" },
        { status: 500 }
      );
    }

    // Get updated discount
    const updatedDiscount = await db.collection("discounts").findOne({ _id: discountId });

    return NextResponse.json({
      success: true,
      message: `Discount ${newStatus ? 'activated' : 'deactivated'} successfully`,
      discount: updatedDiscount,
    });
  } catch (error) {
    console.error("Error toggling discount status:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
