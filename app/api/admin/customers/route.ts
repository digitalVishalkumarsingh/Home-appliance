import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";

// Get all customers (users with role "user")
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

    const decoded = verifyToken(token);

    if (!decoded || (decoded as {role?: string}).role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const skip = parseInt(url.searchParams.get("skip") || "0");
    const sort = url.searchParams.get("sort") || "createdAt";
    const order = url.searchParams.get("order") || "desc";
    const search = url.searchParams.get("search") || "";

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Build query
    const query: any = { role: "user" };
    
    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    // Build sort object
    const sortObj: any = {};
    sortObj[sort] = order === "asc" ? 1 : -1;

    // Get total count for pagination
    const total = await db.collection("users").countDocuments(query);

    // Get all customers with pagination and filtering
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
        const bookings = await db.collection("bookings").find({
          $or: [
            { userId: customer._id.toString() },
            { customerEmail: customer.email },
            { customerPhone: customer.phone }
          ],
          status: "completed"
        }).toArray();

        const totalSpent = bookings.reduce((sum, booking) => sum + (booking.amount || 0), 0);

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
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
