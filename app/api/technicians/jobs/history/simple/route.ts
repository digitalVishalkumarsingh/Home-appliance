import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";

// Simple fallback for job history without database dependency
export async function GET(request: NextRequest) {
  try {
    console.log("Simple job history endpoint called");
    
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
    const limit = parseInt(url.searchParams.get("limit") || "10");

    console.log("Returning mock job history for technician:", userId);

    // Generate mock job history
    const mockJobs = Array.from({ length: Math.min(limit, 5) }, (_, index) => ({
      _id: `mock-job-${index + 1}`,
      bookingId: `BK${Date.now() + index}`,
      customerName: `Customer ${index + 1}`,
      customerEmail: `customer${index + 1}@example.com`,
      customerPhone: `+91${9000000000 + index}`,
      serviceName: ["AC Repair", "Refrigerator Service", "Washing Machine Fix", "Microwave Repair", "TV Installation"][index % 5],
      serviceType: ["repair", "maintenance", "installation"][index % 3],
      amount: [1500, 2000, 1200, 1800, 2500][index % 5],
      finalAmount: [1500, 2000, 1200, 1800, 2500][index % 5],
      status: ["completed", "pending", "confirmed"][index % 3],
      address: `${index + 1}23 Mock Street, Demo City`,
      location: {
        latitude: 28.6139 + (index * 0.01),
        longitude: 77.2090 + (index * 0.01)
      },
      scheduledDate: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      scheduledTime: ["09:00", "11:00", "14:00", "16:00", "18:00"][index % 5],
      notes: `Demo job ${index + 1} - This is mock data`,
      createdAt: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString(),
      updatedAt: new Date(Date.now() - (index * 12 * 60 * 60 * 1000)).toISOString(),
      technicianId: userId,
      paymentMethod: ["cash", "online"][index % 2],
      rating: index < 3 ? 4 + (index * 0.5) : null,
      feedback: index < 3 ? `Great service! Mock feedback ${index + 1}` : null
    }));

    return NextResponse.json({
      success: true,
      jobs: mockJobs,
      total: mockJobs.length,
      limit,
      fallback: true,
      message: "Using demo data - database not available"
    });

  } catch (error) {
    console.error("Error in simple job history:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch job history",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// POST endpoint info
export async function POST() {
  return NextResponse.json({
    success: true,
    message: "Simple job history endpoint",
    note: "This provides mock job data when the main job history endpoint fails",
    usage: "GET request with Authorization header and optional ?limit=N parameter"
  });
}
