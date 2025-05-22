import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken } from "@/app/lib/auth-edge";
import { ObjectId } from "mongodb";

// Toggle the importance of an admin notification
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Get token from cookies or authorization header
    const cookieHeader = request.headers.get('Cookie');
    let token = request.headers.get('authorization')?.split(' ')[1];

    // If no token in authorization header, try to get from cookies
    if (!token && cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      token = cookies.token;
    }

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
