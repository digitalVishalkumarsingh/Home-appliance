import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Get active customers (users who have made bookings)
export async function GET(request: Request) {
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

    // Parse query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = parseInt(url.searchParams.get("skip") || "0");
    const sort = url.searchParams.get("sort") || "createdAt";
    const order = url.searchParams.get("order") || "desc";

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get all bookings to find unique customer IDs, emails, and phones
    const bookings = await db.collection("bookings").find({}).toArray();

    // Extract unique customer identifiers
    const uniqueUserIds = new Set<string>();
    const uniqueEmails = new Set<string>();
    const uniquePhones = new Set<string>();

    bookings.forEach(booking => {
      if (booking.userId) uniqueUserIds.add(booking.userId);
      if (booking.customerEmail) uniqueEmails.add(booking.customerEmail);
      if (booking.customerPhone) uniquePhones.add(booking.customerPhone);
      if (booking.email) uniqueEmails.add(booking.email);
      if (booking.phone) uniquePhones.add(booking.phone);
    });

    // Build query to find active customers
    const query: any = {
      role: "user",
      $or: [
        { _id: { $in: Array.from(uniqueUserIds).map(id => {
          try {
            return new ObjectId(id);
          } catch (e) {
            return id;
          }
        }) } },
        { email: { $in: Array.from(uniqueEmails) } },
        { phone: { $in: Array.from(uniquePhones) } }
      ]
    };

    // Build sort object
    const sortObj: any = {};
    sortObj[sort] = order === "asc" ? 1 : -1;

    // Get total count for pagination
    const total = await db.collection("users").countDocuments(query);

    // Get active customers with pagination
    const customers = await db
      .collection("users")
      .find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .project({ password: 0 }) // Exclude password field
      .toArray();

    // Get booking counts for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        // Count total bookings
        const bookingCount = await db.collection("bookings").countDocuments({
          $or: [
            { userId: customer._id.toString() },
            { customerEmail: customer.email },
            { customerPhone: customer.phone }
          ]
        });

        // Count completed bookings
        const completedBookingCount = await db.collection("bookings").countDocuments({
          $or: [
            { userId: customer._id.toString() },
            { customerEmail: customer.email },
            { customerPhone: customer.phone }
          ],
          status: "completed"
        });

        // Calculate total spent
        const customerBookings = await db.collection("bookings").find({
          $or: [
            { userId: customer._id.toString() },
            { customerEmail: customer.email },
            { customerPhone: customer.phone }
          ],
          status: "completed"
        }).toArray();

        const totalSpent = customerBookings.reduce((sum, booking) => sum + (booking.amount || 0), 0);

        // Get last booking date
        const lastBooking = await db.collection("bookings").find({
          $or: [
            { userId: customer._id.toString() },
            { customerEmail: customer.email },
            { customerPhone: customer.phone }
          ]
        }).sort({ createdAt: -1 }).limit(1).toArray();

        return {
          ...customer,
          stats: {
            bookingCount,
            completedBookingCount,
            totalSpent,
            lastBookingDate: lastBooking.length > 0 ? lastBooking[0].createdAt : null
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      customers: customersWithStats,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching active customers:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
