import { NextResponse } from "next/server";

// Fallback notifications endpoint that doesn't require authentication
// This is useful for testing and when the main notifications API fails
export async function GET(request: Request) {
  try {
    console.log("Fallback notifications endpoint called");
    
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "5"), 10);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    // Generate sample notifications
    const sampleNotifications = [
      {
        _id: "fallback-1",
        userId: "fallback-user",
        title: "Welcome to Dizit Solutions!",
        message: "Thank you for choosing our 24/7 appliance repair services. We're here to help anytime you need us.",
        type: "info",
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      },
      {
        _id: "fallback-2",
        userId: "fallback-user",
        title: "24/7 Service Available",
        message: "Our technicians are available round the clock, 7 days a week for all your appliance repair needs.",
        type: "general",
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      },
      {
        _id: "fallback-3",
        userId: "fallback-user",
        title: "Service Reminder",
        message: "Regular maintenance helps keep your appliances running efficiently. Schedule your next service today.",
        type: "info",
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      },
      {
        _id: "fallback-4",
        userId: "fallback-user",
        title: "New Service Areas",
        message: "We've expanded our service coverage! Check if your area is now included in our 24/7 service zone.",
        type: "general",
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
      },
      {
        _id: "fallback-5",
        userId: "fallback-user",
        title: "Customer Satisfaction",
        message: "Thank you for your feedback! Your 5-star rating helps us continue providing excellent service.",
        type: "success",
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
      },
    ];

    // Filter notifications based on unreadOnly parameter
    let filteredNotifications = sampleNotifications;
    if (unreadOnly) {
      filteredNotifications = sampleNotifications.filter(n => !n.isRead);
    }

    // Limit the results
    const limitedNotifications = filteredNotifications.slice(0, limit);

    // Calculate counts
    const totalCount = filteredNotifications.length;
    const unreadCount = sampleNotifications.filter(n => !n.isRead).length;

    console.log(`Returning ${limitedNotifications.length} fallback notifications`);

    return NextResponse.json({
      success: true,
      notifications: limitedNotifications,
      pagination: {
        total: totalCount,
        page: 1,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
      unreadCount,
      fallback: true,
      message: "Using fallback notifications (demo data)"
    });
  } catch (error) {
    console.error("Error in fallback notifications endpoint:", error);
    
    // Even the fallback should have a fallback!
    return NextResponse.json({
      success: true,
      notifications: [],
      pagination: { total: 0, page: 1, limit: 5, pages: 0 },
      unreadCount: 0,
      fallback: true,
      error: "Fallback notifications failed, returning empty state"
    });
  }
}

// POST endpoint to simulate marking notifications as read
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { notificationId, markAllAsRead } = body;

    console.log("Fallback notification action:", { notificationId, markAllAsRead });

    return NextResponse.json({
      success: true,
      message: markAllAsRead 
        ? "All notifications marked as read (demo)" 
        : `Notification ${notificationId} marked as read (demo)`,
      fallback: true
    });
  } catch (error) {
    console.error("Error in fallback notification action:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to process notification action",
      fallback: true
    });
  }
}
