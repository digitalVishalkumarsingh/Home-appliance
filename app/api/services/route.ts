import { NextResponse } from "next/server";
import { services as staticServices } from "@/app/lib/services";
import { connectToDatabase } from "@/app/lib/mongodb";

export async function GET() {
  try {
    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get all services from the database
    const dbServices = await db
      .collection("services")
      .find({ isActive: true })
      .sort({ title: 1 })
      .toArray();

    // If there are services in the database, return them
    if (dbServices && dbServices.length > 0) {
      console.log(`Returning ${dbServices.length} services from database`);
      return NextResponse.json({ 
        services: dbServices,
        source: "database" 
      });
    }

    // Otherwise, return the static services
    console.log("No services found in database, returning static services");
    return NextResponse.json({ 
      services: staticServices,
      source: "static" 
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    
    // Fallback to static services in case of database error
    console.log("Database error, falling back to static services");
    return NextResponse.json({ 
      services: staticServices,
      source: "static-fallback" 
    });
  }
}
