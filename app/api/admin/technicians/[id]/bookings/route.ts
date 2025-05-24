import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Get bookings for a specific technician
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
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

    // Get technician ID from URL params
    const { id } = await context.params;

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Find technician by ID
    const technician = await db.collection("technicians").findOne({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : id
    });

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
      technician: technician.name
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

    // Count total bookings
    const total = await db.collection("bookings").countDocuments(query);

    return NextResponse.json({
      success: true,
      bookings,
      pagination: {
        total,
        limit,
        skip,
        hasMore: total > skip + limit,
      }
    });
  } catch (error) {
    console.error("Error fetching technician bookings:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch technician bookings" },
      { status: 500 }
    );
  }
}
