import { connectToDatabase } from "./mongodb";

export interface Notification {
  _id?: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "booking" | "payment" | "general";
  isRead: boolean;
  referenceId?: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export async function createNotification(notification: Omit<Notification, "_id" | "createdAt" | "updatedAt">) {
  try {
    const { db } = await connectToDatabase();

    const newNotification = {
      ...notification,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("notifications").insertOne(newNotification);

    return {
      success: true,
      notification: {
        ...newNotification,
        _id: result.insertedId.toString(),
      },
    };
  } catch (error) {
    console.error("Error creating notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getUserNotifications(
  userId: string,
  options: {
    limit?: number;
    page?: number;
    unreadOnly?: boolean;
  } = {}
) {
  try {
    const { db } = await connectToDatabase();

    const { limit = 10, page = 1, unreadOnly = false } = options;
    const skip = (page - 1) * limit;

    // Build query
    const query: { userId: string; isRead?: boolean } = { userId };
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

    // Get counts
    const totalCount = await db.collection("notifications").countDocuments(query);
    const unreadCount = await db.collection("notifications").countDocuments({
      userId,
      isRead: false
    });

    return {
      success: true,
      notifications: notifications.map(n => ({
        ...n,
        _id: n._id.toString(),
        createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt,
        updatedAt: n.updatedAt instanceof Date ? n.updatedAt?.toISOString() : n.updatedAt,
      })),
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
      unreadCount,
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      notifications: [],
      pagination: { total: 0, page: 1, limit: 10, pages: 0 },
      unreadCount: 0,
    };
  }
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    const { db } = await connectToDatabase();

    const result = await db.collection("notifications").updateOne(
      { _id: notificationId, userId },
      {
        $set: {
          isRead: true,
          updatedAt: new Date()
        }
      }
    );

    return {
      success: result.modifiedCount > 0,
      modifiedCount: result.modifiedCount,
    };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    const { db } = await connectToDatabase();

    const result = await db.collection("notifications").updateMany(
      { userId, isRead: false },
      {
        $set: {
          isRead: true,
          updatedAt: new Date()
        }
      }
    );

    return {
      success: true,
      modifiedCount: result.modifiedCount,
    };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Create sample notifications for testing
export async function createSampleNotifications(userId: string) {
  const sampleNotifications = [
    {
      userId,
      title: "Welcome to Dizit!",
      message: "Thank you for joining our appliance service platform. We're here to help with all your appliance needs.",
      type: "info" as const,
      isRead: false,
    },
    {
      userId,
      title: "Booking Confirmed",
      message: "Your appliance service booking has been confirmed. A technician will contact you soon.",
      type: "booking" as const,
      isRead: false,
    },
    {
      userId,
      title: "Service Completed",
      message: "Your appliance service has been completed successfully. Please rate your experience.",
      type: "success" as const,
      isRead: true,
    },
  ];

  const results = [];
  for (const notification of sampleNotifications) {
    const result = await createNotification(notification);
    results.push(result);
  }

  return results;
}
