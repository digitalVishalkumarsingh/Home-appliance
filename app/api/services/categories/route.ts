import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";

// Get all active service categories for client
export async function GET(request: Request) {
  try {
    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get all active service categories
    let categories = [];
    try {
      // Try the standard MongoDB query chain
      const cursor = db.collection("serviceCategories").find({ isActive: true });

      // Check if sort method exists and is a function
      if (cursor.sort && typeof cursor.sort === 'function') {
        const sortedCursor = cursor.sort({ order: 1 });

        // Check if toArray method exists and is a function
        if (sortedCursor.toArray && typeof sortedCursor.toArray === 'function') {
          categories = await sortedCursor.toArray();
        }
      }
    } catch (queryError) {
      console.error("Error in MongoDB query:", queryError);
      // Continue with empty categories array
    }

    // If no categories found in database, create default ones
    if (!categories || categories.length === 0) {
      const defaultCategories = [
        {
          name: "AC Services",
          slug: "ac-services",
          description: "Professional air conditioner repair, installation, and maintenance services",
          icon: "ac",
          isActive: true,
          order: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          name: "Washing Machine Services",
          slug: "washing-machine-services",
          description: "Expert washing machine repair and maintenance for all brands",
          icon: "washing-machine",
          isActive: true,
          order: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          name: "Refrigerator Services",
          slug: "refrigerator-services",
          description: "Reliable refrigerator repair and maintenance services",
          icon: "refrigerator",
          isActive: true,
          order: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          name: "TV Services",
          slug: "tv-services",
          description: "Professional TV repair and installation services",
          icon: "tv",
          isActive: true,
          order: 4,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          name: "Microwave Services",
          slug: "microwave-services",
          description: "Expert microwave oven repair and maintenance",
          icon: "microwave",
          isActive: true,
          order: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      try {
        // Insert default categories
        await db.collection("serviceCategories").insertMany(defaultCategories);

        return NextResponse.json({
          success: true,
          categories: defaultCategories,
          source: "default"
        });
      } catch (insertError) {
        console.error("Error inserting default categories:", insertError);

        return NextResponse.json({
          success: true,
          categories: defaultCategories,
          source: "static"
        });
      }
    }

    return NextResponse.json({
      success: true,
      categories,
      source: "database"
    });
  } catch (error) {
    console.error("Error fetching service categories:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
