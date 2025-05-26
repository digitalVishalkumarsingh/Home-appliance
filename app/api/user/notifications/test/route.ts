import { NextResponse, NextRequest } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { createSampleNotifications, createNotification } from "@/app/lib/notifications";

// Create test notifications for the current user
export async function POST(request: Request) {
  try {
    console.log("Creating test notifications...");
    
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
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    console.log("Creating test notifications for user:", decoded.userId);

    // Parse request body to see if specific notification is requested
    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    if (body.type === "sample") {
      // Create sample notifications
      const results = await createSampleNotifications(decoded.userId);
      return NextResponse.json({
        success: true,
        message: "Sample notifications created",
        results,
      });
    } else if (body.title && body.message) {
      // Create custom notification
      const result = await createNotification({
        userId: decoded.userId,
        title: body.title,
        message: body.message,
        type: body.type || "info",
        isRead: false,
        referenceId: body.referenceId,
      });
      
      return NextResponse.json({
        success: true,
        message: "Custom notification created",
        result,
      });
    } else {
      // Create a simple test notification
      const result = await createNotification({
        userId: decoded.userId,
        title: "Test Notification",
        message: `Test notification created at ${new Date().toLocaleString()}`,
        type: "info",
        isRead: false,
      });
      
      return NextResponse.json({
        success: true,
        message: "Test notification created",
        result,
      });
    }
  } catch (error) {
    console.error("Error creating test notifications:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create test notifications",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Get endpoint for testing
export async function GET(request: Request) {
  return NextResponse.json({
    success: true,
    message: "Notifications test endpoint",
    usage: {
      "POST with no body": "Creates a simple test notification",
      "POST with {type: 'sample'}": "Creates sample notifications",
      "POST with {title, message, type?, referenceId?}": "Creates custom notification"
    }
  });
}
