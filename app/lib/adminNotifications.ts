
import { connectToDatabase } from "./mongodb";
import { ObjectId } from "mongodb";
import { logger } from "../config/logger";

interface BookingData {
  bookingId?: string;
  _id?: string;
  customerName: string;
  service: string;
  date: string;
  time?: string;
  amount?: number;
  status?: string;
}

interface PaymentData {
  bookingId?: string;
  orderId?: string;
  paymentId?: string;
  amount: number;
  customerName?: string;
  service?: string;
}

interface AdminNotification {
  _id?: string;
  title: string;
  message: string;
  type: "booking" | "payment" | "cancellation" | "general";
  referenceId?: string;
  isForAdmin: boolean;
  isRead: boolean;
  isImportant: boolean;
  createdAt: string;
}

type NotificationErrorType = "network" | "validation" | "database";
class NotificationError extends Error {
  type: NotificationErrorType;
  constructor(message: string, type: NotificationErrorType) {
    super(message);
    this.type = type;
  }
}

// Input validation
function validateBookingData(data: BookingData): void {
  if (!data.customerName || typeof data.customerName !== "string") {
    throw new NotificationError("Invalid customerName", "validation");
  }
  if (!data.service || typeof data.service !== "string") {
    throw new NotificationError("Invalid service", "validation");
  }
  if (!data.date || isNaN(new Date(data.date).getTime())) {
    throw new NotificationError("Invalid date", "validation");
  }
}

function validatePaymentData(data: PaymentData): void {
  if (!data.amount || typeof data.amount !== "number" || data.amount <= 0) {
    throw new NotificationError("Invalid amount", "validation");
  }
}

function validateCancellationData(data: Omit<BookingData, "amount" | "status">, reason: string): void {
  validateBookingData(data as BookingData);
  if (!reason || typeof reason !== "string") {
    throw new NotificationError("Invalid cancellation reason", "validation");
  }
}

function createObjectIdQuery(id: string): any {
  if (!id || typeof id !== "string") {
    throw new NotificationError("Invalid ID", "validation");
  }
  const query: any = { $or: [{ bookingId: id }] };
  if (ObjectId.isValid(id)) {
    query.$or.push({ _id: new ObjectId(id) });
  }
  return query;
}

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  retryDelay: (attempt: number) => number = (attempt) => 1000 * attempt
): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay(attempt + 1)));
        logger.warn("Retrying operation", { attempt: attempt + 1, error });
      }
    }
  }
  throw new NotificationError(
    lastError.message || "Operation failed after retries",
    lastError.name === "MongoServerError" ? "database" : "network"
  );
}

