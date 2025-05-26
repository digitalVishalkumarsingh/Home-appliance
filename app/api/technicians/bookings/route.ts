import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Get all bookings for a technician
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

    const decoded = await verifyToken(token);

    if (!decoded || typeof decoded !== "object" || !("userId" in decoded)) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const userId = (decoded as { userId: string }).userId;

    // Get query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const skip = parseInt(url.searchParams.get("skip") || "0", 10);

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Find technician
    const technician = await db.collection("technicians").findOne(
      ObjectId.isValid(userId)
        ? { $or: [{ _id: new ObjectId(userId) }, { userId: userId }] }
        : { userId: userId }
    );

    if (!technician) {
      return NextResponse.json(
        { success: false, message: "Technician not found" },
        { status: 404 }
      );
    }

    // Build query for bookings
    const query: any = {
      technicianId: technician._id.toString()
    };

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Get total count
    const totalCount = await db.collection("bookings").countDocuments(query);

    // Get bookings with pagination
    const bookings = await db
      .collection("bookings")
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      success: true,
      bookings,
      pagination: {
        total: totalCount,
        limit,
        skip,
        hasMore: skip + limit < totalCount
      }
    });
  } catch (error) {
    console.error("Error fetching technician bookings:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
