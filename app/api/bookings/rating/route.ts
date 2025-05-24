import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Submit a rating for a booking
export async function POST(request: Request) {
  try {
    // Verify user authentication
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const userId = (decoded as { userId?: string }).userId;
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // Get rating data from request body
    const { bookingId, rating, comment } = await request.json();

    // Validate input
    if (!bookingId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: "Invalid rating data. Rating must be between 1 and 5." },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Find the booking
    const booking = await db.collection("bookings").findOne({
      _id: ObjectId.isValid(bookingId) ? new ObjectId(bookingId) : bookingId,
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Check if the booking belongs to the user
    if (booking.userId.toString() !== userId && booking.userId !== userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: You can only rate your own bookings" },
        { status: 403 }
      );
    }

    // Check if the booking is completed
    if (booking.status !== "completed") {
      return NextResponse.json(
        { success: false, message: "You can only rate completed bookings" },
        { status: 400 }
      );
    }

    // Check if the booking has already been rated
    if (booking.rating) {
      return NextResponse.json(
        { success: false, message: "This booking has already been rated" },
        { status: 400 }
      );
    }

    // Find the technician
    const technicianId = booking.technicianId;
    if (!technicianId) {
      return NextResponse.json(
        { success: false, message: "No technician assigned to this booking" },
        { status: 400 }
      );
    }

    const technician = await db.collection("technicians").findOne({
      _id: ObjectId.isValid(technicianId) ? new ObjectId(technicianId) : technicianId,
    });

    if (!technician) {
      return NextResponse.json(
        { success: false, message: "Technician not found" },
        { status: 404 }
      );
    }

    // Create a new rating document
    const ratingData = {
      bookingId: ObjectId.isValid(bookingId) ? new ObjectId(bookingId) : bookingId,
      userId: ObjectId.isValid(userId) ? new ObjectId(userId) : userId,
      technicianId: ObjectId.isValid(technicianId) ? new ObjectId(technicianId) : technicianId,
      rating,
      comment: comment || "",
      service: booking.service,
      createdAt: new Date(),
    };

    // Insert the rating
    await db.collection("ratings").insertOne(ratingData);

    // Update the booking with the rating
    await db.collection("bookings").updateOne(
      { _id: ObjectId.isValid(bookingId) ? new ObjectId(bookingId) : bookingId },
      { $set: { rating, ratedAt: new Date() } }
    );

    // Update technician's average rating
    const allTechnicianRatings = await db.collection("ratings").find({
      technicianId: ObjectId.isValid(technicianId) ? new ObjectId(technicianId) : technicianId,
    }).toArray();

    const totalRating = allTechnicianRatings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / allTechnicianRatings.length;
    const ratingCount = allTechnicianRatings.length;

    await db.collection("technicians").updateOne(
      { _id: ObjectId.isValid(technicianId) ? new ObjectId(technicianId) : technicianId },
      { 
        $set: { 
          averageRating,
          ratingCount,
          updatedAt: new Date()
        } 
      }
    );

    return NextResponse.json({
      success: true,
      message: "Rating submitted successfully",
      rating: ratingData
    });
  } catch (error) {
    console.error("Error submitting rating:", error);
    return NextResponse.json(
      { success: false, message: "Failed to submit rating" },
      { status: 500 }
    );
  }
}

// Get ratings for a booking
export async function GET(request: Request) {
  try {
    // Verify user authentication
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // Get bookingId from URL
    const url = new URL(request.url);
    const bookingId = url.searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json(
        { success: false, message: "Booking ID is required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Find the rating
    const rating = await db.collection("ratings").findOne({
      bookingId: ObjectId.isValid(bookingId) ? new ObjectId(bookingId) : bookingId,
    });

    if (!rating) {
      return NextResponse.json(
        { success: false, message: "Rating not found for this booking" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      rating
    });
  } catch (error) {
    console.error("Error fetching rating:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch rating" },
      { status: 500 }
    );
  }
}
