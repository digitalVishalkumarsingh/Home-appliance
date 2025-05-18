import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";

// Get all active discounts
export async function GET(request: Request) {
  try {
    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get current date
    const now = new Date().toISOString();

    // Find all active discounts
    const discounts = await db.collection("discounts").find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).toArray();

    return NextResponse.json({
      success: true,
      discounts
    });
  } catch (error) {
    console.error("Error fetching discounts:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
