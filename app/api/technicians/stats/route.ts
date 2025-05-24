import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest, AuthError, JwtPayload } from "@/app/lib/auth";
import { ObjectId } from "mongodb";
import { logger } from "@/app/config/logger";

// GET handler to fetch technician dashboard stats
export async function GET(request: NextRequest) {
  try {
    // Extract and verify token
    let token: string;
    try {
      token = getTokenFromRequest(request);
    } catch (error) {
      logger.warn("Failed to extract token", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    let decoded: JwtPayload;
    try {
      decoded = await verifyToken(token);
    } catch (error) {
      logger.error("Token verification failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        code: error instanceof AuthError ? error.code : "UNKNOWN",
      });
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const { userId, role } = decoded;
    if (!userId || role !== "technician") {
      logger.warn("Unauthorized access or invalid token", { userId, role });
      return NextResponse.json(
        { success: false, message: "Unauthorized: Technician role required" },
        { status: 403 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const timeRange = url.searchParams.get("timeRange")?.toLowerCase() || "month";
    if (!["week", "month", "year"].includes(timeRange)) {
      logger.warn("Invalid timeRange parameter", { userId, timeRange });
      return NextResponse.json(
        { success: false, message: "Invalid time range. Must be 'week', 'month', or 'year'" },
        { status: 400 }
      );
    }

    // Calculate date ranges
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date;
    let previousEndDate: Date;

    switch (timeRange) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        previousEndDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
        previousEndDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case "year":
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        previousStartDate = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
        previousEndDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
        previousEndDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Find technician by userId
    const technician = await db.collection("technicians").findOne({ userId });
    if (!technician) {
      logger.warn("Technician not found", { userId });
      return NextResponse.json(
        { success: false, message: "Technician not found" },
        { status: 404 }
      );
    }

    const technicianId = technician._id.toString();

    // Aggregate bookings for current and previous periods
    const bookingsAggregation = await db.collection("bookings").aggregate([
      {
        $match: {
          technicianId,
          createdAt: { $lte: now },
        },
      },
      {
        $facet: {
          currentPeriod: [
            { $match: { createdAt: { $gte: startDate } } },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                pending: {
                  $sum: {
                    $cond: [{ $in: ["$status", ["pending", "confirmed", "assigned"]] }, 1, 0],
                  },
                },
                earnings: {
                  $sum: {
                    $cond: [
                      { $eq: ["$status", "completed"] },
                      { $ifNull: ["$finalAmount", { $ifNull: ["$amount", 0] }] },
                      0,
                    ],
                  },
                },
              },
            },
          ],
          previousPeriod: [
            {
              $match: {
                createdAt: { $gte: previousStartDate, $lte: previousEndDate },
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                earnings: {
                  $sum: {
                    $cond: [
                      { $eq: ["$status", "completed"] },
                      { $ifNull: ["$finalAmount", { $ifNull: ["$amount", 0] }] },
                      0,
                    ],
                  },
                },
              },
            },
          ],
          allBookings: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                pending: {
                  $sum: {
                    $cond: [{ $in: ["$status", ["pending", "confirmed", "assigned"]] }, 1, 0],
                  },
                },
                earnings: {
                  $sum: {
                    $cond: [
                      { $eq: ["$status", "completed"] },
                      { $ifNull: ["$finalAmount", { $ifNull: ["$amount", 0] }] },
                      0,
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    ]).toArray();

    const bookingsData = bookingsAggregation[0];
    const currentPeriod = bookingsData.currentPeriod[0] || { total: 0, completed: 0, pending: 0, earnings: 0 };
    const previousPeriod = bookingsData.previousPeriod[0] || { total: 0, earnings: 0 };
    const allBookingsData = bookingsData.allBookings[0] || { total: 0, completed: 0, pending: 0, earnings: 0 };

    // Get payouts
    const payouts = await db.collection("payouts").find({ technicianId }).sort({ createdAt: -1 }).limit(1).toArray();
    const lastPayout = payouts[0] || null;

    // Calculate pending earnings
    const paidBookingIds = lastPayout?.bookingIds || [];
    const unpaidBookings = await db.collection("bookings").find({
      technicianId,
      status: "completed",
      _id: { $nin: paidBookingIds.map((id: string) => (ObjectId.isValid(id) ? new ObjectId(id) : id)) },
    }).toArray();

    const pendingEarnings = unpaidBookings.reduce(
      (sum, booking) => sum + (booking.finalAmount || booking.amount || 0),
      0
    );

    // Calculate percentage changes
    const bookingsChange =
      previousPeriod.total === 0
        ? currentPeriod.total > 0
          ? 100
          : 0
        : Number(
            (((currentPeriod.total - previousPeriod.total) / previousPeriod.total) * 100).toFixed(2)
          );

    const earningsChange =
      previousPeriod.earnings === 0
        ? currentPeriod.earnings > 0
          ? 100
          : 0
        : Number(
            (((currentPeriod.earnings - previousPeriod.earnings) / previousPeriod.earnings) * 100).toFixed(2)
          );

    logger.debug("Technician dashboard stats retrieved", {
      userId,
      technicianId,
      timeRange,
      totalBookings: allBookingsData.total,
      completedBookings: allBookingsData.completed,
      pendingBookings: allBookingsData.pending,
    });

    return NextResponse.json({
      success: true,
      totalBookings: allBookingsData.total,
      completedBookings: allBookingsData.completed,
      pendingBookings: allBookingsData.pending,
      totalEarnings: allBookingsData.earnings,
      pendingEarnings,
      lastPayoutDate: lastPayout ? lastPayout.createdAt.toISOString() : null,
      lastPayoutAmount: lastPayout ? lastPayout.amount : 0,
      rating: technician.averageRating || 0, // Use averageRating from ratings API
      bookingsChange,
      earningsChange,
      timeRange,
    });
  } catch (error) {
    logger.error("Error fetching technician stats", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    const message =
      error instanceof Error &&
      error.name === "MongoServerError" &&
      typeof (error as any).code === "number" &&
      (error as any).code === 11000
        ? "Database error: Duplicate key"
        : error instanceof Error && error.name === "MongoTimeoutError"
        ? "Database connection timed out"
        : "Failed to fetch technician stats";
    return NextResponse.json(
      { success: false, message },
      { status: error instanceof Error && error.name === "MongoTimeoutError" ? 504 : 500 }
    );
  }
}