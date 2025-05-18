import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Get user notifications
export async function GET(request: Request) {
  try {
    // Verify user authentication
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded || typeof decoded === 'string' || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
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

    // Build query
    const query: any = { userId: decoded.userId };
    if (unreadOnly) {
      query.isRead = false;
    }

    // Get notifications
    const notifications = await db
      .collection("notifications")
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count
    const totalCount = await db
      .collection("notifications")
      .countDocuments(query);

    // Get unread count
    const unreadCount = await db
      .collection("notifications")
      .countDocuments({ userId: decoded.userId, isRead: false });

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
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Mark notifications as read
export async function PUT(request: Request) {
  try {
    // Verify user authentication
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded || typeof decoded === 'string' || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // Parse request body
    const { notificationIds, markAll } = await request.json();

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    let result;

    if (markAll) {
      // Mark all notifications as read
      result = await db.collection("notifications").updateMany(
        { userId: decoded.userId, isRead: false },
        { $set: { isRead: true, updatedAt: new Date().toISOString() } }
      );
    } else if (notificationIds && notificationIds.length > 0) {
      // Convert string IDs to ObjectIds
      const objectIds = notificationIds.map((id: string) => {
        try {
          return new ObjectId(id);
        } catch (error) {
          return null;
        }
      }).filter(Boolean);

      // Mark specific notifications as read
      result = await db.collection("notifications").updateMany(
        { 
          _id: { $in: objectIds },
          userId: decoded.userId 
        },
        { $set: { isRead: true, updatedAt: new Date().toISOString() } }
      );
    } else {
      return NextResponse.json(
        { success: false, message: "No notifications specified" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create a notification (for testing purposes)
export async function POST(request: Request) {
  try {
    // Verify user authentication
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded || typeof decoded === 'string' || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // Parse request body
    const { title, message, type, referenceId } = await request.json();

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
      userId: decoded.userId,
      title,
      message,
      type: type || "general",
      referenceId,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection("notifications").insertOne(notification);

    return NextResponse.json({
      success: true,
      message: "Notification created",
      notification: {
        ...notification,
        _id: result.insertedId,
      },
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

