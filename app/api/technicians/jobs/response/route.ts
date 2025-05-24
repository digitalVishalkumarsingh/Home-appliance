import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Handle technician response to job assignment (accept/reject)
export async function POST(request: Request) {
  try {
    // Verify technician authentication
    const token = getTokenFromRequest(new NextRequest(request));

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

    const userId = (decoded as { userId: string }).userId;

    // Get response data from request body
    const { bookingId, response, reason } = await request.json();

    // Validate required fields
    if (!bookingId || !response) {
      return NextResponse.json(
        { success: false, message: "Booking ID and response are required" },
        { status: 400 }
      );
    }

    // Validate response value
    if (response !== "accept" && response !== "reject") {
      return NextResponse.json(
        { success: false, message: "Response must be 'accept' or 'reject'" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Find technician
    const technician = await db.collection("technicians").findOne({
      _id: new ObjectId(userId)
    });

    if (!technician) {
      return NextResponse.json(
        { success: false, message: "Technician not found" },
        { status: 404 }
      );
    }

    // Find booking
    const orConditions = [
      ...(ObjectId.isValid(bookingId) ? [{ _id: new ObjectId(bookingId) }] : []),
      { id: bookingId },
      { bookingId: bookingId }
    ];
    const booking = await db.collection("bookings").findOne({
      $or: orConditions,
      technicianId: technician._id.toString()
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found or not assigned to this technician" },
        { status: 404 }
      );
    }

    // Handle response
    if (response === "accept") {
      // Update booking status to confirmed
      await db.collection("bookings").updateOne(
        { _id: booking._id },
        { 
          $set: { 
            status: "confirmed",
            technicianAcceptedAt: new Date(),
            updatedAt: new Date()
          } 
        }
      );

      // Update technician status to busy
      await db.collection("technicians").updateOne(
        { _id: technician._id },
        { 
          $set: { 
            status: "busy",
            updatedAt: new Date()
          } 
        }
      );

      // Create notification for customer
      const customerNotification = {
        recipientId: booking.userId || booking.customerEmail,
        recipientType: "customer",
        title: "Booking Confirmed",
        message: `Your ${booking.service} booking has been confirmed and a technician has been assigned.`,
        bookingId: booking._id.toString(),
        status: "unread",
        createdAt: new Date()
      };

      await db.collection("notifications").insertOne(customerNotification);

      return NextResponse.json({
        success: true,
        message: "Booking accepted successfully",
        booking: {
          ...booking,
          status: "confirmed",
          technicianAcceptedAt: new Date()
        }
      });
    } else {
      // Update booking to remove technician assignment
      await db.collection("bookings").updateOne(
        { _id: booking._id },
        { 
          $set: { 
            status: "pending",
            technicianRejectedAt: new Date(),
            technicianRejectionReason: reason || "No reason provided",
            updatedAt: new Date()
          },
          $unset: {
            technician: "",
            technicianId: ""
          }
        }
      );

      // Create notification for admin
      const adminNotification = {
        recipientType: "admin",
        title: "Booking Rejected by Technician",
        message: `Technician ${technician.name} has rejected the ${booking.service} booking.`,
        reason: reason || "No reason provided",
        bookingId: booking._id.toString(),
        status: "unread",
        createdAt: new Date()
      };

      await db.collection("notifications").insertOne(adminNotification);

      return NextResponse.json({
        success: true,
        message: "Booking rejected successfully",
        booking: {
          ...booking,
          status: "pending",
          technicianRejectedAt: new Date(),
          technicianRejectionReason: reason || "No reason provided"
        }
      });
    }
  } catch (error) {
    console.error("Error processing technician response:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process technician response" },
      { status: 500 }
    );
  }
}
