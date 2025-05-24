import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Get booking details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Find technician
    let technicianQuery: any = {
      $or: [
        { userId: userId },
        { id: userId },
        { email: userId }
      ]
    };
    if (ObjectId.isValid(userId)) {
      technicianQuery.$or.unshift({ _id: new ObjectId(userId) });
    }
    let technician = await db.collection("technicians").findOne(technicianQuery);

    // If technician not found, try to find by user
    if (!technician) {
      console.log(`Technician not found directly for userId: ${userId}, trying to find via user`);

      // Try to find user first
      let user = null;
      if (ObjectId.isValid(userId)) {
        user = await db.collection("users").findOne({
          _id: new ObjectId(userId)
        });
      } else {
        user = await db.collection("users").findOne({
          email: userId
        });
      }

      if (user) {
        // Try to find technician by email
        technician = await db.collection("technicians").findOne({
          email: user.email
        });

        if (technician) {
          // Update technician with userId reference for future lookups
          await db.collection("technicians").updateOne(
            { _id: technician._id },
            { $set: { userId: userId } }
          );
          console.log(`Found technician via user email and updated userId reference`);
        }
      }
    }

    if (!technician) {
      return NextResponse.json(
        { success: false, message: "Technician not found" },
        { status: 404 }
      );
    }

    // Find booking - in Next.js 15, we need to await params before accessing its properties
    const resolvedParams = await params;
    const bookingId = resolvedParams.id;
    console.log(`Looking for booking with ID: ${bookingId}`);

    // First try to find booking assigned to this technician
    let bookingQuery: any = {
      $or: []
    };
    if (ObjectId.isValid(bookingId)) {
      bookingQuery.$or.push({ _id: new ObjectId(bookingId) });
    }
    bookingQuery.$or.push({ bookingId: bookingId });

    bookingQuery.technicianId = technician._id.toString();

    let booking = await db.collection("bookings").findOne(bookingQuery);

    // If not found, try different approaches
    if (!booking) {
      // Check if this is an admin or super technician who can view all bookings
      if (technician.role === 'admin' || technician.isSuper === true) {
        console.log('Technician is admin or super, looking for booking without technician restriction');
        booking = await db.collection("bookings").findOne({
          $or: [
            ...(ObjectId.isValid(bookingId) ? [{ _id: new ObjectId(bookingId) }] : []),
            { bookingId: bookingId }
          ]
        });
      }
      // If still not found, try looking for unassigned bookings
      else {
        console.log('Checking for unassigned bookings');
        booking = await db.collection("bookings").findOne({
          $or: [
            // Booking matches by _id or bookingId and is unassigned
            {
              $and: [
                {
                  $or: [
                    ...(ObjectId.isValid(bookingId) ? [{ _id: new ObjectId(bookingId) }] : []),
                    { bookingId: bookingId }
                  ]
                },
                {
                  $or: [
                    { technicianId: { $exists: false } },
                    { technicianId: null },
                    { technicianId: "" }
                  ]
                }
              ]
            }
          ]
        });

        if (booking) {
          console.log('Found unassigned booking that can be viewed by technician');
        }
      }
    }

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found or not assigned to you" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error("Error fetching booking details:", error);

    // Return a more detailed error message in development
    const errorMessage = process.env.NODE_ENV === 'development'
      ? `Failed to fetch booking details: ${error instanceof Error ? error.message : String(error)}`
      : "Failed to fetch booking details";

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
