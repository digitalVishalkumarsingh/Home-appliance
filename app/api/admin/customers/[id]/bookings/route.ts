import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Get bookings for a specific customer
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

    const decoded = verifyToken(token);

    if (!decoded || (decoded as {role?: string}).role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Get params from context
    const params = await context.params;
    const customerId = params.id;

    // Validate ObjectId
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(customerId);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Invalid customer ID format" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Find customer by ID to get email and phone
    const customer = await db.collection("users").findOne(
      { _id: objectId, role: "user" },
      { projection: { email: 1, phone: 1 } }
    );

    if (!customer) {
      return NextResponse.json(
        { success: false, message: "Customer not found" },
        { status: 404 }
      );
    }

    // Get all bookings for this customer
    const bookings = await db.collection("bookings")
      .find({
        $or: [
          { userId: customerId },
          { customerEmail: customer.email },
          { customerPhone: customer.phone }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error("Error fetching customer bookings:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
