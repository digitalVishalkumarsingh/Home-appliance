import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Mark a specific admin notification as read
export async function PATCH(
  request: Request,
  context: { params: { id: string } }
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

    // Get params from context
    const params = context.params;
    const notificationId = params.id;

    // Validate notification ID
    if (!notificationId) {
      return NextResponse.json(
        { success: false, message: "Notification ID is required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Check if notification exists
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(notificationId);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Invalid notification ID format" },
        { status: 400 }
      );
    }

    const notification = await db.collection("adminNotifications").findOne({
      _id: objectId,
      isForAdmin: true
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404 }
      );
    }

    // Mark notification as read
    await db.collection("adminNotifications").updateOne(
      { _id: objectId },
      { $set: { isRead: true, readAt: new Date().toISOString() } }
    );

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
