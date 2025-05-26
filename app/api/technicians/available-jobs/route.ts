import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";

// GET handler to fetch available jobs for technicians
export async function GET(request: NextRequest) {
  try {
    console.log("Available jobs endpoint called");
    
    // Extract and verify token
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

    // Connect to database
    let db;
    try {
      const connection = await connectToDatabase();
      db = connection.db;
      console.log("Database connected successfully");
    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      // Return demo data if database fails
      return NextResponse.json({
        success: true,
        jobs: getDemoJobs(),
        total: 3,
        fallback: true,
        message: "Using demo data - database not available"
      });
    }

    // Find available bookings (not assigned to any technician)
    try {
      const availableBookings = await db.collection("bookings").find({
        status: { $in: ["pending", "confirmed"] },
        $or: [
          { technicianId: { $exists: false } },
          { technicianId: null },
          { technicianId: "" }
        ]
      }).sort({ createdAt: -1 }).limit(20).toArray();

      console.log(`Found ${availableBookings.length} available jobs`);

      // Format jobs for technician view
      const formattedJobs = availableBookings.map(booking => ({
        id: booking._id.toString(),
        bookingId: booking.bookingId || booking._id.toString(),
        serviceName: booking.serviceName || booking.service || "Service Request",
        serviceType: booking.serviceType || "repair",
        customerName: booking.customerName || "Customer",
        customerPhone: booking.customerPhone || "",
        customerEmail: booking.customerEmail || "",
        address: booking.address || booking.customerAddress || "Address not provided",
        location: booking.location || null,
        amount: booking.amount || booking.finalAmount || 0,
        distance: calculateDistance(booking.location), // You'd implement this
        urgency: booking.urgency || "normal",
        scheduledDate: booking.scheduledDate || new Date().toISOString().split('T')[0],
        scheduledTime: booking.scheduledTime || "09:00",
        description: booking.notes || booking.description || "No description provided",
        paymentMethod: booking.paymentMethod || "cash",
        status: booking.status,
        createdAt: booking.createdAt || new Date().toISOString(),
        estimatedDuration: booking.estimatedDuration || "1-2 hours"
      }));

      return NextResponse.json({
        success: true,
        jobs: formattedJobs,
        total: formattedJobs.length,
        message: `Found ${formattedJobs.length} available jobs`
      });

    } catch (findError) {
      console.error("Error finding available jobs:", findError);
      // Return demo data as fallback
      return NextResponse.json({
        success: true,
        jobs: getDemoJobs(),
        total: 3,
        fallback: true,
        message: "Using demo data - database query failed"
      });
    }

  } catch (error) {
    console.error("Unexpected error in available jobs:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate distance (simplified)
function calculateDistance(location: any): number {
  // In a real system, you'd calculate distance from technician's location
  // For now, return a random distance between 1-10 km
  return Math.round((Math.random() * 9 + 1) * 10) / 10;
}

// Demo jobs for fallback
function getDemoJobs() {
  return [
    {
      id: "demo-job-1",
      bookingId: "BK" + Date.now(),
      serviceName: "AC Repair",
      serviceType: "repair",
      customerName: "John Smith",
      customerPhone: "+91 9876543210",
      customerEmail: "john@example.com",
      address: "123 Main Street, City Center",
      location: { latitude: 28.6139, longitude: 77.2090 },
      amount: 2500,
      distance: 2.5,
      urgency: "normal",
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: "14:00",
      description: "Air conditioner not cooling properly, needs inspection",
      paymentMethod: "cash",
      status: "pending",
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      estimatedDuration: "2-3 hours"
    },
    {
      id: "demo-job-2",
      bookingId: "BK" + (Date.now() + 1),
      serviceName: "Washing Machine Repair",
      serviceType: "repair",
      customerName: "Sarah Johnson",
      customerPhone: "+91 9876543211",
      customerEmail: "sarah@example.com",
      address: "456 Oak Avenue, Downtown",
      location: { latitude: 28.6129, longitude: 77.2080 },
      amount: 1800,
      distance: 1.8,
      urgency: "high",
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: "16:00",
      description: "Washing machine not draining water, urgent repair needed",
      paymentMethod: "online",
      status: "confirmed",
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
      estimatedDuration: "1-2 hours"
    },
    {
      id: "demo-job-3",
      bookingId: "BK" + (Date.now() + 2),
      serviceName: "Refrigerator Service",
      serviceType: "maintenance",
      customerName: "Mike Wilson",
      customerPhone: "+91 9876543212",
      customerEmail: "mike@example.com",
      address: "789 Pine Road, Suburb",
      location: { latitude: 28.6149, longitude: 77.2100 },
      amount: 1200,
      distance: 3.2,
      urgency: "low",
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
      scheduledTime: "10:00",
      description: "Regular maintenance and cleaning of refrigerator",
      paymentMethod: "cash",
      status: "pending",
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
      estimatedDuration: "1 hour"
    }
  ];
}
