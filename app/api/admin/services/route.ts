import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Get all services
export async function GET(request: Request) {
  try {
    // Verify admin authentication
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded || (decoded as {role?: string}).role !== "admin") {
      return NextResponse.json(
        { message: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get all services
    const services = await db
      .collection("services")
      .find({})
      .sort({ title: 1 })
      .toArray();

    return NextResponse.json({ services });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create a new service
export async function POST(request: Request) {
  try {
    // Verify admin authentication
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded || (decoded as {role?: string}).role !== "admin") {
      return NextResponse.json(
        { message: "Unauthorized access" },
        { status: 403 }
      );
    }

    const serviceData = await request.json();

    // Validate service data
    if (!serviceData.title || !serviceData.id || !serviceData.desc) {
      return NextResponse.json(
        { message: "Missing required service information" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Check if service with same ID already exists
    const existingService = await db.collection("services").findOne({ id: serviceData.id });
    if (existingService) {
      return NextResponse.json(
        { message: "Service with this ID already exists" },
        { status: 400 }
      );
    }

    // Set default pricing if not provided
    if (!serviceData.pricing) {
      serviceData.pricing = {
        basic: {
          price: "₹599",
          description: "Basic service package"
        },
        comprehensive: {
          price: "₹999",
          description: "Comprehensive service package"
        }
      };
    }

    // Set default image if not provided
    if (!serviceData.img) {
      serviceData.img = "/placeholder-service.jpg";
    }

    // Add timestamps
    serviceData.createdAt = new Date();
    serviceData.updatedAt = new Date();
    serviceData.isActive = true;

    // Insert new service
    const result = await db.collection("services").insertOne(serviceData);

    return NextResponse.json({
      message: "Service created successfully",
      serviceId: result.insertedId,
    });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
