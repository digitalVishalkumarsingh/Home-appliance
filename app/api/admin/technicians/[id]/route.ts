import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Get a specific technician
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
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

    // Get technician ID from URL params
    const { id } = await context.params;

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Find technician by ID
    const technician = await db.collection("technicians").findOne({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : id
    });

    if (!technician) {
      return NextResponse.json(
        { success: false, message: "Technician not found" },
        { status: 404 }
      );
    }

    // Get technician's assigned bookings
    const bookings = await db.collection("bookings").find({
      technician: technician.name
    }).toArray();

    // Count completed bookings
    const completedBookings = bookings.filter(booking => booking.status === "completed").length;

    // Return technician with booking stats
    return NextResponse.json({
      success: true,
      technician: {
        ...technician,
        stats: {
          totalBookings: bookings.length,
          completedBookings,
          pendingBookings: bookings.filter(booking => booking.status === "pending").length,
          confirmedBookings: bookings.filter(booking => booking.status === "confirmed").length,
        }
      }
    });
  } catch (error) {
    console.error("Error fetching technician:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch technician" },
      { status: 500 }
    );
  }
}

// Update a technician
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
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

    // Get technician ID from URL params
    const { id } = await context.params;

    // Get update data from request body
    const updateData = await request.json();

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Find technician by ID
    const technician = await db.collection("technicians").findOne({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : id
    });

    if (!technician) {
      return NextResponse.json(
        { success: false, message: "Technician not found" },
        { status: 404 }
      );
    }

    // Prepare update object
    const update = {
      ...updateData,
      updatedAt: new Date()
    };

    // Update technician in database
    await db.collection("technicians").updateOne(
      { _id: ObjectId.isValid(id) ? new ObjectId(id) : id },
      { $set: update }
    );

    // Return updated technician
    return NextResponse.json({
      success: true,
      message: "Technician updated successfully",
      technician: {
        ...technician,
        ...update
      }
    });
  } catch (error) {
    console.error("Error updating technician:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update technician" },
      { status: 500 }
    );
  }
}

// Delete a technician
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
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

    // Get technician ID from URL params
    const { id } = await context.params;

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Check if technician has assigned bookings
    const assignedBookings = await db.collection("bookings").countDocuments({
      technician: { $regex: new RegExp(id, "i") }
    });

    if (assignedBookings > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot delete technician with assigned bookings. Please reassign bookings first."
        },
        { status: 400 }
      );
    }

    // Delete technician from database
    const result = await db.collection("technicians").deleteOne({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : id
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Technician not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Technician deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting technician:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete technician" },
      { status: 500 }
    );
  }
}
