import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

// Simple technician creation without email complications
export async function POST(request: Request) {
  try {
    console.log("Simple technician creation started");
    
    // Verify admin authentication
    let token;
    try {
      token = getTokenFromRequest(request);
    } catch (tokenError) {
      console.error("Token extraction failed:", tokenError);
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: "No token provided" },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = await verifyToken(token);
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    if (!decoded || (decoded as {role?: string}).role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    // Get technician data
    let technicianData;
    try {
      technicianData = await request.json();
      console.log("Technician data received:", {
        name: technicianData.name,
        email: technicianData.email,
        phone: technicianData.phone
      });
    } catch (parseError) {
      return NextResponse.json(
        { success: false, message: "Invalid request data" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!technicianData.name || !technicianData.email || !technicianData.phone) {
      return NextResponse.json(
        { success: false, message: "Name, email, and phone are required" },
        { status: 400 }
      );
    }

    // Connect to database
    let db;
    try {
      const connection = await connectToDatabase();
      db = connection.db;
      console.log("Database connected successfully");
    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      return NextResponse.json(
        { success: false, message: "Database connection failed" },
        { status: 500 }
      );
    }

    // Check if technician already exists
    try {
      const existingTechnician = await db.collection("technicians").findOne({
        email: technicianData.email
      });

      if (existingTechnician) {
        return NextResponse.json(
          { success: false, message: "Technician with this email already exists" },
          { status: 409 }
        );
      }
    } catch (checkError) {
      console.error("Error checking existing technician:", checkError);
      return NextResponse.json(
        { success: false, message: "Error checking existing technician" },
        { status: 500 }
      );
    }

    // Generate simple password
    const password = "temp123"; // Simple temporary password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create technician object
    const newTechnician = {
      name: technicianData.name.trim(),
      email: technicianData.email.trim().toLowerCase(),
      phone: technicianData.phone.trim(),
      password: hashedPassword,
      role: "technician",
      specializations: technicianData.specializations || [],
      status: technicianData.status || "active",
      availability: technicianData.availability || {
        monday: { available: true, hours: "00:00 - 23:59" },
        tuesday: { available: true, hours: "00:00 - 23:59" },
        wednesday: { available: true, hours: "00:00 - 23:59" },
        thursday: { available: true, hours: "00:00 - 23:59" },
        friday: { available: true, hours: "00:00 - 23:59" },
        saturday: { available: true, hours: "00:00 - 23:59" },
        sunday: { available: true, hours: "00:00 - 23:59" },
      },
      address: technicianData.address || "",
      notes: technicianData.notes || "",
      createdAt: new Date(),
      updatedAt: new Date(),
      accountCreated: true,
    };

    // Insert technician
    let result;
    try {
      result = await db.collection("technicians").insertOne(newTechnician);
      console.log("Technician inserted successfully:", result.insertedId);
    } catch (insertError) {
      console.error("Error inserting technician:", insertError);
      return NextResponse.json(
        { success: false, message: "Failed to create technician" },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Technician created successfully",
      technician: {
        _id: result.insertedId,
        ...newTechnician,
        password: undefined // Don't return password
      },
      temporaryPassword: password, // For testing only
      note: "This is a simplified version. Temporary password: temp123"
    });

  } catch (error) {
    console.error("Unexpected error in simple technician creation:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Simple technician creation endpoint",
    note: "This is a simplified version without email complications",
    usage: "POST with technician data to create a technician with temporary password 'temp123'"
  });
}
