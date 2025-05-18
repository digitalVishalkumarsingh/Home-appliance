import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { ObjectId } from "mongodb";

// Get a specific service category by slug
export async function GET(
  request: Request,
  context: { params: { slug: string } }
) {
  try {
    // Get params from context
    const params = await context.params;
    const slug = params.slug;

    if (!slug) {
      return NextResponse.json(
        { success: false, message: "Category slug is required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Find the category by slug
    const category = await db.collection("serviceCategories").findOne({ slug });

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Service category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (error) {
    console.error("Error fetching service category:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
