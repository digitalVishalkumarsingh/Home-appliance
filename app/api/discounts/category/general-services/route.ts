import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";

// Get active discounts for general services
export async function GET() {
  try {
    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get current date
    const now = new Date().toISOString();

    // Try to find the general services category
    let category = await db.collection("serviceCategories").findOne({ slug: "general-services" });

    // If category doesn't exist, create it
    if (!category) {
      const newCategory = {
        name: "General Services",
        slug: "general-services",
        description: "General home services and repairs",
        icon: "tools",
        isActive: true,
        order: 10, // Set a high order to place it at the end
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      try {
        const result = await db.collection("serviceCategories").insertOne(newCategory);
        category = {
          ...newCategory,
          _id: result.insertedId
        };
      } catch (error) {
        console.error("Error creating general services category:", error);
        // Return empty discounts if category creation fails
        return NextResponse.json({
          success: true,
          discounts: [],
          category: null
        });
      }
    }

    // Find active discounts for this category
    const discounts = await db.collection("discounts").find({
      $or: [
        { categoryId: category._id.toString() },
        { categoryId: "general-services" }
      ],
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).toArray();

    // If no specific discounts found, get general discounts
    if (!discounts || discounts.length === 0) {
      // Find general discounts that apply to all categories
      const generalDiscounts = await db.collection("discounts").find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
        categoryId: { $in: ["all", "general"] }
      }).toArray();

      return NextResponse.json({
        success: true,
        discounts: generalDiscounts,
        category
      });
    }

    return NextResponse.json({
      success: true,
      discounts,
      category
    });
  } catch (error) {
    console.error("Error fetching general services discounts:", error);
    return NextResponse.json(
      { success: true, discounts: [], message: "No discounts available" },
      { status: 200 } // Return 200 instead of error to prevent console errors
    );
  }
}
