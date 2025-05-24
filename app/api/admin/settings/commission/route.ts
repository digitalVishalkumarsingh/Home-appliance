import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";

// Get current commission rate
export async function GET(request: Request) {
  try {
    // Verify authentication (optional for GET - can be public)
    const token = getTokenFromRequest(request);
    
    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get commission settings
    const settings = await db.collection("settings").findOne({ key: "commission" });

    // Return current commission rate (default to 30% if not set)
    return NextResponse.json({
      success: true,
      commissionRate: settings?.value || 30,
      lastUpdated: settings?.updatedAt || null
    });
  } catch (error) {
    console.error("Error fetching commission rate:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch commission rate" },
      { status: 500 }
    );
  }
}

// Update commission rate
export async function POST(request: Request) {
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

    // Get commission rate from request body
    const { commissionRate } = await request.json();

    // Validate commission rate
    if (typeof commissionRate !== "number" || commissionRate < 0 || commissionRate > 100) {
      return NextResponse.json(
        { success: false, message: "Invalid commission rate. Must be a number between 0 and 100." },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Update commission settings
    const now = new Date();
    await db.collection("settings").updateOne(
      { key: "commission" },
      { 
        $set: { 
          value: commissionRate,
          updatedAt: now,
          updatedBy: (decoded as {userId?: string}).userId || "admin"
        } 
      },
      { upsert: true }
    );

    // Create an admin activity log
    await db.collection("adminActivity").insertOne({
      action: "update_commission_rate",
      adminId: (decoded as {userId?: string}).userId,
      details: {
        oldRate: await db.collection("settings").findOne({ key: "commission" }).then(doc => doc?.value),
        newRate: commissionRate
      },
      createdAt: now
    });

    return NextResponse.json({
      success: true,
      message: "Commission rate updated successfully",
      commissionRate,
      updatedAt: now
    });
  } catch (error) {
    console.error("Error updating commission rate:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update commission rate" },
      { status: 500 }
    );
  }
}

// Get commission history
export async function PUT(request: Request) {
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

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get commission history from admin activity log
    const history = await db.collection("adminActivity")
      .find({ action: "update_commission_rate" })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    return NextResponse.json({
      success: true,
      history: history.map(item => ({
        oldRate: item.details.oldRate,
        newRate: item.details.newRate,
        updatedAt: item.createdAt,
        adminId: item.adminId
      }))
    });
  } catch (error) {
    console.error("Error fetching commission history:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch commission history" },
      { status: 500 }
    );
  }
}
