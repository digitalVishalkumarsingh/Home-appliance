import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { services as staticServices } from "@/app/lib/services";

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Get params from context
    const params = await context.params;
    // Get the ID from params
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { message: "Service ID is required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Try to find service in MongoDB
    const service = await db.collection("services").findOne({ id });

    // If service found in MongoDB, return it
    if (service) {
      return NextResponse.json({ service });
    }

    // If not found in MongoDB, try to find in static services
    const staticService = staticServices.find(s => s.id === id);

    if (staticService) {
      return NextResponse.json({ service: staticService });
    }

    // If not found in either source, return 404
    return NextResponse.json(
      { message: "Service not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error fetching service:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
