import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Update service pricing
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
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

    // Get service ID from params
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { message: "Service ID is required" },
        { status: 400 }
      );
    }

    // Parse request body
    const { pricing } = await request.json();

    // Validate pricing data
    if (!pricing || !pricing.basic || !pricing.comprehensive) {
      return NextResponse.json(
        { message: "Invalid pricing data" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Check if service exists
    let service;
    try {
      service = await db.collection("services").findOne({ _id: new ObjectId(id) });
    } catch (error) {
      return NextResponse.json(
        { message: "Invalid service ID format" },
        { status: 400 }
      );
    }

    if (!service) {
      return NextResponse.json(
        { message: "Service not found" },
        { status: 404 }
      );
    }

    // Format pricing data
    const formattedPricing = {
      basic: {
        price: pricing.basic.price.startsWith("₹")
          ? pricing.basic.price
          : `₹${pricing.basic.price}`,
        description: pricing.basic.description
      },
      comprehensive: {
        price: pricing.comprehensive.price.startsWith("₹")
          ? pricing.comprehensive.price
          : `₹${pricing.comprehensive.price}`,
        description: pricing.comprehensive.description
      }
    };

    // Update service pricing
    const result = await db.collection("services").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          pricing: formattedPricing,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Service pricing updated successfully",
    });
  } catch (error) {
    console.error("Error updating service pricing:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
