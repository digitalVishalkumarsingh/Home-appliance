import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Define interfaces
interface Discount {
  _id?: string | ObjectId;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Get all discounts
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

    // Get all discounts
    const discounts = await db
      .collection("discounts")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      discounts,
    });
  } catch (error) {
    console.error("Error fetching discounts:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create a new discount
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
    if (!data.name || !data.categoryId || !data.discountType || !data.discountValue || !data.startDate || !data.endDate) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Check if category exists
    let category;
    try {
      // Try to find by ObjectId
      category = await db.collection("serviceCategories").findOne({
        $or: [
          { _id: new ObjectId(data.categoryId) },
          { slug: data.categoryId }
        ]
      });
    } catch (error) {
      // If ObjectId conversion fails, try to find by slug
      category = await db.collection("serviceCategories").findOne({
        slug: data.categoryId
      });
    }

    if (!category) {
      // If category not found in database, create a default one based on the ID
      const categoryMap: Record<string, string> = {
        'ac-services': 'AC Services',
        'washing-machine-services': 'Washing Machine Services',
        'refrigerator-services': 'Refrigerator Services',
        'microwave-services': 'Microwave Services',
        'tv-services': 'TV Services',
        'general-services': 'General Services'
      };

      const categoryName = categoryMap[data.categoryId] || 'Other Services';

      category = {
        _id: data.categoryId,
        name: categoryName,
        slug: data.categoryId,
        description: `${categoryName} category`,
        isActive: true
      };
    }

    // Create new discount
    const newDiscount: Discount = {
      name: data.name,
      description: data.description || "",
      categoryId: category._id.toString(),
      categoryName: category.name,
      discountType: data.discountType,
      discountValue: Number(data.discountValue),
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await db.collection("discounts").insertOne(newDiscount);

    // Create notifications for all users about the new discount
    await createDiscountNotifications(db, newDiscount);

    return NextResponse.json({
      success: true,
      message: "Discount created successfully",
      discount: {
        ...newDiscount,
        _id: result.insertedId,
      },
    });
  } catch (error) {
    console.error("Error creating discount:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to create notifications for all users about a new discount
async function createDiscountNotifications(db: any, discount: Discount) {
  try {
    // Get all users
    const users = await db.collection("users").find({}).toArray();

    // Create notification for each user
    const notifications = users.map(user => ({
      userId: user._id.toString(),
      title: "New Discount Available!",
      message: `${discount.name}: Get ${discount.discountType === "percentage" ? discount.discountValue + "% off" : "₹" + discount.discountValue + " off"} on ${discount.categoryName} services.`,
      type: "discount",
      referenceId: discount._id?.toString(),
      isRead: false,
      createdAt: new Date().toISOString(),
    }));

    if (notifications.length > 0) {
      await db.collection("notifications").insertMany(notifications);
    }

    return true;
  } catch (error) {
    console.error("Error creating discount notifications:", error);
    return false;
  }
}
