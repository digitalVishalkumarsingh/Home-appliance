import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Define interfaces
interface ServiceCategory {
  _id?: string | ObjectId;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Get all service categories
export async function GET(request: Request) {
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

    // Get all service categories
    const categories = await db
      .collection("serviceCategories")
      .find({})
      .sort({ order: 1 })
      .toArray();

    // If no categories found in database, return default ones
    if (!categories || categories.length === 0) {
      const defaultCategories = [
        {
          _id: "ac-services",
          name: "AC Services",
          slug: "ac-services",
          description: "All air conditioner related services",
          icon: "ac",
          isActive: true,
          order: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: "washing-machine-services",
          name: "Washing Machine Services",
          slug: "washing-machine-services",
          description: "All washing machine related services",
          icon: "washing-machine",
          isActive: true,
          order: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: "refrigerator-services",
          name: "Refrigerator Services",
          slug: "refrigerator-services",
          description: "All refrigerator related services",
          icon: "refrigerator",
          isActive: true,
          order: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: "microwave-services",
          name: "Microwave Services",
          slug: "microwave-services",
          description: "All microwave related services",
          icon: "microwave",
          isActive: true,
          order: 4,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          _id: "tv-services",
          name: "TV Services",
          slug: "tv-services",
          description: "All TV related services",
          icon: "tv",
          isActive: true,
          order: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      return NextResponse.json({
        success: true,
        categories: defaultCategories,
        source: "default"
      });
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

// Create a new service category
export async function POST(request: Request) {
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
    const data = await request.json();

    // Validate required fields
    if (!data.name || !data.slug) {
      return NextResponse.json(
        { success: false, message: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Check if category with same slug already exists
    const existingCategory = await db.collection("serviceCategories").findOne({ slug: data.slug });

    if (existingCategory) {
      return NextResponse.json(
        { success: false, message: "A category with this slug already exists" },
        { status: 409 }
      );
    }

    // Get the highest order value
    const highestOrderCategory = await db
      .collection("serviceCategories")
      .find({})
      .sort({ order: -1 })
      .limit(1)
      .toArray();

    const nextOrder = highestOrderCategory.length > 0 ? highestOrderCategory[0].order + 1 : 1;

    // Create new category
    const newCategory: ServiceCategory = {
      name: data.name,
      slug: data.slug,
      description: data.description || "",
      icon: data.icon || "",
      isActive: data.isActive !== undefined ? data.isActive : true,
      order: data.order !== undefined ? data.order : nextOrder,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection("serviceCategories").insertOne(newCategory);

    return NextResponse.json({
      success: true,
      message: "Service category created successfully",
      category: {
        ...newCategory,
        _id: result.insertedId,
      },
    });
  } catch (error) {
    console.error("Error creating service category:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
