import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";

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

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get current date and date 30 days ago
    const currentDate = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(currentDate.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(currentDate.getDate() - 60);

    // Get total bookings
    const totalBookings = await db.collection("bookings").countDocuments();

    // Get pending bookings
    const pendingBookings = await db
      .collection("bookings")
      .countDocuments({ status: "pending" });

    // Get completed bookings
    const completedBookings = await db
      .collection("bookings")
      .countDocuments({ status: "completed" });

    // Get total customers
    const totalCustomers = await db.collection("users").countDocuments({ role: "user" });

    // Get total revenue
    const bookings = await db
      .collection("bookings")
      .find({ status: "completed", paymentStatus: "paid" })
      .toArray();

    const totalRevenue = bookings.reduce(
      (sum: any, booking: { amount: any; }) => sum + (booking.amount || 0),
      0
    );

    // Get bookings from last 30 days
    const recentBookings = await db
      .collection("bookings")
      .find({
        createdAt: { $gte: thirtyDaysAgo, $lte: currentDate },
      })
      .toArray();

    // Get bookings from 30-60 days ago
    const previousBookings = await db
      .collection("bookings")
      .find({
        createdAt: { $gte: sixtyDaysAgo, $lte: thirtyDaysAgo },
      })
      .toArray();

    // Calculate revenue from last 30 days
    const recentRevenue = recentBookings
      .filter(
        (booking: { status: string; paymentStatus: string; }) => booking.status === "completed" && booking.paymentStatus === "paid"
      )
      .reduce((sum: any, booking: { amount: any; }) => sum + (booking.amount || 0), 0);

    // Calculate revenue from 30-60 days ago
    const previousRevenue = previousBookings
      .filter(
        (booking: { status: string; paymentStatus: string; }) => booking.status === "completed" && booking.paymentStatus === "paid"
      )
      .reduce((sum: any, booking: { amount: any; }) => sum + (booking.amount || 0), 0);

    // Calculate percentage changes
    const revenueChange =
      previousRevenue === 0
        ? 100
        : ((recentRevenue - previousRevenue) / previousRevenue) * 100;

    const bookingsChange =
      previousBookings.length === 0
        ? 100
        : ((recentBookings.length - previousBookings.length) /
            previousBookings.length) *
          100;

    // Get users from last 30 days
    const recentUsers = await db
      .collection("users")
      .find({
        createdAt: { $gte: thirtyDaysAgo, $lte: currentDate },
        role: "user",
      })
      .toArray();

    // Get users from 30-60 days ago
    const previousUsers = await db
      .collection("users")
      .find({
        createdAt: { $gte: sixtyDaysAgo, $lte: thirtyDaysAgo },
        role: "user",
      })
      .toArray();

    // Calculate percentage change in users
    const customersChange =
      previousUsers.length === 0
        ? 100
        : ((recentUsers.length - previousUsers.length) / previousUsers.length) *
          100;

    return NextResponse.json({
      success: true,
      totalBookings,
      pendingBookings,
      completedBookings,
      totalCustomers,
      totalRevenue,
      revenueChange: parseFloat(revenueChange.toFixed(1)),
      bookingsChange: parseFloat(bookingsChange.toFixed(1)),
      customersChange: parseFloat(customersChange.toFixed(1)),
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

