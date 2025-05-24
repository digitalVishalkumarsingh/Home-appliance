import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest, AuthError, JwtPayload } from "@/app/lib/auth";
import { ObjectId } from "mongodb";
import { logger } from "@/app/config/logger";

// Get performance metrics for a technician
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
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const timeRange = url.searchParams.get("timeRange") || "month";
    if (!["week", "month", "year"].includes(timeRange)) {
      logger.warn("Invalid timeRange parameter", { timeRange });
      return NextResponse.json(
        { success: false, message: "Invalid time range. Must be 'week', 'month', or 'year'" },
        { status: 400 }
      );
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    if (timeRange === "week") {
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === "month") {
      startDate.setMonth(now.getMonth() - 1);
    } else if (timeRange === "year") {
      startDate.setFullYear(now.getFullYear() - 1);
    }
    startDate.setHours(0, 0, 0, 0); // Normalize to start of day

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Find technician by userId
    const technician = await db.collection("technicians").findOne({ userId });
    if (!technician) {
      logger.warn("Technician not found", { userId });
      return NextResponse.json(
        { success: false, message: "Technician profile not found" },
        { status: 404 }
      );
    }

    // Fetch commission rate
    const settingsDoc = await db.collection("settings").findOne({ key: "commission" });
    const adminCommissionPercentage = settingsDoc?.value || 30; // Default to 30%

    // Get bookings for this technician within the time range
    const bookings = await db
      .collection("bookings")
      .find({
        technicianId: technician._id.toString(),
        createdAt: { $gte: startDate, $lte: now },
      })
      .toArray();

    // Calculate metrics in a single pass
    let completedBookings = 0;
    let pendingBookings = 0;
    let cancelledBookings = 0;
    let totalEarnings = 0;
    let totalCompletionTime = 0;
    let completedWithTimeCount = 0;
    const serviceTypes: Record<string, number> = {};
    const assignedBookings: typeof bookings = [];
    const respondedBookings: typeof bookings = [];

    bookings.forEach((booking) => {
      // Count bookings by status
      if (booking.status === "completed") {
        completedBookings++;
        const bookingAmount = booking.finalAmount || booking.amount || 0;
        if (bookingAmount < 0) {
          logger.warn("Invalid booking amount", { bookingId: booking._id.toString(), amount: bookingAmount });
          return;
        }
        totalEarnings += bookingAmount - (bookingAmount * adminCommissionPercentage) / 100;
        if (booking.assignedAt && booking.completedAt) {
          const assignedAt = new Date(booking.assignedAt);
          const completedAt = new Date(booking.completedAt);
          if (completedAt >= assignedAt) {
            totalCompletionTime += (completedAt.getTime() - assignedAt.getTime()) / (1000 * 60);
            completedWithTimeCount++;
          } else {
            logger.warn("Invalid completion time", { bookingId: booking._id.toString() });
          }
        }
      } else if (["pending", "confirmed", "assigned"].includes(booking.status)) {
        pendingBookings++;
      } else if (booking.status === "cancelled") {
        cancelledBookings++;
      }

      // Track service types
      const service = booking.service || "Other";
      serviceTypes[service] = (serviceTypes[service] || 0) + 1;

      // Track response rate
      if (booking.assignedAt) {
        assignedBookings.push(booking);
        if (booking.technicianAcceptedAt || booking.technicianRejectedAt) {
          respondedBookings.push(booking);
        }
      }
    });

    // Calculate average completion time
    const averageCompletionTime = completedWithTimeCount > 0
      ? Math.round(totalCompletionTime / completedWithTimeCount)
      : 0;

    // Calculate response rate
    const responseRate = assignedBookings.length > 0
      ? Math.round((respondedBookings.length / assignedBookings.length) * 100)
      : 0;

    // Get ratings for this technician
    const ratings = await db
      .collection("ratings")
      .find({ technicianId: technician._id.toString() })
      .toArray();

    // Calculate customer satisfaction
    let customerSatisfaction = 0;
    if (ratings.length > 0) {
      const totalRating = ratings.reduce((sum, r) => sum + (r.rating || 0), 0);
      const averageRating = totalRating / ratings.length;
      customerSatisfaction = Math.round((averageRating / 5) * 100);
    }

    // Get monthly earnings data for chart
    const monthlyEarnings = [];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    for (let i = 0; i < 6; i++) {
      const month = (currentMonth - i + 12) % 12;
      const year = currentMonth - i < 0 ? currentYear - 1 : currentYear;
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
      const monthBookings = bookings.filter((b) => {
        const bookingDate = new Date(b.createdAt);
        return bookingDate >= monthStart && bookingDate <= monthEnd && b.status === "completed";
      });
      const monthEarnings = monthBookings.reduce((sum, booking) => {
        const bookingAmount = booking.finalAmount || booking.amount || 0;
        if (bookingAmount < 0) return sum;
        const technicianEarnings = bookingAmount - (bookingAmount * adminCommissionPercentage) / 100;
        return sum + technicianEarnings;
      }, 0);
      const monthName = monthStart.toLocaleString("default", { month: "short" });
      monthlyEarnings.unshift({ month: `${monthName} ${year}`, earnings: Math.round(monthEarnings) });
    }

    logger.debug("Technician performance metrics retrieved", {
      userId,
      technicianId: technician._id.toString(),
      timeRange,
      completedBookings,
      totalEarnings: Math.round(totalEarnings),
    });

    return NextResponse.json({
      success: true,
      performance: {
        completedBookings,
        pendingBookings,
        cancelledBookings,
        totalEarnings: Math.round(totalEarnings),
        averageCompletionTime,
        customerSatisfaction,
        responseRate,
        rating: technician.averageRating || technician.rating || 0,
        monthlyEarnings,
        serviceTypes,
      },
      timeRange,
    });
  } catch (error) {
    logger.error("Error fetching technician performance", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, message: "Failed to fetch technician performance" },
      { status: 500 }
    );
  }
}