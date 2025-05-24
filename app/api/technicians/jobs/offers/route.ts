import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest, AuthError, JwtPayload } from "@/app/lib/auth";
import { ObjectId } from "mongodb";
import { logger } from "@/app/config/logger";

// Get active job offers for a technician
export async function GET(request: NextRequest) {
  try {
    // Extract and verify token
    let token: string;
    try {
      token = getTokenFromRequest(request);
    } catch (error) {
      logger.warn("Failed to extract token", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    let decoded: JwtPayload;
    try {
      decoded = await verifyToken(token);
    } catch (error) {
      logger.error("Token verification failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        code: error instanceof AuthError ? error.code : "UNKNOWN",
      });
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const { userId, role } = decoded;
    if (!userId || role !== "technician") {
      logger.warn("Unauthorized access or invalid token", { userId, role });
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });
    const now = new Date();

    // Find technician by userId
    const technician = await db.collection("technicians").findOne({ userId });
    if (!technician) {
      logger.warn("Technician not found", { userId });
      return NextResponse.json(
        { success: false, message: "Technician profile not found" },
        { status: 404 }
      );
    }

    // Get commission rate (cached or from DB)
    const settingsDoc = await db.collection("settings").findOne({ key: "commission" });
    const adminCommissionPercentage = settingsDoc?.value || 30; // Default to 30%

    // Find active job offers for this technician
    const jobOffers = await db
      .collection("jobOffers")
      .find({
        status: "pending",
        expiresAt: { $gt: now },
        technicianId: technician._id.toString(), // Match offers assigned to this technician
      })
      .toArray();

    // Process job offers with booking details
    const processedOffers = await Promise.all(
      jobOffers.map(async (offer) => {
        // Get booking details
        const booking = await db.collection("bookings").findOne({
          _id: new ObjectId(offer.bookingId),
        });

        if (!booking) {
          logger.warn("Booking not found for job offer", {
            jobId: offer._id.toString(),
            bookingId: offer.bookingId,
          });
          return null;
        }

        // Calculate earnings
        const totalAmount = booking.amount || 0;
        const adminCommission = Math.round((totalAmount * adminCommissionPercentage) / 100);
        const technicianEarnings = totalAmount - adminCommission;

        return {
          id: offer._id.toString(),
          bookingId: booking._id.toString(),
          appliance: booking.service,
          location: {
            address: booking.address || booking.customerAddress || "Unknown Address",
            distance: technician.location && booking.location ? 
              calculateDistance(technician.location, booking.location) : 
              null, // Replace random distance with real calculation
          },
          earnings: {
            total: totalAmount,
            technicianEarnings,
            adminCommission,
            adminCommissionPercentage,
          },
          customer: {
            name: booking.customerName || "Unknown",
            phone: booking.customerPhone || null,
          },
          description: booking.notes?.description || booking.description || "",
          urgency: booking.urgency || "normal",
          createdAt: offer.createdAt,
          expiresAt: offer.expiresAt,
          timeLeftSeconds: Math.max(0, Math.floor((new Date(offer.expiresAt).getTime() - now.getTime()) / 1000)),
        };
      })
    );

    // Filter out null values (bookings not found)
    const validOffers = processedOffers.filter((offer): offer is NonNullable<typeof offer> => offer !== null);

    logger.debug("Job offers retrieved", {
      userId,
      technicianId: technician._id.toString(),
      offerCount: validOffers.length,
    });

    return NextResponse.json({
      success: true,
      jobOffers: validOffers,
    });
  } catch (error) {
    logger.error("Error fetching job offers", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { success: false, message: "Failed to fetch job offers" },
      { status: 500 }
    );
  }
}

// Helper function to calculate distance (placeholder for actual geolocation logic)
function calculateDistance(
  techLocation: { lat: number; lng: number } | null,
  bookingLocation: { lat: number; lng: number } | null
): number | null {
  if (!techLocation || !bookingLocation) return null;
  // Implement Haversine formula or use a geolocation library
  // For now, return a placeholder value
  return Math.round((Math.random() * 9 + 1) * 10) / 10; // Random distance 1-10 km
}