import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";
import { z } from "zod";

// Validation schema for request body
const SaveNotesSchema = z.object({
  notes: z.string().min(1, "Notes are required").max(500, "Notes must be 500 characters or less").trim(),
}).strict();

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await connectToDatabase({ timeoutMs: 10000 });
  const { db, client } = session;

  try {
    // Verify authentication
    const { NextRequest } = require("next/server");
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

    // Validate request body
    const body = await request.json();
    const parsedBody = SaveNotesSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { success: false, message: `Invalid input: ${parsedBody.error.message}` },
        { status: 400 }
      );
    }
    const { notes } = parsedBody.data;

    // Validate booking ID
    const bookingId = params.id;
    if (!ObjectId.isValid(bookingId)) {
      return NextResponse.json(
        { success: false, message: "Invalid booking ID" },
        { status: 400 }
      );
    }

    // Verify user role
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, message: "Invalid user ID" },
        { status: 400 }
      );
    }
    const user = await db.collection("users").findOne({
      _id: new ObjectId(userId),
    });
    if (!user || user.role !== "technician") {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Technician role required" },
        { status: 403 }
      );
    }

    // Find technician
    const technician = await db.collection("technicians").findOne({ userId });
    if (!technician) {
      return NextResponse.json(
        { success: false, message: "Technician profile not found" },
        { status: 404 }
      );
    }

    // Find booking
    const booking = await db.collection("bookings").findOne({
      _id: new ObjectId(bookingId),
      technicianId: technician._id.toString(),
      status: { $in: ["assigned", "in_progress"] },
    });
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found, not assigned to you, or not editable" },
        { status: 404 }
      );
    }

    // Update booking notes
    const now = new Date();
    const result = await db.collection("bookings").updateOne(
      { _id: booking._id },
      {
        $set: {
          notes,
          updatedAt: now,
        },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Failed to update booking notes" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notes saved successfully",
      booking: {
        _id: booking._id.toString(),
        notes,
        updatedAt: now.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error saving booking notes:", error);
    const message =
      error.message.includes("not found") || error.message.includes("Invalid booking ID")
        ? error.message
        : error.message.includes("not editable")
          ? error.message
          : error.name === "MongoTimeoutError"
            ? "Database connection timed out"
            : error.name === "MongoServerError" && error.code === 11000
              ? "Database error: Duplicate key"
              : "Failed to save booking notes";
    return NextResponse.json(
      { success: false, message },
      {
        status:
          error.message.includes("not found") || error.message.includes("not editable")
            ? 404
            : error.message.includes("Invalid booking ID")
              ? 400
              : error.name === "MongoTimeoutError"
                ? 504
                : error.name === "MongoServerError" && error.code === 11000
                  ? 409
                  : 500,
      }
    );
  } finally {
    await client.close();
  }
}