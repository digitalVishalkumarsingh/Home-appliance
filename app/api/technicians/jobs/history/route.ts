import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Get job history for a technician
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

    // Get technician details by userId
    const userId = decoded.userId;
    let technician = await db.collection("technicians").findOne({
      userId: ObjectId.isValid(userId as string) ? new ObjectId(userId as string) : userId
    });

    // If not found by userId, try to find by _id (for backward compatibility)
    if (!technician) {
      technician = ObjectId.isValid(userId as string)
        ? await db.collection("technicians").findOne({ _id: new ObjectId(userId as string) })
        : null;
    }

    // If still not found, try to find by user's email
    if (!technician) {
      // Get user details
      const user = ObjectId.isValid(userId as string)
        ? await db.collection("users").findOne({ _id: new ObjectId(userId as string) })
        : null;

      if (user) {
        technician = await db.collection("technicians").findOne({
          email: user.email
        });

        // If found by email, update the technician with userId reference
        if (technician) {
          await db.collection("technicians").updateOne(
            { _id: technician._id },
            { $set: { userId: ObjectId.isValid(userId as string) ? new ObjectId(userId as string) : userId } }
          );
        }
      }
    }

    if (!technician) {
      return NextResponse.json(
        { success: false, message: "Technician not found" },
        { status: 404 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const skip = parseInt(url.searchParams.get("skip") || "0", 10);
    const status = url.searchParams.get("status") || "";

    // Build query
    const query: any = {
      technicianId: technician._id.toString()
    };

    if (status) {
      query.status = status;
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

    // Transform bookings into job history format
    const jobHistory = bookings.map(booking => {
      // Calculate earnings
      const totalAmount = booking.amount || 0;
      const adminCommission = Math.round((totalAmount * adminCommissionPercentage) / 100);
      const technicianEarnings = totalAmount - adminCommission;

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
          adminCommissionPercentage
        },
        customer: {
          name: booking.customerName || "Customer",
          phone: booking.customerPhone
        },
        description: booking.notes || booking.serviceDetails || "No description provided",
        urgency: booking.urgency || "normal",
        status: booking.status || "completed",
        createdAt: booking.createdAt || new Date().toISOString()
      };
    });

    // Count total bookings
    const total = await db.collection("bookings").countDocuments(query);

    return NextResponse.json({
      success: true,
      jobHistory,
      pagination: {
        total,
        limit,
        skip,
        hasMore: total > skip + limit,
      }
    });
  } catch (error) {
    console.error("Error fetching technician job history:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch job history" },
      { status: 500 }
    );
  }
}
