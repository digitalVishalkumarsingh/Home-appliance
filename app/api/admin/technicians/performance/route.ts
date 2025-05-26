import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";

// Get technician performance metrics
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
    const timeRange = url.searchParams.get("timeRange") || "month";

    // Calculate date range based on timeRange
    const now = new Date();
    let startDate = new Date();

    if (timeRange === "week") {
      startDate.setDate(now.getDate() - 7);
    } else if (timeRange === "month") {
      startDate.setMonth(now.getMonth() - 1);
    } else if (timeRange === "year") {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get all technicians
    const technicians = await db.collection("technicians").find({}).toArray();

    // For each technician, calculate performance metrics
    const technicianPerformance = await Promise.all(
      technicians.map(async (technician) => {
        // Get bookings for this technician within the time range
        const bookings = await db.collection("bookings").find({
          technicianId: technician._id.toString(),
          createdAt: { $gte: startDate }
        }).toArray();

        // Calculate metrics
        const completedBookings = bookings.filter(b => b.status === "completed").length;
        const pendingBookings = bookings.filter(b => b.status === "pending" || b.status === "confirmed" || b.status === "assigned").length;
        const cancelledBookings = bookings.filter(b => b.status === "cancelled").length;

        // Calculate total earnings
        const totalEarnings = bookings
          .filter(b => b.status === "completed")
          .reduce((sum, booking) => sum + (booking.finalAmount || booking.amount || 0), 0);

        // Calculate average completion time (if available)
        let averageCompletionTime = 0;
        const bookingsWithCompletionTime = bookings.filter(
          b => b.status === "completed" && b.assignedAt && b.completedAt
        );

        if (bookingsWithCompletionTime.length > 0) {
          const totalCompletionTime = bookingsWithCompletionTime.reduce((sum, booking) => {
            const assignedTime = new Date(booking.assignedAt).getTime();
            const completedTime = new Date(booking.completedAt).getTime();
            return sum + (completedTime - assignedTime) / (1000 * 60); // Convert to minutes
          }, 0);

          averageCompletionTime = Math.round(totalCompletionTime / bookingsWithCompletionTime.length);
        }

        // Calculate customer satisfaction (based on ratings if available)
        let customerSatisfaction = 0;
        const bookingsWithRatings = bookings.filter(b => b.customerRating);

        if (bookingsWithRatings.length > 0) {
          const totalRating = bookingsWithRatings.reduce((sum, booking) => sum + (booking.customerRating || 0), 0);
          const averageRating = totalRating / bookingsWithRatings.length;
          customerSatisfaction = Math.round((averageRating / 5) * 100); // Convert to percentage
        } else {
          // If no ratings, use technician's overall rating
          customerSatisfaction = Math.round(((technician.rating || 0) / 5) * 100);
        }

        // Calculate response rate
        let responseRate = 0;
        const assignedBookings = bookings.filter(b => b.assignedAt);

        if (assignedBookings.length > 0) {
          const respondedBookings = assignedBookings.filter(
            b => b.technicianAcceptedAt || b.technicianRejectedAt
          );

          responseRate = Math.round((respondedBookings.length / assignedBookings.length) * 100);
        }

        return {
          _id: technician._id,
          name: technician.name,
          email: technician.email,
          phone: technician.phone,
          specializations: technician.specializations,
          status: technician.status,
          rating: technician.rating || 0,
          completedBookings,
          pendingBookings,
          cancelledBookings,
          totalEarnings,
          averageCompletionTime,
          customerSatisfaction,
          responseRate: responseRate || 90, // Default to 90% if no data
        };
      })
    );

    return NextResponse.json({
      success: true,
      technicians: technicianPerformance,
      timeRange
    });
  } catch (error) {
    console.error("Error fetching technician performance:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch technician performance" },
      { status: 500 }
    );
  }
}
