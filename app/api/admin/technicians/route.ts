import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";
import { Technician, createTechnician } from "@/app/models/technician";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateRandomPassword } from "@/app/utils/passwordGenerator";
// Import email function with fallback
let sendTechnicianCredentialsEmail: any;
try {
  const emailModule = require("@/app/lib/email");
  sendTechnicianCredentialsEmail = emailModule.sendTechnicianCredentialsEmail;
} catch (emailImportError) {
  console.error("Failed to import email module:", emailImportError);
  sendTechnicianCredentialsEmail = async () => {
    console.log("Email module not available, skipping email sending");
    return false;
  };
}

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

    const decoded = await verifyToken(token);

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
    console.log("POST /api/admin/technicians - Starting technician creation");

    // Verify admin authentication
    let token;
    try {
      token = getTokenFromRequest(request);
      console.log("Token extracted successfully");
    } catch (tokenError) {
      console.error("Token extraction failed:", tokenError);
      return NextResponse.json(
        { success: false, message: "Authentication required", error: "Token extraction failed" },
        { status: 401 }
      );
    }

    if (!token) {
      console.log("No token provided");
      return NextResponse.json(
        { success: false, message: "Authentication required", error: "No token provided" },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = await verifyToken(token);
      console.log("Token verified successfully for user:", decoded.userId);
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      return NextResponse.json(
        { success: false, message: "Invalid token", error: "Token verification failed" },
        { status: 401 }
      );
    }

    if (!decoded || (decoded as {role?: string}).role !== "admin") {
      console.log("Unauthorized access attempt. User role:", (decoded as {role?: string})?.role);
      return NextResponse.json(
        { success: false, message: "Unauthorized access", error: "Admin role required" },
        { status: 403 }
      );
    }

    // Get technician data from request body
    let technicianData;
    try {
      technicianData = await request.json();
      console.log("Request body parsed successfully. Technician data:", {
        name: technicianData.name,
        email: technicianData.email,
        phone: technicianData.phone,
        specializations: technicianData.specializations?.length || 0
      });
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        { success: false, message: "Invalid request body", error: "JSON parsing failed" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!technicianData.name || !technicianData.email || !technicianData.phone) {
      console.log("Validation failed. Missing required fields:", {
        hasName: !!technicianData.name,
        hasEmail: !!technicianData.email,
        hasPhone: !!technicianData.phone
      });
      return NextResponse.json(
        { success: false, message: "Name, email, and phone are required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    let db;
    try {
      const connection = await connectToDatabase();
      db = connection.db;
      console.log("Database connection successful");
    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      return NextResponse.json(
        { success: false, message: "Database connection failed", error: dbError instanceof Error ? dbError.message : "Unknown database error" },
        { status: 500 }
      );
    }

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

    // Generate reset token for password setup
    let resetToken;
    let emailSent = false;

    try {
      console.log("Generating reset token for new technician:", technicianData.email);

      // Check if JWT_SECRET is configured, use fallback if missing
      const jwtSecret = process.env.JWT_SECRET || "fallback-secret-for-development-only";
      if (!process.env.JWT_SECRET) {
        console.warn("JWT_SECRET not configured, using fallback (not secure for production)");
      }

      // Create a reset token for the technician to set their password
      resetToken = jwt.sign(
        {
          userId: result.insertedId.toString(),
          email: technicianData.email,
          type: "password-setup"
        },
        jwtSecret,
        { expiresIn: "24h" } // Give them 24 hours to set password
      );

      console.log("Reset token generated successfully");

      // Check if email configuration is available
      const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.ADMIN_EMAIL);

      if (!emailConfigured) {
        console.log("Email configuration missing, skipping email sending");
        console.log("To enable email sending, set EMAIL_USER, EMAIL_PASS, and ADMIN_EMAIL environment variables");
        emailSent = false;
      } else {
        // Send email with login credentials to technician
        console.log("Attempting to send credentials email for new technician:", technicianData.email);

        try {
          emailSent = await sendTechnicianCredentialsEmail({
            name: technicianData.name,
            email: technicianData.email,
            resetToken: resetToken,
            phone: technicianData.phone
          });

          console.log("Email sending result:", emailSent);
        } catch (emailSendError) {
          console.error("Failed to send email:", emailSendError);
          console.error("Email error details:", emailSendError instanceof Error ? emailSendError.message : "Unknown error");
          emailSent = false;
        }
      }
    } catch (emailError) {
      console.error("Error with email/token generation:", emailError);
      console.error("Error details:", {
        error: emailError instanceof Error ? emailError.message : "Unknown error",
        stack: emailError instanceof Error ? emailError.stack : undefined,
        email: technicianData.email,
        hasJwtSecret: !!process.env.JWT_SECRET,
        hasEmailConfig: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
      });
      // Continue even if email fails
    }

    const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.ADMIN_EMAIL);

    return NextResponse.json({
      success: true,
      message: emailSent
        ? "Technician created successfully and password setup email sent"
        : emailConfigured
          ? "Technician created successfully but email sending failed"
          : "Technician created successfully (email not configured)",
      technician: {
        _id: result.insertedId,
        ...newTechnician,
        // Remove password from response
        password: undefined
      },
      emailSent,
      resetTokenGenerated: !!resetToken,
      emailConfigured,
      debug: {
        emailConfig: {
          user: process.env.EMAIL_USER ? "configured" : "missing",
          pass: process.env.EMAIL_PASS ? "configured" : "missing",
          admin: process.env.ADMIN_EMAIL ? "configured" : "missing"
        },
        jwtSecret: process.env.JWT_SECRET ? "configured" : "missing",
        resetToken: resetToken ? "generated" : "failed"
      },
      instructions: emailConfigured ? undefined : {
        message: "To enable email sending, configure these environment variables:",
        required: ["EMAIL_USER", "EMAIL_PASS", "ADMIN_EMAIL"],
        testEndpoint: "/api/test/email"
      }
    });
  } catch (error) {
    console.error("Unexpected error creating technician:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create technician",
        error: error instanceof Error ? error.message : "Unknown error",
        debug: {
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}
