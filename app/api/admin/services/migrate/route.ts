import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { services } from "@/app/lib/services";

// Migrate services from static file to MongoDB
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

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Check if services collection already has data
    const existingServicesCount = await db.collection("services").countDocuments();
    
    if (existingServicesCount > 0) {
      return NextResponse.json(
        { message: "Services collection already has data. Migration skipped." },
        { status: 200 }
      );
    }

    // Prepare services data with pricing
    const servicesWithPricing = services.map(service => {
      // Add default pricing if not present
      if (!service.pricing) {
        service.pricing = {
          basic: {
            price: "₹599",
            description: "Basic service package including diagnosis and minor repairs"
          },
          comprehensive: {
            price: "₹999",
            description: "Comprehensive service package including diagnosis, repairs, and maintenance"
          }
        };
      }

      // Add timestamps and active status
      return {
        ...service,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };
    });

    // Insert services into MongoDB
    const result = await db.collection("services").insertMany(servicesWithPricing);

    return NextResponse.json({
      message: "Services migrated successfully",
      count: result.insertedCount
    });
  } catch (error) {
    console.error("Error migrating services:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
