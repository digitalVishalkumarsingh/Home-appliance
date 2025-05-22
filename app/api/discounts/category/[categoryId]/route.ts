import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { ObjectId } from "mongodb";

// Get active discounts for a specific category
export async function GET(
  request: Request,
  context: { params: Promise<{ categoryId: string }> }
) {
  try {
    // Get params from context
    const params = await context.params;
    const categoryId = params.categoryId;

    if (!categoryId) {
      return NextResponse.json(
        { success: false, message: "Category ID is required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Find the category
    let category;
    try {
      // Try to find by ObjectId
      category = await db.collection("serviceCategories").findOne({
        $or: [
          { _id: new ObjectId(categoryId) },
          { slug: categoryId }
        ]
      });
    } catch (error) {
      // If ObjectId conversion fails, try to find by slug
      category = await db.collection("serviceCategories").findOne({ slug: categoryId });
    }

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    // Get current date
    const now = new Date().toISOString();

    // Find active discounts for this category
    const discounts = await db.collection("discounts").find({
      categoryId: category._id.toString(),
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).toArray();

    return NextResponse.json({
      success: true,
      discounts,
      category
    });
  } catch (error) {
    console.error("Error fetching category discounts:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
