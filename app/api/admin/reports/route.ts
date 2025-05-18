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

    // Parse query parameters
    const url = new URL(request.url);
    const startDateParam = url.searchParams.get("startDate");
    const endDateParam = url.searchParams.get("endDate");

    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (startDateParam) {
      startDate = new Date(startDateParam);
      startDate.setHours(0, 0, 0, 0);
    }

    if (endDateParam) {
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Build query for date filtering
    const dateQuery: any = {};
    if (startDate && endDate) {
      dateQuery.createdAt = {
        $gte: startDate.toISOString(),
        $lte: endDate.toISOString(),
      };
    } else if (startDate) {
      dateQuery.createdAt = { $gte: startDate.toISOString() };
    } else if (endDate) {
      dateQuery.createdAt = { $lte: endDate.toISOString() };
    }

    // Get all bookings within date range
    const bookings = await db.collection("bookings").find(dateQuery).toArray();

    // Get unique customers
    const uniqueCustomerIds = new Set();
    bookings.forEach((booking: any) => {
      if (booking.userId) {
        uniqueCustomerIds.add(booking.userId);
      } else if (booking.email) {
        uniqueCustomerIds.add(booking.email);
      } else if (booking.phone) {
        uniqueCustomerIds.add(booking.phone);
      }
    });

    // Calculate total revenue
    const totalRevenue = bookings.reduce((sum: number, booking: any) => {
      return sum + (booking.amount || 0);
    }, 0);

    // Count bookings by status
    const bookingsByStatus = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    };

    bookings.forEach((booking: any) => {
      const status = booking.status?.toLowerCase() || "pending";
      if (bookingsByStatus.hasOwnProperty(status)) {
        bookingsByStatus[status as keyof typeof bookingsByStatus]++;
      }
    });

    // Calculate revenue by service
    const revenueByService: { [key: string]: number } = {};
    bookings.forEach((booking: any) => {
      const service = booking.service || "Other";
      if (!revenueByService[service]) {
        revenueByService[service] = 0;
      }
      revenueByService[service] += booking.amount || 0;
    });

    // Calculate bookings and revenue by month
    const bookingsByMonth: { [key: string]: number } = {};
    const revenueByMonth: { [key: string]: number } = {};

    bookings.forEach((booking: any) => {
      const date = new Date(booking.createdAt);
      const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      
      if (!bookingsByMonth[monthYear]) {
        bookingsByMonth[monthYear] = 0;
      }
      bookingsByMonth[monthYear]++;
      
      if (!revenueByMonth[monthYear]) {
        revenueByMonth[monthYear] = 0;
      }
      revenueByMonth[monthYear] += booking.amount || 0;
    });

    // Sort months chronologically
    const sortedMonths = Object.keys(bookingsByMonth).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    });

    const sortedBookingsByMonth: { [key: string]: number } = {};
    const sortedRevenueByMonth: { [key: string]: number } = {};

    sortedMonths.forEach(month => {
      sortedBookingsByMonth[month] = bookingsByMonth[month];
      sortedRevenueByMonth[month] = revenueByMonth[month];
    });

    // Prepare report data
    const reportData = {
      totalBookings: bookings.length,
      totalRevenue,
      totalCustomers: uniqueCustomerIds.size,
      bookingsByStatus,
      revenueByService,
      bookingsByMonth: sortedBookingsByMonth,
      revenueByMonth: sortedRevenueByMonth,
    };

    return NextResponse.json({
      success: true,
      reportData,
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
