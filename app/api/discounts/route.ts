import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";

// Get all active discounts
export async function GET(request: Request) {
  try {
    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Get current date
    const now = new Date();

    // Find all active discounts
    let discounts: any[] = [];
    try {
      const cursor = db.collection("discounts").find({
        isActive: true,
        validFrom: { $lte: now },
        validTo: { $gte: now }
      });

      // Check if toArray method exists and is a function
      if (cursor.toArray && typeof cursor.toArray === 'function') {
        discounts = await cursor.toArray();
      }
    } catch (queryError) {
      console.error("Error in MongoDB query:", queryError);
      // Continue with empty discounts array
    }

    return NextResponse.json({
      success: true,
      discounts
    });
  } catch (error) {
    console.error("Error fetching discounts:", error);

    // On DB error, return empty array (no mock data)
    return NextResponse.json({
      success: true,
      discounts: []
    });
  }
}
