import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";

// Simple fallback for technician stats without database dependency
export async function GET(request: NextRequest) {
  try {
    console.log("Simple technician stats endpoint called");
    
    // Basic auth check
    let token: string;
    try {
      token = getTokenFromRequest(request);
    } catch (error) {
      console.error("Token extraction failed:", error);
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = await verifyToken(token);
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const { userId, role } = decoded;
    if (!userId || role !== "technician") {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Technician role required" },
        { status: 403 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const timeRange = url.searchParams.get("timeRange")?.toLowerCase() || "month";

    console.log("Returning mock stats for technician:", userId);

    // Return mock data for demonstration
    return NextResponse.json({
      success: true,
      totalBookings: 15,
      completedBookings: 12,
      pendingBookings: 3,
      totalEarnings: 25000,
      pendingEarnings: 5000,
      lastPayoutDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastPayoutAmount: 20000,
      rating: 4.5,
      bookingsChange: 15.5,
      earningsChange: 12.3,
      timeRange,
      fallback: true,
      message: "Using demo data - database not available"
    });

  } catch (error) {
    console.error("Error in simple technician stats:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch technician stats",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// GET endpoint info
export async function POST() {
  return NextResponse.json({
    success: true,
    message: "Simple technician stats endpoint",
    note: "This provides mock data when the main stats endpoint fails",
    usage: "GET request with Authorization header"
  });
}
