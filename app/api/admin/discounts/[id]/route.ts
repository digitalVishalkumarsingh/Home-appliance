import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Get a specific discount
export async function GET(
  request: Request,
  context: { params: { id: string } }
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

    // Get params from context
    const params = await context.params;

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

    // Get the discount
    const discount = await db.collection("discounts").findOne({ _id: discountId });

    if (!discount) {
      return NextResponse.json(
        { success: false, message: "Discount not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      discount,
    });
  } catch (error) {
    console.error("Error fetching discount:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update a discount
export async function PUT(
  request: Request,
  context: { params: { id: string } }
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

    // Parse request body
    const updateData = await request.json();

    // Get params from context
    const params = await context.params;

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

    // Check if discount exists
    const existingDiscount = await db.collection("discounts").findOne({ _id: discountId });

    if (!existingDiscount) {
      return NextResponse.json(
        { success: false, message: "Discount not found" },
        { status: 404 }
      );
    }

    // Check if category exists if categoryId is provided
    let category = null;
    if (updateData.categoryId) {
      category = await db.collection("serviceCategories").findOne({
        $or: [
          { _id: new ObjectId(updateData.categoryId) },
          { slug: updateData.categoryId }
        ]
      });

      if (!category) {
        return NextResponse.json(
          { success: false, message: "Category not found" },
          { status: 404 }
        );
      }
    }

    // Update discount
    const result = await db.collection("discounts").updateOne(
      { _id: discountId },
      {
        $set: {
          name: updateData.name || existingDiscount.name,
          description: updateData.description || existingDiscount.description,
          categoryId: category ? category._id.toString() : existingDiscount.categoryId,
          categoryName: category ? category.name : existingDiscount.categoryName,
          discountType: updateData.discountType || existingDiscount.discountType,
          discountValue: updateData.discountValue !== undefined ? Number(updateData.discountValue) : existingDiscount.discountValue,
          startDate: updateData.startDate ? new Date(updateData.startDate).toISOString() : existingDiscount.startDate,
          endDate: updateData.endDate ? new Date(updateData.endDate).toISOString() : existingDiscount.endDate,
          isActive: updateData.isActive !== undefined ? updateData.isActive : existingDiscount.isActive,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, message: "No changes made to the discount" },
        { status: 304 }
      );
    }

    // Get updated discount
    const updatedDiscount = await db.collection("discounts").findOne({ _id: discountId });

    return NextResponse.json({
      success: true,
      message: "Discount updated successfully",
      discount: updatedDiscount,
    });
  } catch (error) {
    console.error("Error updating discount:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete a discount
export async function DELETE(
  request: Request,
  context: { params: { id: string } }
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

    // Get params from context
    const params = await context.params;

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

    // Delete discount
    const result = await db.collection("discounts").deleteOne({ _id: discountId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Discount not found" },
        { status: 404 }
      );
    }

    // Delete related notifications
    await db.collection("notifications").deleteMany({
      type: "discount",
      referenceId: params.id
    });

    return NextResponse.json({
      success: true,
      message: "Discount deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting discount:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
