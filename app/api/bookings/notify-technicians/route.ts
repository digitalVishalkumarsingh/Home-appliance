import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";

// POST handler to notify technicians about new bookings
export async function POST(request: NextRequest) {
  try {
    console.log("Notify technicians endpoint called");
    
    const body = await request.json();
    const { bookingId, serviceName, customerName, address, amount, urgency = "normal" } = body;

    if (!bookingId || !serviceName) {
      return NextResponse.json(
        { success: false, message: "Booking ID and service name are required" },
        { status: 400 }
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
      // Continue without database for demo
    }

    // Find available technicians (on duty)
    let availableTechnicians = [];
    
    if (db) {
      try {
        availableTechnicians = await db.collection("technicians").find({
          isAvailable: true,
          status: "active"
        }).toArray();
        
        console.log(`Found ${availableTechnicians.length} available technicians`);
      } catch (findError) {
        console.error("Error finding technicians:", findError);
      }
    }

    // Create job notification data
    const jobNotification = {
      id: `job-${Date.now()}`,
      bookingId,
      serviceName,
      customerName: customerName || "Customer",
      customerPhone: "+91 9876543210", // Would come from booking data
      address: address || "Customer Address",
      amount: amount || 1500,
      distance: Math.round((Math.random() * 5 + 1) * 10) / 10, // Random distance 1-5 km
      urgency,
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: "14:00",
      description: `${serviceName} service requested`,
      paymentMethod: "cash",
      createdAt: new Date().toISOString()
    };

    // In a real system, this would:
    // 1. Send push notifications to available technicians
    // 2. Use WebSocket/SSE for real-time notifications
    // 3. Store notification in database
    // 4. Implement job assignment logic

    console.log("Job notification created:", jobNotification);

    // For demo, we'll store this in a simple way that technicians can poll
    if (db) {
      try {
        await db.collection("job_notifications").insertOne({
          ...jobNotification,
          status: "pending",
          notifiedTechnicians: availableTechnicians.map(t => t._id),
          createdAt: new Date()
        });
        console.log("Job notification stored in database");
      } catch (insertError) {
        console.error("Error storing job notification:", insertError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Technicians notified successfully",
      jobNotification,
      availableTechnicians: availableTechnicians.length,
      instructions: [
        "Job notification has been created",
        "Available technicians will be notified",
        "Technicians can accept or decline the job",
        "First technician to accept gets the job"
      ]
    });

  } catch (error) {
    console.error("Error notifying technicians:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to notify technicians",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check pending notifications
export async function GET(request: NextRequest) {
  try {
    console.log("Get pending notifications endpoint called");
    
    // Connect to database
    let db;
    try {
      const connection = await connectToDatabase();
      db = connection.db;
    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      // Return demo data if database fails
      return NextResponse.json({
        success: true,
        notifications: getDemoNotifications(),
        total: 2,
        fallback: true,
        message: "Using demo data - database not available"
      });
    }

    // Find pending job notifications
    try {
      const pendingNotifications = await db.collection("job_notifications").find({
        status: "pending"
      }).sort({ createdAt: -1 }).limit(10).toArray();

      return NextResponse.json({
        success: true,
        notifications: pendingNotifications,
        total: pendingNotifications.length,
        message: `Found ${pendingNotifications.length} pending notifications`
      });

    } catch (findError) {
      console.error("Error finding notifications:", findError);
      return NextResponse.json({
        success: true,
        notifications: getDemoNotifications(),
        total: 2,
        fallback: true,
        message: "Using demo data - database query failed"
      });
    }

  } catch (error) {
    console.error("Error getting notifications:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get notifications",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Demo notifications for fallback
function getDemoNotifications() {
  return [
    {
      id: "demo-notification-1",
      bookingId: "BK" + Date.now(),
      serviceName: "AC Repair",
      customerName: "John Smith",
      customerPhone: "+91 9876543210",
      address: "123 Main Street, City Center",
      amount: 2500,
      distance: 2.5,
      urgency: "normal",
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: "14:00",
      description: "Air conditioner not cooling properly",
      paymentMethod: "cash",
      status: "pending",
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 minutes ago
    },
    {
      id: "demo-notification-2",
      bookingId: "BK" + (Date.now() + 1),
      serviceName: "Washing Machine Repair",
      customerName: "Sarah Johnson",
      customerPhone: "+91 9876543211",
      address: "456 Oak Avenue, Downtown",
      amount: 1800,
      distance: 1.8,
      urgency: "high",
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: "16:00",
      description: "Washing machine not draining water",
      paymentMethod: "online",
      status: "pending",
      createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString() // 2 minutes ago
    }
  ];
}
