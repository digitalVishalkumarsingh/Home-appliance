import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Mark notifications as read
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

    if (!decoded || typeof decoded !== "object" || !("userId" in decoded)) {
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
      const objectIds = notificationIds
        .map((id: string) => {
          try {
            return new ObjectId(id);
          } catch (error) {
            return null;
          }
        })
        .filter(Boolean);

      // Mark specific notifications as read
      result = await db.collection("notifications").updateMany(
        {
          _id: { $in: objectIds },
          userId: decoded.userId,
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
