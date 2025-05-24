import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Utility function to extract token from Authorization header
export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    console.log("No Authorization header found");
    return null;
  }
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "");
  }
  console.log("Invalid Authorization header format");
  return null;
}

// Get all saved services for a user
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

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const userId = decoded.userId;
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID not found in token" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Get user's saved services
    const savedServices = await db.collection("savedServices").findOne({
      userId,
    });

    if (!savedServices) {
      return NextResponse.json({
        success: true,
        savedServices: [],
      });
    }

    // Get the actual service details for each saved service ID
    const serviceIds = savedServices.serviceIds || [];
    const services = await db
      .collection("services")
      .find({
        _id: { $in: serviceIds.map((id: string) => new ObjectId(id)) },
      })
      .toArray();

    return NextResponse.json({
      success: true,
      savedServices: services,
    });
  } catch (error) {
    console.error("Error fetching saved services:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Add a service to saved services
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

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const userId = decoded.userId;
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID not found in token" },
        { status: 400 }
      );
    }

    // Parse request body
    const { serviceId } = await request.json();
    if (!serviceId) {
      return NextResponse.json(
        { success: false, message: "Service ID is required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Check if the service exists
    const service = await db.collection("services").findOne({
      _id: new ObjectId(serviceId),
    });

    if (!service) {
      return NextResponse.json(
        { success: false, message: "Service not found" },
        { status: 404 }
      );
    }

    // Add service to saved services
    const result = await db.collection("savedServices").updateOne(
      { userId },
      {
        $addToSet: { serviceIds: serviceId },
        $setOnInsert: {
          userId,
          createdAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "Service saved successfully",
      updated: result.modifiedCount > 0,
      created: result.upsertedCount > 0,
    });
  } catch (error) {
    console.error("Error saving service:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Remove a service from saved services
export async function DELETE(request: Request) {
  try {
    // Verify user authentication
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const userId = decoded.userId;
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID not found in token" },
        { status: 400 }
      );
    }

    // Get the service ID from the URL query parameter
    const url = new URL(request.url);
    const serviceId = url.searchParams.get("serviceId");
    if (!serviceId) {
      return NextResponse.json(
        { success: false, message: "Service ID is required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Check if the document exists for the user
    const savedServices = await db.collection("savedServices").findOne({ userId });
    if (!savedServices) {
      console.log(`No saved services found for userId: ${userId}`);
      return NextResponse.json(
        { success: false, message: "No saved services found for user" },
        { status: 404 }
      );
    }

    // Validate serviceId exists in savedServices
    if (!savedServices.serviceIds.includes(serviceId)) {
      console.log(`Service ID ${serviceId} not found in user's saved services`);
      return NextResponse.json(
        { success: false, message: "Service not found in saved services" },
        { status: 404 }
      );
    }

    // Remove service from saved services
    const result = await db.collection("savedServices").updateOne(
      { userId },
      {
        // $pull: { serviceIds: serviceId },
      }
    );

    if (result.modifiedCount === 0) {
      console.log(`Failed to remove serviceId: ${serviceId} for userId: ${userId}`);
      return NextResponse.json(
        { success: false, message: "Service not found in saved services" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Service removed from saved services",
    });
  } catch (error) {
    console.error("Error removing saved service:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}