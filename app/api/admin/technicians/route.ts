import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";
import { Technician, createTechnician } from "@/app/models/technician";
import bcrypt from "bcryptjs";
import { generateRandomPassword } from "@/app/utils/passwordGenerator";
import { sendTechnicianCredentialsEmail } from "@/app/lib/email";

// Get all technicians
export async function GET(request: Request) {
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

    // Parse query parameters
    const url = new URL(request.url);
    const searchQuery = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";
    const specialization = url.searchParams.get("specialization") || "";
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const skip = parseInt(url.searchParams.get("skip") || "0", 10);
    const sort = url.searchParams.get("sort") || "name";
    const order = url.searchParams.get("order") || "asc";

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Build query
    const query: any = {};

    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: "i" } },
        { email: { $regex: searchQuery, $options: "i" } },
        { phone: { $regex: searchQuery, $options: "i" } },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (specialization) {
      query.specializations = specialization;
    }

    // Count total documents
    const total = await db.collection("technicians").countDocuments(query);

    // Get technicians with pagination and sorting
    const technicians = await db
      .collection("technicians")
      .find(query)
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      success: true,
      technicians,
      pagination: {
        total,
        limit,
        skip,
        hasMore: total > skip + limit,
      },
    });
  } catch (error) {
    console.error("Error fetching technicians:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch technicians" },
      { status: 500 }
    );
  }
}

// Create a new technician
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

    // Get technician data from request body
    const technicianData = await request.json();

    // Validate required fields
    if (!technicianData.name || !technicianData.email || !technicianData.phone) {
      return NextResponse.json(
        { success: false, message: "Name, email, and phone are required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Check if technician with same email or phone already exists
    const existingTechnician = await db.collection("technicians").findOne({
      $or: [
        { email: technicianData.email },
        { phone: technicianData.phone }
      ]
    });

    if (existingTechnician) {
      return NextResponse.json(
        { success: false, message: "Technician with this email or phone already exists" },
        { status: 400 }
      );
    }

    // Check if user with same email already exists
    const existingUser = await db.collection("users").findOne({
      email: technicianData.email
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Generate a random password for the technician
    const password = generateRandomPassword(10, true, true, true, false);

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user account for technician
    const userResult = await db.collection("users").insertOne({
      name: technicianData.name,
      email: technicianData.email,
      phone: technicianData.phone,
      password: hashedPassword,
      role: "technician",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create new technician object with default values and link to user account
    const newTechnician = createTechnician({
      ...technicianData,
      userId: userResult.insertedId,
      accountCreated: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Insert technician into database
    const result = await db.collection("technicians").insertOne(newTechnician);

    // Send email with login credentials to technician
    let emailSent = false;
    try {
      console.log("Attempting to send credentials email for new technician:", technicianData.email);

      emailSent = await sendTechnicianCredentialsEmail({
        name: technicianData.name,
        email: technicianData.email,
        password: password, // Send the unhashed password
        phone: technicianData.phone
      });

      console.log("Email sending result:", emailSent);
    } catch (emailError) {
      console.error("Error sending technician credentials email:", emailError);
      console.error("Error details:", {
        error: emailError instanceof Error ? emailError.message : "Unknown error",
        stack: emailError instanceof Error ? emailError.stack : undefined,
        email: technicianData.email
      });
      // Continue even if email fails
    }

    // Store the password temporarily for display in the response
    // This is for debugging purposes and should be removed in production
    const tempPassword = password;

    return NextResponse.json({
      success: true,
      message: "Technician created successfully" + (emailSent ? " and login credentials sent via email" : ""),
      technician: {
        _id: result.insertedId,
        ...newTechnician
      },
      emailSent,
      // Include the password in the response for debugging
      // This should be removed in production
      debug: {
        password: tempPassword,
        emailConfig: {
          user: process.env.EMAIL_USER ? "configured" : "missing",
          pass: process.env.EMAIL_PASS ? "configured" : "missing"
        }
      }
    });
  } catch (error) {
    console.error("Error creating technician:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create technician" },
      { status: 500 }
    );
  }
}
