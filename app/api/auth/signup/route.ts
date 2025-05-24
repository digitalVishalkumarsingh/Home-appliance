import { NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/app/lib/mongodb";
import { logger } from "@/app/config/logger";

// Constants
const COLLECTION_USERS = "users";
const BCRYPT_SALT_ROUNDS = 12;

// Zod schema for request body
const SignupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name is too long"),
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  phone: z.string().regex(/^\d{10}$/, "Please enter a valid 10-digit phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// TypeScript interfaces
interface User {
  _id: ObjectId;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  createdAt: Date;
}

interface ApiResponse {
  success: boolean;
  message: string;
  userId?: string;
}

// Handle CORS preflight requests
export async function OPTIONS(request: Request) {
  const response = new NextResponse(null, { status: 204 }); // No content

  // Set CORS headers
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.headers.set("Access-Control-Max-Age", "86400"); // 24 hours

  return response;
}

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      logger.warn("Invalid JSON in request body", {
        error: jsonError instanceof Error ? jsonError.message : "Unknown error",
      });
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      );
    }

    const { name, email, phone, password } = SignupSchema.parse(body);

    // Connect to MongoDB
    let db;
    try {
      const connection = await connectToDatabase({ timeoutMs: 10000 });
      db = connection.db;
    } catch (dbError) {
      logger.error("Database connection failed", {
        error: dbError instanceof Error ? dbError.message : "Unknown error",
      });
      return NextResponse.json(
        { success: false, message: "Database connection error" },
        { status: 500 }
      );
    }

    // Check if user already exists
    const existingUser = await db.collection<User>(COLLECTION_USERS).findOne({ email });
    if (existingUser) {
      logger.info("Registration attempt failed: Email already exists", { email });
      return NextResponse.json(
        { success: false, message: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Create new user with ObjectId
    const userId = new ObjectId();

    // Create user document
    const newUser = {
      _id: userId,
      name,
      email,
      phone,
      password: hashedPassword,
      role: "user",
      createdAt: new Date()
    };

    // Insert user into database
    const result = await db.collection<User>(COLLECTION_USERS).insertOne(newUser);

    // Log the result
    console.log("User registration result:", {
      insertedId: result.insertedId.toString(),
      acknowledged: result.acknowledged,
      email
    });

    // Prepare response
    const response = NextResponse.json({
      success: true,
      message: "User registered successfully",
      userId: result.insertedId.toString(),
    });

    // Set security headers
    response.headers.set("Content-Security-Policy", "default-src 'self'");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

    // Set CORS headers
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    logger.info("User registered successfully", { userId: result.insertedId.toString(), email });
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Invalid registration input", { errors: error.errors });
      return NextResponse.json(
        { success: false, message: "Invalid input data" },
        { status: 400 }
      );
    }

    logger.error("Registration error", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}