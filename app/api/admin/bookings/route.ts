import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";

// Get all bookings
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
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const skip = parseInt(url.searchParams.get("skip") || "0");
    const sort = url.searchParams.get("sort") || "createdAt";
    const order = url.searchParams.get("order") || "desc";

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Build query
    const query: any = {};
    if (status) {
      query.status = status;
    }

    // Build sort object
    const sortObj: any = {};
    sortObj[sort] = order === "asc" ? 1 : -1;

    // Get all bookings with pagination and filtering
    const bookings = await db
      .collection("bookings")
      .find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const total = await db.collection("bookings").countDocuments(query);

    // Get payment information for each booking
    const bookingsWithPayments = await Promise.all(
      bookings.map(async (booking) => {
        const payment = await db
          .collection("payments")
          .findOne({ bookingId: booking.bookingId || booking.id });

        return {
          id: booking._id.toString(),
          bookingId: booking.bookingId || booking.id || booking._id.toString(),
          customerName: booking.customerName || `${booking.firstName || ""} ${booking.lastName || ""}`.trim(),
          customerEmail: booking.email || booking.customerEmail,
          customerPhone: booking.phone || booking.customerPhone,
          service: booking.service || booking.serviceName,
          date: booking.date || booking.bookingDate,
          time: booking.time || booking.bookingTime,
          address: booking.address || `${booking.addressLine1 || ""}, ${booking.city || ""}, ${booking.pincode || ""}`.trim(),
          status: booking.status || "pending",
          paymentStatus: booking.paymentStatus || "pending",
          amount: booking.amount || booking.price || 0,
          createdAt: booking.createdAt || new Date(),
          updatedAt: booking.updatedAt || booking.createdAt || new Date(),
          payment: payment || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      bookings: bookingsWithPayments,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create a new booking
export async function POST(request: Request) {
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

    const bookingData = await request.json();

    // Validate booking data
    if (!bookingData.customerName || !bookingData.service || !bookingData.date) {
      return NextResponse.json(
        { success: false, message: "Missing required booking information" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Generate booking ID
    const lastBooking = await db
      .collection("bookings")
      .find({})
      .sort({ _id: -1 })
      .limit(1)
      .toArray();

    let bookingId = "BK001";

    if (lastBooking.length > 0 && lastBooking[0].id) {
      const lastId = lastBooking[0].id;
      const numericPart = parseInt(lastId.substring(2));
      bookingId = `BK${(numericPart + 1).toString().padStart(3, "0")}`;
    }

    // Create new booking
    const newBooking = {
      id: bookingId,
      customerName: bookingData.customerName,
      customerPhone: bookingData.customerPhone,
      service: bookingData.service,
      date: bookingData.date,
      time: bookingData.time,
      address: bookingData.address,
      status: bookingData.status || "pending",
      paymentStatus: bookingData.paymentStatus || "pending",
      amount: bookingData.amount || 0,
      technician: bookingData.technician,
      createdAt: new Date(),
    };

    const result = await db.collection("bookings").insertOne(newBooking);

    return NextResponse.json({
      success: true,
      message: "Booking created successfully",
      booking: {
        id: result.insertedId.toString(),
        bookingId: bookingId,
        ...newBooking
      }
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

