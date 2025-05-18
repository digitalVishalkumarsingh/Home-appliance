import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Mark admin notifications as read
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
    const { notificationIds, markAll, markImportant } = await request.json();

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    let result;

    if (markAll) {
      // Mark all notifications as read
      result = await db.collection("adminNotifications").updateMany(
        { isForAdmin: true, isRead: false },
        { $set: { isRead: true, readAt: new Date().toISOString() } }
      );
    } else if (markImportant) {
      // Mark all important notifications as read
      result = await db.collection("adminNotifications").updateMany(
        { isForAdmin: true, isRead: false, isImportant: true },
        { $set: { isRead: true, readAt: new Date().toISOString() } }
      );
    } else if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      const objectIds = notificationIds.map((id: string) => {
        try {
          return new ObjectId(id);
        } catch (error) {
          console.error(`Invalid ObjectId: ${id}`);
          return null;
        }
      }).filter(Boolean);

      if (objectIds.length === 0) {
        return NextResponse.json(
          { success: false, message: "No valid notification IDs provided" },
          { status: 400 }
        );
      }

      result = await db.collection("adminNotifications").updateMany(
        { _id: { $in: objectIds }, isForAdmin: true },
        { $set: { isRead: true, readAt: new Date().toISOString() } }
      );
    } else {
      return NextResponse.json(
        { success: false, message: "No notifications specified to mark as read" },
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
