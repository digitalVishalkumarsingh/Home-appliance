import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Get job history with earnings details for a technician
export async function GET(request: NextRequest) {
  try {
    // Verify technician authentication
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded || typeof decoded !== "object" || !("userId" in decoded)) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Get technician details
    const technician = await db.collection("technicians").findOne({
      _id: new ObjectId(decoded.userId as string)
    });

    if (!technician) {
      return NextResponse.json(
        { success: false, message: "Technician not found" },
        { status: 404 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    const skip = parseInt(url.searchParams.get("skip") || "0", 10);
    const status = url.searchParams.get("status") || "";
    const startDate = url.searchParams.get("startDate") || "";
    const endDate = url.searchParams.get("endDate") || "";

    // Build query
    const query: any = {
      technicianId: technician._id.toString()
    };

    if (status) {
      query.status = status;
    }

    // Add date range filter if provided
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get bookings for this technician
    const bookings = await db.collection("bookings")
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get the admin commission rate
    const settingsDoc = await db.collection("settings").findOne({ key: "commission" });
    const adminCommissionPercentage = settingsDoc?.value || 30; // Default to 30% if not set

    // Get all payouts for this technician
    const payouts = await db.collection("payouts").find({
      technicianId: technician._id.toString()
    }).toArray();

    // Transform bookings into job history format with earnings details
    const jobHistory = bookings.map(booking => {
      // Calculate earnings
      const totalAmount = booking.amount || 0;
      const adminCommission = Math.round((totalAmount * adminCommissionPercentage) / 100);
      const technicianEarnings = totalAmount - adminCommission;

      // Check if this booking has been paid out
      const payout = payouts.find(p =>
        p.bookingIds && p.bookingIds.includes(booking._id.toString())
      );

      // Calculate distance (in a real app, this would use geolocation)
      // For demo, we'll use a random distance between 1-10 km
      const distance = Math.round((Math.random() * 9 + 1) * 10) / 10;

      return {
        id: booking._id.toString(),
        bookingId: booking.bookingId || booking._id.toString(),
        appliance: booking.service || "Appliance Repair",
        location: {
          address: booking.address || booking.customerAddress || "Customer Address",
          distance: distance
        },
        earnings: {
          total: totalAmount,
          technicianEarnings,
          adminCommission,
          adminCommissionPercentage,
          paymentStatus: payout ? "paid" : "pending",
          payoutDate: payout ? payout.createdAt : null,
          transactionId: payout ? payout._id.toString() : null
        },
        customer: {
          name: booking.customerName || "Customer",
          phone: booking.customerPhone
        },
        description: booking.notes || booking.serviceDetails || "No description provided",
        urgency: booking.urgency || "normal",
        status: booking.status || "completed",
        createdAt: booking.createdAt || new Date().toISOString(),
        completedAt: booking.completedAt || null
      };
    });

    // Calculate earnings summary
    const totalEarnings = jobHistory.reduce((sum, job) => sum + job.earnings.technicianEarnings, 0);
    const pendingEarnings = jobHistory
      .filter(job => job.earnings.paymentStatus === "pending")
      .reduce((sum, job) => sum + job.earnings.technicianEarnings, 0);
    const paidEarnings = totalEarnings - pendingEarnings;

    // Get last payout details
    let lastPayoutDate = null;
    let lastPayoutAmount = 0;

    if (payouts.length > 0) {
      const sortedPayouts = [...payouts].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      lastPayoutDate = sortedPayouts[0].createdAt;
      lastPayoutAmount = sortedPayouts[0].amount;
    }

    // Count total bookings
    const total = await db.collection("bookings").countDocuments(query);

    return NextResponse.json({
      success: true,
      summary: {
        totalEarnings,
        pendingEarnings,
        paidEarnings,
        lastPayoutDate,
        lastPayoutAmount
      },
      jobHistory,
      pagination: {
        total,
        limit,
        skip,
        hasMore: total > skip + limit,
      }
    });
  } catch (error) {
    console.error("Error fetching technician job earnings:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch job earnings" },
      { status: 500 }
    );
  }
}
