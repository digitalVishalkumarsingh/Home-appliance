import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Assign a booking to a technician
export async function POST(request: Request) {
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

    // Get assignment data from request body
    const { bookingId, technicianId } = await request.json();

    // Validate required fields
    if (!bookingId || !technicianId) {
      return NextResponse.json(
        { success: false, message: "Booking ID and Technician ID are required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Find booking
    const booking = await db.collection("bookings").findOne({
      $or: [
        { _id: ObjectId.isValid(bookingId) ? new ObjectId(bookingId) : null },
        { id: bookingId },
        { bookingId: bookingId }
      ]
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Find technician
    const technician = await db.collection("technicians").findOne({
      _id: ObjectId.isValid(technicianId) ? new ObjectId(technicianId) : technicianId
    });

    if (!technician) {
      return NextResponse.json(
        { success: false, message: "Technician not found" },
        { status: 404 }
      );
    }

    // Check if technician is active
    if (technician.status !== "active" && technician.status !== "online") {
      return NextResponse.json(
        { success: false, message: "Technician is not active or online" },
        { status: 400 }
      );
    }

    // Check if technician has the required specialization
    if (!technician.specializations.some(spec =>
      booking.service?.toLowerCase().includes(spec.toLowerCase())
    )) {
      return NextResponse.json(
        { success: false, message: "Technician does not have the required specialization for this booking" },
        { status: 400 }
      );
    }

    // Update booking with technician assignment
    await db.collection("bookings").updateOne(
      { _id: booking._id },
      {
        $set: {
          technician: technician.name,
          technicianId: technician._id.toString(),
          status: "assigned",
          assignedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Create notification for technician (in a real app, this would trigger a push notification)
    const notification = {
      recipientId: technician._id.toString(),
      recipientType: "technician",
      title: "New Job Assignment",
      message: `You have been assigned to a new ${booking.service} job`,
      bookingId: booking._id.toString(),
      status: "unread",
      createdAt: new Date()
    };

    await db.collection("notifications").insertOne(notification);

    return NextResponse.json({
      success: true,
      message: "Booking assigned to technician successfully",
      booking: {
        ...booking,
        technician: technician.name,
        technicianId: technician._id.toString(),
        status: "assigned"
      }
    });
  } catch (error) {
    console.error("Error assigning booking to technician:", error);
    return NextResponse.json(
      { success: false, message: "Failed to assign booking to technician" },
      { status: 500 }
    );
  }
}

// Find available technicians for a booking
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
    const bookingId = url.searchParams.get("bookingId");
    const service = url.searchParams.get("service");

    if (!bookingId && !service) {
      return NextResponse.json(
        { success: false, message: "Booking ID or service type is required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // If bookingId is provided, get the service from the booking
    let serviceType = service;
    if (bookingId) {
      const booking = await db.collection("bookings").findOne({
        $or: [
          { _id: ObjectId.isValid(bookingId) ? new ObjectId(bookingId) : null },
          { id: bookingId },
          { bookingId: bookingId }
        ]
      });

      if (!booking) {
        return NextResponse.json(
          { success: false, message: "Booking not found" },
          { status: 404 }
        );
      }

      serviceType = booking.service;
    }

    // Find technicians with matching specialization and active status
    const technicians = await db.collection("technicians")
      .find({
        $or: [
          { status: "active" },
          { status: "online" }
        ],
        specializations: {
          $elemMatch: {
            $regex: new RegExp(serviceType, "i")
          }
        }
      })
      .sort({ rating: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      technicians: technicians.map(tech => ({
        _id: tech._id,
        name: tech.name,
        phone: tech.phone,
        email: tech.email,
        specializations: tech.specializations,
        status: tech.status,
        rating: tech.rating || 0,
        completedBookings: tech.completedBookings || 0
      }))
    });
  } catch (error) {
    console.error("Error finding available technicians:", error);
    return NextResponse.json(
      { success: false, message: "Failed to find available technicians" },
      { status: 500 }
    );
  }
}
