import { connectToDatabase } from "./mongodb";

/**
 * Create an admin notification for a new booking
 * @param bookingData The booking data
 * @param isImportant Whether the notification is important
 * @returns Promise<boolean> Whether the notification was created successfully
 */
export async function createBookingNotification(
  bookingData: {
    bookingId?: string;
    _id?: string;
    customerName: string;
    service: string;
    date: string;
    time?: string;
    amount: number;
    status?: string;
  },
  isImportant: boolean = false
): Promise<boolean> {
  try {
    const { db } = await connectToDatabase();

    // Format date for display
    const formattedDate = new Date(bookingData.date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    // Create notification
    const notification = {
      title: "New Booking",
      message: `${bookingData.customerName} has booked ${bookingData.service} for ${formattedDate}${bookingData.time ? ' at ' + bookingData.time : ''}.`,
      type: "booking",
      referenceId: bookingData.bookingId || bookingData._id?.toString(),
      isForAdmin: true,
      isRead: false,
      isImportant: isImportant,
      createdAt: new Date().toISOString(),
    };

    await db.collection("adminNotifications").insertOne(notification);
    return true;
  } catch (error) {
    console.error("Error creating admin booking notification:", error);
    return false;
  }
}

/**
 * Create an admin notification for a payment
 * @param paymentData The payment data
 * @param isImportant Whether the notification is important
 * @returns Promise<boolean> Whether the notification was created successfully
 */
export async function createPaymentNotification(
  paymentData: {
    bookingId?: string;
    orderId?: string;
    paymentId?: string;
    amount: number;
    customerName?: string;
    service?: string;
  },
  isImportant: boolean = false
): Promise<boolean> {
  try {
    const { db } = await connectToDatabase();

    // Get booking details if available
    let bookingDetails = null;
    if (paymentData.bookingId) {
      bookingDetails = await db.collection("bookings").findOne({
        $or: [
          { _id: paymentData.bookingId },
          { bookingId: paymentData.bookingId }
        ]
      });
    }

    const customerName = paymentData.customerName || (bookingDetails ? bookingDetails.customerName : "A customer");
    const service = paymentData.service || (bookingDetails ? bookingDetails.service : "a service");

    // Create notification
    const notification = {
      title: "Payment Received",
      message: `${customerName} has made a payment of ₹${paymentData.amount.toLocaleString('en-IN')} for ${service}.`,
      type: "payment",
      referenceId: paymentData.bookingId || paymentData.orderId,
      isForAdmin: true,
      isRead: false,
      isImportant: isImportant,
      createdAt: new Date().toISOString(),
    };

    await db.collection("adminNotifications").insertOne(notification);
    return true;
  } catch (error) {
    console.error("Error creating admin payment notification:", error);
    return false;
  }
}

/**
 * Create an admin notification for a booking cancellation
 * @param bookingData The booking data
 * @param reason The cancellation reason
 * @param isImportant Whether the notification is important
 * @returns Promise<boolean> Whether the notification was created successfully
 */
export async function createCancellationNotification(
  bookingData: {
    bookingId?: string;
    _id?: string;
    customerName: string;
    service: string;
    date: string;
    time?: string;
  },
  reason: string,
  isImportant: boolean = true
): Promise<boolean> {
  try {
    const { db } = await connectToDatabase();

    // Format date for display
    const formattedDate = new Date(bookingData.date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    // Create notification
    const notification = {
      title: "Booking Cancelled",
      message: `${bookingData.customerName} has cancelled their booking for ${bookingData.service} on ${formattedDate}${bookingData.time ? ' at ' + bookingData.time : ''}. Reason: ${reason}`,
      type: "cancellation",
      referenceId: bookingData.bookingId || bookingData._id?.toString(),
      isForAdmin: true,
      isRead: false,
      isImportant: isImportant,
      createdAt: new Date().toISOString(),
    };

    await db.collection("adminNotifications").insertOne(notification);
    return true;
  } catch (error) {
    console.error("Error creating admin cancellation notification:", error);
    return false;
  }
}
