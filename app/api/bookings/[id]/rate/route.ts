import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Get booking ID from params
    const resolvedParams = await params;
    const bookingId = resolvedParams.id;
    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "Booking ID is required" },
        { status: 400 }
      );
    }

    // Parse request body
    const { rating, feedback } = await request.json();

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Find booking
    const booking = await db.collection("bookings").findOne({
      $or: [
        { _id: ObjectId.isValid(bookingId) ? new ObjectId(bookingId) : bookingId },
        { bookingId: bookingId }
      ]
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Verify that this user is the owner of the booking
    if (booking.userId.toString() !== decoded.userId.toString()) {
      return NextResponse.json(
        { success: false, message: "You are not authorized to rate this booking" },
        { status: 403 }
      );
    }

    // Check if booking is completed
    if (booking.status !== "completed") {
      return NextResponse.json(
        { success: false, message: "You can only rate completed bookings" },
        { status: 400 }
      );
    }

    // Check if booking is already rated
    if (booking.rating) {
      return NextResponse.json(
        { success: false, message: "You have already rated this booking" },
        { status: 400 }
      );
    }

    // Update booking with rating
    await db.collection("bookings").updateOne(
      {
        $or: [
          { _id: ObjectId.isValid(bookingId) ? new ObjectId(bookingId) : bookingId },
          { bookingId: bookingId }
        ]
      },
      {
        $set: {
          rating,
          feedback: feedback || "",
          ratedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    // Update technician rating
    if (booking.technicianId) {
      // Find technician
      const technician = await db.collection("technicians").findOne({
        _id: ObjectId.isValid(booking.technicianId) ? new ObjectId(booking.technicianId) : booking.technicianId
      });

      if (technician) {
        // Calculate new average rating
        const totalRatings = (technician.totalRatings || 0) + 1;
        const currentRatingSum = (technician.rating || 0) * (technician.totalRatings || 0);
        const newRatingSum = currentRatingSum + rating;
        const newAverageRating = newRatingSum / totalRatings;

        // Update technician
        await db.collection("technicians").updateOne(
          { _id: technician._id },
          {
            $set: {
              rating: parseFloat(newAverageRating.toFixed(1)),
              totalRatings,
              updatedAt: new Date()
            },
            $push: {
              reviews: {
                bookingId: booking._id.toString(),
                rating,
                feedback: feedback || "",
                createdAt: new Date()
              }
            }
          }
        );

        // Create notification for technician
        const technicianNotification = {
          recipientId: technician._id.toString(),
          recipientType: "technician",
          title: "New Rating",
          message: `You received a ${rating}-star rating for your ${booking.service} service.`,
          bookingId: booking._id.toString(),
          status: "unread",
          createdAt: new Date()
        };

        await db.collection("notifications").insertOne(technicianNotification);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Rating submitted successfully",
      rating: {
        bookingId: booking._id.toString(),
        rating,
        feedback: feedback || "",
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error("Error submitting rating:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
