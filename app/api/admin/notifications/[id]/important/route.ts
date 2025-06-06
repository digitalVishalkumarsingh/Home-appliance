import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Toggle the importance of an admin notification
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
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

    const decoded = await verifyToken(token);

    if (!decoded || (decoded as {role?: string}).role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Get params from context
    const params = await context.params;
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

    // Toggle importance
    const newImportanceStatus = !notification.isImportant;

    await db.collection("adminNotifications").updateOne(
      { _id: objectId },
      { $set: { isImportant: newImportanceStatus, updatedAt: new Date().toISOString() } }
    );

    return NextResponse.json({
      success: true,
      message: `Notification marked as ${newImportanceStatus ? 'important' : 'not important'}`,
      isImportant: newImportanceStatus
    });
  } catch (error) {
    console.error("Error toggling notification importance:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
