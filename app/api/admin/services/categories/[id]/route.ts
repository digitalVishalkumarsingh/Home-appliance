import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Get a specific service category
export async function GET(
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
    let categoryId;
    try {
      categoryId = new ObjectId(params.id);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Invalid category ID" },
        { status: 400 }
      );
    }

    // Get the service category
    const category = await db.collection("serviceCategories").findOne({ _id: categoryId });

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

// Update a service category
export async function PUT(
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

    // Parse request body
    const updateData = await request.json();
    
    // Validate required fields
    if (!updateData.name || !updateData.slug) {
      return NextResponse.json(
        { success: false, message: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Validate ObjectId
    let categoryId;
    try {
      categoryId = new ObjectId(params.id);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Invalid category ID" },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await db.collection("serviceCategories").findOne({ _id: categoryId });
    
    if (!existingCategory) {
      return NextResponse.json(
        { success: false, message: "Service category not found" },
        { status: 404 }
      );
    }

    // Check if slug is already used by another category
    if (updateData.slug !== existingCategory.slug) {
      const duplicateSlug = await db.collection("serviceCategories").findOne({
        slug: updateData.slug,
        _id: { $ne: categoryId }
      });
      
      if (duplicateSlug) {
        return NextResponse.json(
          { success: false, message: "A category with this slug already exists" },
          { status: 409 }
        );
      }
    }

    // Update category
    const result = await db.collection("serviceCategories").updateOne(
      { _id: categoryId },
      {
        $set: {
          name: updateData.name,
          slug: updateData.slug,
          description: updateData.description || "",
          icon: updateData.icon || "",
          isActive: updateData.isActive !== undefined ? updateData.isActive : true,
          order: updateData.order !== undefined ? updateData.order : existingCategory.order,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, message: "No changes made to the category" },
        { status: 304 }
      );
    }

    // Get updated category
    const updatedCategory = await db.collection("serviceCategories").findOne({ _id: categoryId });

    return NextResponse.json({
      success: true,
      message: "Service category updated successfully",
      category: updatedCategory,
    });
  } catch (error) {
    console.error("Error updating service category:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete a service category
export async function DELETE(
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
    let categoryId;
    try {
      categoryId = new ObjectId(params.id);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Invalid category ID" },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await db.collection("serviceCategories").findOne({ _id: categoryId });
    
    if (!existingCategory) {
      return NextResponse.json(
        { success: false, message: "Service category not found" },
        { status: 404 }
      );
    }

    // Check if category has associated services
    const associatedServices = await db.collection("services").countDocuments({ categoryId: params.id });
    
    if (associatedServices > 0) {
      return NextResponse.json(
        { success: false, message: "Cannot delete category with associated services" },
        { status: 400 }
      );
    }

    // Delete category
    const result = await db.collection("serviceCategories").deleteOne({ _id: categoryId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Failed to delete service category" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Service category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting service category:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
