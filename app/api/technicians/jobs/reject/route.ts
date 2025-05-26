import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Reject a job offer
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

    // Get job data from request body
    const { jobId, reason } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { success: false, message: "Job ID is required" },
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

    // Find job offer or job notification
    let jobOffer = await db.collection("jobOffers").findOne({
      _id: ObjectId.isValid(jobId) ? new ObjectId(jobId) : jobId,
      status: "pending"
    });

    // If not found in jobOffers, check job_notifications
    let jobNotification = null;
    if (!jobOffer) {
      if (ObjectId.isValid(jobId)) {
        jobNotification = await db.collection("job_notifications").findOne({
          _id: new ObjectId(jobId),
          status: "pending"
        });
      } else {
        jobNotification = await db.collection("job_notifications").findOne({
          _id: jobId,
          status: "pending"
        });
      }

      if (jobNotification) {
        // Convert job notification to job offer format for compatibility
        jobOffer = {
          _id: jobNotification._id,
          bookingId: jobNotification.bookingId,
          technicianId: technician._id.toString(),
          status: "pending",
          serviceName: jobNotification.serviceName,
          customerName: jobNotification.customerName,
          address: jobNotification.address,
          amount: jobNotification.amount,
          urgency: jobNotification.urgency,
          createdAt: jobNotification.createdAt,
          serviceTypes: [jobNotification.serviceName] // For compatibility
        };
      }
    }

    if (!jobOffer) {
      return NextResponse.json(
        { success: false, message: "Job offer not found or already processed" },
        { status: 404 }
      );
    }

    // Update job offer or job notification status
    if (jobNotification) {
      // Update job notification status
      await db.collection("job_notifications").updateOne(
        { _id: jobOffer._id },
        {
          $set: {
            status: "rejected",
            rejectedBy: technician._id.toString(),
            technicianName: technician.name,
            rejectedAt: new Date(),
            rejectionReason: reason || "No reason provided"
          }
        }
      );
    } else {
      // Update job offer status
      await db.collection("jobOffers").updateOne(
        { _id: jobOffer._id },
        {
          $set: {
            status: "rejected",
            technicianId: technician._id.toString(),
            technicianName: technician.name,
            rejectedAt: new Date(),
            rejectionReason: reason || "No reason provided"
          }
        }
      );
    }

    // Update technician's last active timestamp
    await db.collection("technicians").updateOne(
      { _id: technician._id },
      {
        $set: {
          lastActive: new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Create notification for admin
    const adminNotification = {
      recipientType: "admin",
      title: "Job Rejected",
      message: `Technician ${technician.name} has rejected the job for booking #${jobOffer.bookingId}.`,
      reason: reason || "No reason provided",
      technicianId: technician._id.toString(),
      bookingId: jobOffer.bookingId,
      status: "unread",
      createdAt: new Date()
    };

    await db.collection("notifications").insertOne(adminNotification);

    // Find the next available technician
    const nextTechnician = await db.collection("technicians").findOne({
      _id: { $ne: technician._id },
      status: { $in: ["active", "online"] },
      specializations: { $in: jobOffer.serviceTypes || [] }
    });

    // If another technician is available, create a new job offer
    if (nextTechnician) {
      // Create new job offer for the next technician
      const newJobOffer = {
        bookingId: jobOffer.bookingId,
        serviceTypes: jobOffer.serviceTypes,
        customerName: jobOffer.customerName,
        location: jobOffer.location,
        amount: jobOffer.amount,
        status: "pending",
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 1000), // 30 seconds expiry
        previousTechnicianIds: [
          ...(jobOffer.previousTechnicianIds || []),
          technician._id.toString()
        ]
      };

      await db.collection("jobOffers").insertOne(newJobOffer);
    } else {
      // If no other technician is available, update booking status
      const bookingQuery = ObjectId.isValid(jobOffer.bookingId)
        ? { _id: new ObjectId(jobOffer.bookingId) }
        : { bookingId: jobOffer.bookingId };

      await db.collection("bookings").updateOne(
        bookingQuery,
        {
          $set: {
            status: "pending",
            updatedAt: new Date(),
            noTechnicianAvailable: true
          }
        }
      );

      // Create notification for customer
      const booking = await db.collection("bookings").findOne(bookingQuery);

      if (booking) {
        const customerNotification = {
          recipientId: booking.userId || booking.customerEmail,
          recipientType: "customer",
          title: "Technician Unavailable",
          message: `We're sorry, but all technicians are currently busy. We'll assign someone as soon as possible.`,
          bookingId: booking._id.toString(),
          status: "unread",
          createdAt: new Date()
        };

        await db.collection("notifications").insertOne(customerNotification);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Job rejected successfully",
      forwardedToNextTechnician: !!nextTechnician
    });
  } catch (error) {
    console.error("Error rejecting job:", error);
    return NextResponse.json(
      { success: false, message: "Failed to reject job" },
      { status: 500 }
    );
  }
}
