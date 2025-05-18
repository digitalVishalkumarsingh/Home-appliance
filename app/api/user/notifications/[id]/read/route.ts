import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Check if notification exists and belongs to the user
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(notificationId);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Invalid notification ID format" },
        { status: 400 }
      );
    }

    const notification = await db.collection("notifications").findOne({
      _id: objectId,
      userId: decoded.userId,
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404 }
      );
    }

    // Mark notification as read
    await db.collection("notifications").updateOne(
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
