import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Get pending jobs for a technician
export async function GET(request: Request) {
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

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Find technician
    let technician = await db.collection("technicians").findOne({
      $or: [
        ...(ObjectId.isValid(userId) ? [{ _id: new ObjectId(userId) }] : []),
        { userId: userId },
        { id: userId },
        { email: userId }
      ]
    });

    if (!technician) {
      console.error(`Technician not found for userId: ${userId}`);

      // Try to find user first
      const user = await db.collection("users").findOne(
        ObjectId.isValid(userId)
          ? { _id: new ObjectId(userId) }
          : { userId: userId }
      );

      if (user) {
        // Try to find technician by email
        const technicianByEmail = await db.collection("technicians").findOne({
          email: user.email
        });

        if (technicianByEmail) {
          // Update technician with userId reference
          await db.collection("technicians").updateOne(
            { _id: technicianByEmail._id },
            { $set: { userId: userId } }
          );

          // Use this technician
          technician = technicianByEmail;
        } else {
          return NextResponse.json(
            { success: false, message: "Technician not found" },
            { status: 404 }
          );
        }
      } else {
        return NextResponse.json(
          { success: false, message: "Technician not found" },
          { status: 404 }
        );
      }
    }

    // Find pending job offers for this technician
    const pendingJobOffer = await db.collection("jobOffers").findOne({
      technicianId: technician._id.toString(),
      status: "pending",
      expiresAt: { $gt: new Date() }
    });

    if (!pendingJobOffer) {
      return NextResponse.json({
        success: true,
        pendingJob: null
      });
    }

    // Find the booking associated with this job offer
    const booking = await db.collection("bookings").findOne({
      _id: ObjectId.isValid(pendingJobOffer.bookingId)
        ? new ObjectId(pendingJobOffer.bookingId)
        : pendingJobOffer.bookingId
    });

    if (!booking) {
      return NextResponse.json({
        success: true,
        pendingJob: null
      });
    }

    // Get the admin commission rate from settings
    const settingsDoc = await db.collection("settings").findOne({ key: "commission" });
    const adminCommissionPercentage = settingsDoc?.value || 30; // Default to 30% if not set

    // Calculate earnings with admin commission
    const totalAmount = booking.amount || 0;
    const adminCommission = Math.round((totalAmount * adminCommissionPercentage) / 100);
    const technicianEarnings = totalAmount - adminCommission;

    // Format the job data
    const pendingJob = {
      id: pendingJobOffer._id.toString(),
      bookingId: pendingJobOffer.bookingIdDisplay || booking.bookingId || booking._id.toString(),
      orderId: pendingJobOffer.orderId || booking.orderId || "",
      paymentId: pendingJobOffer.paymentId || booking.paymentId || "",
      appliance: pendingJobOffer.service || booking.service || "Appliance Repair",
      location: {
        address: booking.customerAddress || booking.address || "Customer Address",
        fullAddress: booking.customerAddress || booking.address || "Customer Address",
        distance: pendingJobOffer.distance || 5, // Default to 5km if not specified
        coordinates: booking.customerLocation || pendingJobOffer.customerLocation || null,
      },
      earnings: {
        total: pendingJobOffer.amount || totalAmount,
        technicianEarnings,
        adminCommission,
        adminCommissionPercentage
      },
      customer: {
        name: booking.customerName || "Customer",
        phone: booking.customerPhone || "",
      },
      description: booking.notes || booking.serviceDetails || "",
      urgency: booking.urgency || "normal",
      createdAt: booking.createdAt || new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      pendingJob
    });
  } catch (error) {
    console.error("Error fetching pending jobs:", error);

    // Return a more detailed error message in development
    const errorMessage = process.env.NODE_ENV === 'development'
      ? `Failed to fetch pending jobs: ${error instanceof Error ? error.message : String(error)}`
      : "Failed to fetch pending jobs";

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
