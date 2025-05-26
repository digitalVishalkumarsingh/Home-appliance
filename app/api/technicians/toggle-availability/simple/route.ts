import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";

// Simple fallback for availability toggle without database dependency
export async function POST(request: NextRequest) {
  try {
    console.log("Simple availability toggle endpoint called");
    
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

    console.log("Simple availability toggle for technician:", userId);

    // Get current status from localStorage simulation
    // In a real scenario, this would be stored in a cache or simple storage
    const currentStatus = Math.random() > 0.5; // Random for demo
    const newStatus = !currentStatus;

    return NextResponse.json({
      success: true,
      isAvailable: newStatus,
      message: newStatus 
        ? "You are now available for job offers (demo mode)" 
        : "You are now unavailable for job offers (demo mode)",
      fallback: true,
      note: "Using demo mode - database not available"
    });

  } catch (error) {
    console.error("Error in simple availability toggle:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to toggle availability",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Simple GET for availability status
export async function GET(request: NextRequest) {
  try {
    console.log("Simple availability status endpoint called");
    
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

    console.log("Simple availability status for technician:", userId);

    // Return demo status
    return NextResponse.json({
      success: true,
      isAvailable: true, // Default to available in demo mode
      fallback: true,
      message: "Using demo data - database not available"
    });

  } catch (error) {
    console.error("Error in simple availability status:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to get availability status",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
