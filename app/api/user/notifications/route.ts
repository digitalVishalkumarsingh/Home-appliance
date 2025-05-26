import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { getUserNotifications, createSampleNotifications } from "@/app/lib/notifications";
import { ObjectId } from "mongodb";

// Get user notifications
export async function GET(request: Request) {
  try {
    console.log("Fetching user notifications...");

    // Verify user authentication
    let token;
    try {
      token = getTokenFromRequest(new NextRequest(request));
    } catch (tokenError) {
      console.error("Token extraction error:", tokenError);
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    if (!token) {
      console.log("No token provided");
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = await verifyToken(token);
    } catch (verifyError) {
      console.error("Token verification error:", verifyError);
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    if (!decoded || typeof decoded === 'string' || !decoded.userId) {
      console.log("Invalid decoded token:", decoded);
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    console.log("User authenticated:", decoded.userId);

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50); // Max 50
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1); // Min 1
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    console.log("Query params:", { limit, page, unreadOnly });

    // Use the notifications utility function
    const result = await getUserNotifications(decoded.userId, {
      limit,
      page,
      unreadOnly,
    });

    if (!result.success) {
      console.error("Error from getUserNotifications:", result.error);

      // If no notifications exist, create sample notifications for new users
      if (result.error?.includes("collection") || result.notifications.length === 0) {
        console.log("Creating sample notifications for new user");
        try {
          await createSampleNotifications(decoded.userId);

          // Try again after creating sample notifications
          const retryResult = await getUserNotifications(decoded.userId, {
            limit,
            page,
            unreadOnly,
          });

          if (retryResult.success) {
            return NextResponse.json(retryResult);
          }
        } catch (sampleError) {
          console.error("Failed to create sample notifications:", sampleError);
        }
      }

      // If still failing, use fallback notifications
      console.log("Using fallback notifications due to persistent errors");
      try {
        const fallbackResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notifications/fallback?limit=${limit}&unreadOnly=${unreadOnly}`);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          return NextResponse.json({
            ...fallbackData,
            userId: decoded.userId,
            fallbackReason: "Database issues, using demo data"
          });
        }
      } catch (fallbackError) {
        console.error("Fallback notifications also failed:", fallbackError);
      }

      // Final fallback - return empty result
      return NextResponse.json({
        success: true,
        notifications: [],
        pagination: { total: 0, page: 1, limit: 10, pages: 0 },
        unreadCount: 0,
        fallback: true,
        message: "No notifications available"
      });
    }

    console.log("Successfully fetched notifications:", result.notifications.length);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Unexpected error fetching notifications:", error);

    // Return a safe fallback response instead of 500 error
    return NextResponse.json({
      success: true,
      notifications: [],
      pagination: { total: 0, page: 1, limit: 10, pages: 0 },
      unreadCount: 0,
      error: "Failed to fetch notifications, showing empty state",
      debug: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

// Mark notifications as read
export async function PUT(request: Request) {
  try {
    // Verify user authentication
    const token = getTokenFromRequest(new NextRequest(request));

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);

    if (!decoded || typeof decoded === 'string' || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // Parse request body
    const { notificationIds, markAll } = await request.json();

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

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
    const token = getTokenFromRequest(new NextRequest(request));

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);

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
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

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

