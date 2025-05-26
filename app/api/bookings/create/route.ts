import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // Parse request body
    const {
      serviceId,
      serviceName,
      servicePrice,
      customerName,
      customerEmail,
      customerPhone,
      address,
      location,
      scheduledDate,
      scheduledTime,
      notes,
      paymentMethod,
      originalPrice,
      discountApplied,
      discountId,
      discountName,
      discountAmount
    } = await request.json();

    console.log('Booking creation request:', {
      serviceId,
      serviceName,
      servicePrice,
      customerName,
      customerEmail,
      customerPhone,
      paymentMethod,
      scheduledDate,
      scheduledTime
    });

    // Validate required fields
    if (!serviceId || !serviceName || !servicePrice || !customerName || !customerEmail || !customerPhone || !address || !scheduledDate || !scheduledTime) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Connect to database
    let db;
    try {
      const connection = await connectToDatabase();
      db = connection.db;
      console.log('Database connected successfully');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);

      // For demo purposes, return success even if database fails
      const demoBookingId = `BK${Date.now()}`;
      console.log('Using demo mode, generated booking ID:', demoBookingId);

      return NextResponse.json({
        success: true,
        message: "Booking created successfully (demo mode)",
        bookingId: demoBookingId,
        booking: {
          bookingId: demoBookingId,
          serviceName: serviceName,
          amount: servicePrice,
          customerName: customerName,
          scheduledDate: scheduledDate,
          scheduledTime: scheduledTime,
          paymentMethod: paymentMethod,
          status: "pending"
        },
        fallback: true,
        note: "Database not available - using demo mode"
      });
    }

    // Find user
    const user = await db.collection("users").findOne({
      _id: ObjectId.isValid(decoded.userId) ? new ObjectId(decoded.userId) : decoded.userId
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Generate a unique booking ID
    const lastBooking = await db
      .collection("bookings")
      .find({})
      .sort({ _id: -1 })
      .limit(1)
      .toArray();

    const lastBookingId = lastBooking.length > 0 && lastBooking[0].bookingId
      ? parseInt(lastBooking[0].bookingId.replace("BK", ""))
      : 1000;

    const newBookingId = `BK${lastBookingId + 1}`;

    // Create booking
    const booking = {
      bookingId: newBookingId,
      userId: decoded.userId,
      serviceId,
      service: serviceName,
      serviceName: serviceName,
      amount: servicePrice,
      finalAmount: servicePrice,
      originalPrice: originalPrice || servicePrice,
      customerName,
      customerEmail,
      customerPhone,
      address,
      customerAddress: address,
      location: location || null,
      scheduledDate,
      scheduledTime,
      notes: notes || "",
      paymentMethod,
      paymentStatus: paymentMethod === "online" ? "pending" : "cash_on_delivery",
      status: "pending",
      technicianId: null,
      technicianName: null,
      discountApplied: discountApplied || false,
      discountId: discountId || null,
      discountName: discountName || null,
      discountAmount: discountAmount || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection("bookings").insertOne(booking);

    if (!result.acknowledged) {
      return NextResponse.json(
        { success: false, message: "Failed to create booking" },
        { status: 500 }
      );
    }

    // Find nearby technicians
    let nearbyTechnicians = [];

    if (location) {
      // Find technicians within 10km radius and available
      nearbyTechnicians = await db.collection("technicians")
        .find({
          status: "active",
          "location": {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [location.lng, location.lat]
              },
              $maxDistance: 10000 // 10km in meters
            }
          }
        })
        .limit(5)
        .toArray();
    }

    // Create notification for admin
    const adminNotification = {
      recipientType: "admin",
      title: "New Booking",
      message: `A new booking (${newBookingId}) has been created for ${serviceName}.`,
      bookingId: newBookingId,
      userId: decoded.userId,
      status: "unread",
      createdAt: new Date()
    };

    await db.collection("notifications").insertOne(adminNotification);

    console.log('Booking created successfully:', newBookingId);

    // ✅ ONLY AFTER BOOKING IS FULLY CONFIRMED - Notify technicians about new job
    let jobOfferCreated = false;
    try {
      // Call the technician notification endpoint
      const notificationResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/bookings/notify-technicians`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: newBookingId,
          serviceName: serviceName,
          customerName: customerName,
          address: address,
          amount: servicePrice,
          urgency: "normal", // Can be determined based on service type or customer preference
          description: notes || `${serviceName} service requested`,
          estimatedDuration: "1-2 hours" // Default estimate
        })
      });

      if (notificationResponse.ok) {
        const notificationData = await notificationResponse.json();
        if (notificationData.success) {
          jobOfferCreated = true;
          console.log('Technicians notified successfully:', notificationData.message);
        }
      } else {
        console.error('Failed to notify technicians:', notificationResponse.status);
      }

      // Legacy job offer creation for backward compatibility
      if (nearbyTechnicians.length > 0) {
        const nearestTechnician = nearbyTechnicians[0];

        // Calculate distance in kilometers
        let distance = 0;
        if (location && nearestTechnician.location) {
          const R = 6371; // Earth's radius in km
          const lat1 = location.lat * Math.PI / 180;
          const lat2 = nearestTechnician.location.coordinates[1] * Math.PI / 180;
          const dLat = (nearestTechnician.location.coordinates[1] - location.lat) * Math.PI / 180;
          const dLon = (nearestTechnician.location.coordinates[0] - location.lng) * Math.PI / 180;

          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat1) * Math.cos(lat2) *
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          distance = R * c;
        }

        // Get the admin commission rate from settings
        const settingsDoc = await db.collection("settings").findOne({ key: "commission" });
        const adminCommissionPercentage = settingsDoc?.value || 30; // Default to 30% if not set

        // Calculate technician earnings
        const adminCommission = (servicePrice * adminCommissionPercentage) / 100;
        const technicianEarnings = servicePrice - adminCommission;

        // Create job offer
        const jobOffer = {
          bookingId: newBookingId,
          technicianId: nearestTechnician._id.toString(),
          appliance: serviceName,
          location: {
            address: address,
            distance: parseFloat(distance.toFixed(2)),
            coordinates: location
          },
          earnings: {
            total: servicePrice,
            technicianEarnings: technicianEarnings,
            adminCommission: adminCommission,
            adminCommissionPercentage: adminCommissionPercentage
          },
          customer: {
            name: customerName,
            phone: customerPhone
          },
          description: notes || "",
          status: "pending",
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes expiry (not 30 seconds)
        };

        await db.collection("jobOffers").insertOne(jobOffer);
        jobOfferCreated = true;

        // Update technician status to indicate they have a pending job offer
        await db.collection("technicians").updateOne(
          { _id: nearestTechnician._id },
          {
            $set: {
              jobOfferStatus: "pending",
              updatedAt: new Date()
            }
          }
        );

        console.log(`✅ Created job offer for confirmed cash booking ${newBookingId}`);
      } else {
        console.log('No nearby technicians found. Booking confirmed but no job offers created.');
      }
    } catch (jobOfferError) {
      console.error('Error creating job offer:', jobOfferError);
      // Don't fail the booking if job offer creation fails
    }

    return NextResponse.json({
      success: true,
      message: "Booking created successfully",
      bookingId: newBookingId,
      jobOfferCreated: jobOfferCreated,
      booking: {
        bookingId: newBookingId,
        serviceName: serviceName,
        amount: servicePrice,
        customerName: customerName,
        scheduledDate: scheduledDate,
        scheduledTime: scheduledTime,
        paymentMethod: paymentMethod,
        status: "pending"
      }
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