export async function createBookingNotification(
  bookingData: BookingData,
  isImportant: boolean = false
): Promise<void> {
  try {
    validateBookingData(bookingData);
    const { db } = await connectToDatabase({ timeoutMs: 10000 });
    const formattedDate = new Date(bookingData.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const notification: AdminNotification = {
      title: "New Booking",
      message: `${bookingData.customerName} has booked ${bookingData.service} for ${formattedDate}${bookingData.time ? " at " + bookingData.time : ""}.`,
      type: "booking",
      referenceId: bookingData.bookingId || bookingData._id,
      isForAdmin: true,
      isRead: false,
      isImportant,
      createdAt: new Date().toISOString(),
    };

    const { _id, ...notificationWithoutId } = notification;
    await withRetry(() =>
      db.collection("adminNotifications").insertOne(notificationWithoutId)
    );
    logger.info("Booking notification created", { bookingId: notification.referenceId });
  } catch (error) {
    logger.error("Error creating booking notification", { error });
    throw new NotificationError(
      error instanceof Error ? error.message : "Failed to create booking notification",
      error instanceof NotificationError ? error.type : "database"
    );
  }
}

export async function createPaymentNotification(
  paymentData: PaymentData,
  isImportant: boolean = false
): Promise<void> {
  try {
    validatePaymentData(paymentData);
    const { db } = await connectToDatabase({ timeoutMs: 10000 });
    let bookingDetails: BookingData | null = null;
    if (paymentData.bookingId) {
      const query = createObjectIdQuery(paymentData.bookingId);
      const bookingDoc = await withRetry(() =>
        db.collection("bookings").findOne(query)
      );
      if (
        bookingDoc &&
        typeof bookingDoc.customerName === "string" &&
        typeof bookingDoc.service === "string" &&
        typeof bookingDoc.date === "string"
      ) {
        bookingDetails = bookingDoc as unknown as BookingData;
      } else {
        bookingDetails = null;
      }
    }

    const customerName = paymentData.customerName || (bookingDetails ? bookingDetails.customerName : "A customer");
    const service = paymentData.service || (bookingDetails ? bookingDetails.service : "a service");

    const notification: AdminNotification = {
      title: "Payment Received",
      message: `${customerName} has made a payment of ₹${paymentData.amount.toLocaleString("en-IN")} for ${service}.`,
      type: "payment",
      referenceId: paymentData.bookingId || paymentData.orderId,
      isForAdmin: true,
      isRead: false,
      isImportant,
      createdAt: new Date().toISOString(),
    };

    const { _id, ...notificationWithoutId } = notification;
    await withRetry(() =>
      db.collection("adminNotifications").insertOne(notificationWithoutId)
    );
    logger.info("Payment notification created", { referenceId: notification.referenceId });
  } catch (error) {
    logger.error("Error creating payment notification", { error });
    throw new NotificationError(
      error instanceof Error ? error.message : "Failed to create payment notification",
      error instanceof NotificationError ? error.type : "database"
    );
  }
}

export async function createCancellationNotification(
  bookingData: Omit<BookingData, "amount" | "status">,
  reason: string,
  isImportant: boolean = true
): Promise<void> {
  try {
    validateCancellationData(bookingData, reason);
    const { db } = await connectToDatabase({ timeoutMs: 10000 });
    const formattedDate = new Date(bookingData.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const notification: AdminNotification = {
      title: "Booking Cancelled",
      message: `${bookingData.customerName} has cancelled their booking for ${bookingData.service} on ${formattedDate}${bookingData.time ? " at " + bookingData.time : ""}. Reason: ${reason}`,
      type: "cancellation",
      referenceId: bookingData.bookingId || bookingData._id,
      isForAdmin: true,
      isRead: false,
      isImportant,
      createdAt: new Date().toISOString(),
    };

    const { _id, ...notificationWithoutId } = notification;
    await withRetry(() =>
      db.collection("adminNotifications").insertOne(notificationWithoutId)
    );
    logger.info("Cancellation notification created", { referenceId: notification.referenceId });
  } catch (error) {
    logger.error("Error creating cancellation notification", { error });
    throw new NotificationError(
      error instanceof Error ? error.message : "Failed to create cancellation notification",
      error instanceof NotificationError ? error.type : "database"
    );
  }
}

export async function getAdminNotifications(
  limit: number = 50,
  skip: number = 0,
  onlyUnread: boolean = false
): Promise<AdminNotification[]> {
  try {
    if (limit < 1 || skip < 0) {
      throw new NotificationError("Invalid pagination parameters", "validation");
    }
    const { db } = await connectToDatabase({ timeoutMs: 10000 });
    const filter: any = { isForAdmin: true };
    if (onlyUnread) {
      filter.isRead = false;
    }

    const notifications = await withRetry(() =>
      db
        .collection("adminNotifications")
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray()
    );

    const result = notifications.map((notification) => ({
      ...notification,
      _id: notification._id.toString(),
      referenceId: notification.referenceId?.toString(),
    })) as AdminNotification[];
    logger.info("Fetched admin notifications", { count: result.length, onlyUnread });
    return result;
  } catch (error) {
    logger.error("Error fetching admin notifications", { error });
    throw new NotificationError(
      error instanceof Error ? error.message : "Failed to fetch notifications",
      error instanceof NotificationError ? error.type : "database"
    );
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    if (!notificationId || typeof notificationId !== "string") {
      throw new NotificationError("Invalid notification ID", "validation");
    }
    const { db } = await connectToDatabase({ timeoutMs: 10000 });
    const filter = ObjectId.isValid(notificationId)
      ? { _id: new ObjectId(notificationId) }
      : { _id: new ObjectId() }; // fallback to an invalid ObjectId to ensure type safety

    const result = await withRetry(() =>
      db
        .collection("adminNotifications")
        .updateOne(filter, { $set: { isRead: true } })
    );

    if (result.modifiedCount === 0) {
      throw new NotificationError("Notification not found or already read", "database");
    }
    logger.info("Notification marked as read", { notificationId });
  } catch (error) {
    logger.error("Error marking notification as read", { error });
    throw new NotificationError(
      error instanceof Error ? error.message : "Failed to mark notification as read",
      error instanceof NotificationError ? error.type : "database"
    );
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  try {
    const { db } = await connectToDatabase({ timeoutMs: 10000 });
    const result = await withRetry(() =>
      db
        .collection("adminNotifications")
        .updateMany(
          { isForAdmin: true, isRead: false },
          { $set: { isRead: true } }
        )
    );

    if (result.modifiedCount === 0) {
      logger.info("No unread notifications to mark as read");
    } else {
      logger.info("Marked all notifications as read", { modifiedCount: result.modifiedCount });
    }
  } catch (error) {
    logger.error("Error marking all notifications as read", { error });
    throw new NotificationError(
      error instanceof Error ? error.message : "Failed to mark all notifications as read",
      error instanceof NotificationError ? error.type : "database"
    );
  }
}

export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const { db } = await connectToDatabase({ timeoutMs: 10000 });
    const count = await withRetry(() =>
      db
        .collection("adminNotifications")
        .countDocuments({ isForAdmin: true, isRead: false })
    );
    logger.info("Fetched unread notification count", { count });
    return count;
  } catch (error) {
    logger.error("Error getting unread notification count", { error });
    throw new NotificationError(
      error instanceof Error ? error.message : "Failed to get unread notification count",
      error instanceof NotificationError ? error.type : "database"
    );
  }
}

export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    if (!notificationId || typeof notificationId !== "string") {
      throw new NotificationError("Invalid notification ID", "validation");
    }
    const { db } = await connectToDatabase({ timeoutMs: 10000 });
    if (!ObjectId.isValid(notificationId)) {
      throw new NotificationError("Invalid notification ID format", "validation");
    }
    const filter = { _id: new ObjectId(notificationId) };

    const result = await withRetry(() =>
      db.collection("adminNotifications").deleteOne(filter)
    );

    if (result.deletedCount === 0) {
      throw new NotificationError("Notification not found", "database");
    }
    logger.info("Notification deleted", { notificationId });
  } catch (error) {
    logger.error("Error deleting notification", { error });
    throw new NotificationError(
      error instanceof Error ? error.message : "Failed to delete notification",
      error instanceof NotificationError ? error.type : "database"
    );
  }
}
