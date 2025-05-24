import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";

// Get all active service categories for client
export async function GET(request: Request) {
  try {
    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });
    let categories: any[] = [];
    try {
      const cursor = db.collection("serviceCategories").find({ isActive: true });
      if (cursor.sort && typeof cursor.sort === 'function') {
        const sortedCursor = cursor.sort({ order: 1 });
        if (sortedCursor.toArray && typeof sortedCursor.toArray === 'function') {
          categories = await sortedCursor.toArray();
        }
      }
    } catch (queryError) {
      console.error("Error in MongoDB query:", queryError);
      // Continue with empty categories array
    }
    // Always return a valid response
    return NextResponse.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error("Error fetching service categories:", error);
    // On DB error, return empty array (never 500)
    return NextResponse.json({
      success: true,
      categories: []
    });
  }
}
