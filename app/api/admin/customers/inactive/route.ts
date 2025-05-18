import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Get inactive customers (users who have not made any bookings)
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
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = parseInt(url.searchParams.get("skip") || "0");
    const sort = url.searchParams.get("sort") || "createdAt";
    const order = url.searchParams.get("order") || "desc";
    const searchTerm = url.searchParams.get("search") || "";

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

    // Build query to find inactive customers (users who have not made any bookings)
    let query: any = {
      role: "user",
      $nor: [
        { _id: { $in: Array.from(uniqueUserIds).map(id => {
          try {
            return new ObjectId(id);
          } catch (e) {
            // If conversion fails, return the original string
            // This ensures we don't lose any IDs that might not be valid ObjectIds
            return id;
          }
        }) } },
        { email: { $in: Array.from(uniqueEmails) } },
        { phone: { $in: Array.from(uniquePhones) } }
      ]
    };

    // Add search filter if provided
    if (searchTerm) {
      query = {
        ...query,
        $or: [
          { name: { $regex: searchTerm, $options: "i" } },
          { email: { $regex: searchTerm, $options: "i" } },
          { phone: { $regex: searchTerm, $options: "i" } }
        ]
      };
    }

    // Build sort object
    const sortObj: any = {};
    sortObj[sort] = order === "asc" ? 1 : -1;

    // Get total count for pagination
    const total = await db.collection("users").countDocuments(query);

    // Get inactive customers with pagination
    const customers = await db
      .collection("users")
      .find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .project({ password: 0 }) // Exclude password field
      .toArray();

    // Add empty stats for each customer
    const customersWithStats = customers.map(customer => ({
      ...customer,
      stats: {
        bookingCount: 0,
        completedBookingCount: 0,
        totalSpent: 0,
        lastBookingDate: null
      }
    }));

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
    console.error("Error fetching inactive customers:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
