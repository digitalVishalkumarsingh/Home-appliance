import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Get admin notifications
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

    const decoded = await verifyToken(token);

    if (!decoded || (decoded as {role?: string}).role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const importantOnly = searchParams.get("importantOnly") === "true";
    const type = searchParams.get("type") || null;

    // Build query
    const query: any = { isForAdmin: true };
    if (unreadOnly) {
      query.isRead = false;
    }
    if (importantOnly) {
      query.isImportant = true;
    }
    if (type) {
      query.type = type;
    }

    // Get notifications
    const notifications = await db
      .collection("adminNotifications")
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count
    const totalCount = await db
      .collection("adminNotifications")
      .countDocuments(query);

    // Get unread count
    const unreadCount = await db
      .collection("adminNotifications")
      .countDocuments({ isForAdmin: true, isRead: false });

    // Get important unread count
    const importantUnreadCount = await db
      .collection("adminNotifications")
      .countDocuments({ isForAdmin: true, isRead: false, isImportant: true });

    return NextResponse.json({
      success: true,
      notifications,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
      unreadCount,
      importantUnreadCount,
    });
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create a new admin notification
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

    const decoded = await verifyToken(token);

    if (!decoded || (decoded as {role?: string}).role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Parse request body
    const { title, message, type, referenceId, isImportant } = await request.json();

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json(
        { success: false, message: "Title and message are required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Create notification
    const notification = {
      title,
      message,
      type: type || "general",
      referenceId,
      isForAdmin: true,
      isRead: false,
      isImportant: isImportant || false,
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection("adminNotifications").insertOne(notification);

    return NextResponse.json({
      success: true,
      message: "Admin notification created",
      notification: {
        ...notification,
        _id: result.insertedId,
      },
    });
  } catch (error) {
    console.error("Error creating admin notification:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
