import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";

export async function GET() {
  try {
    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Get all services from the database
    let dbServices: any[] = [];
    try {
      const cursor = db.collection("services").find({ isActive: true });
      if (cursor.sort && typeof cursor.sort === 'function') {
        const sortedCursor = cursor.sort({ title: 1 });
        if (sortedCursor.toArray && typeof sortedCursor.toArray === 'function') {
          dbServices = await sortedCursor.toArray();
        }
      }
    } catch (queryError) {
      console.error("Error in MongoDB query:", queryError);
      // Continue with empty dbServices array
    }

    // Only return real DB data or empty array
    return NextResponse.json({
      services: dbServices
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    // On DB error, return empty array
    return NextResponse.json({
      services: []
    });
  }
}
