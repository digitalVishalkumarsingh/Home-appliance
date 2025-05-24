import { NextResponse } from "next/server";
import { connectToDatabase, ObjectId } from "@/app/lib/mongodb"; // Changed to match db.ts path
import bcrypt from "bcryptjs";
import { logger } from "@/app/config/logger";

// Constants
const COLLECTION_USERS = "users";
const ADMIN_ROLE = "admin";

// Interfaces
interface SignupRequestBody {
  name: string;
  email: string;
  phone: string;
  password: string;
  secretKey: string;
}

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
  user?: Omit<User, "password" | "_id"> & { _id: string };
}

// Get admin secret key from environment variables
const ADMIN_AUTH_SECRET = process.env.ADMIN_AUTH_SECRET;
if (!ADMIN_AUTH_SECRET) {
  logger.error("ADMIN_AUTH_SECRET is not set in environment variables");
  throw new Error("ADMIN_AUTH_SECRET must be set in .env");
}
logger.debug("Admin secret key is configured");

export async function POST(request: Request) {
  try {
    // Parse request body
    let requestBody: SignupRequestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      logger.warn("Invalid JSON format in admin signup request", {
        error: parseError instanceof Error ? parseError.message : "Unknown error",
      });
      return NextResponse.json(
        { success: false, message: "Invalid JSON format" },
        { status: 400 }
      );
    }

    const { name, email, phone, password, secretKey } = requestBody;

    // Validate input
    if (!name || !email || !phone || !password || !secretKey) {
      logger.warn("Missing required fields in admin signup request", { email });
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logger.warn("Invalid email format in admin signup request", { email });
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate phone format (more flexible for international numbers)
    const phoneRegex = /^\+?[\d\s-]{10,15}$/;
    if (!phoneRegex.test(phone)) {
      logger.warn("Invalid phone format in admin signup request", { phone });
      return NextResponse.json(
        { success: false, message: "Phone number must be 10-15 digits, optionally with +, spaces, or hyphens" },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      logger.warn("Weak password in admin signup request", { email });
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 8 characters, including uppercase, lowercase, number, and special character",
        },
        { status: 400 }
      );
    }

    // Validate secret key
    if (secretKey !== ADMIN_AUTH_SECRET) {
      logger.warn("Invalid admin secret key in signup request", { email });
      return NextResponse.json(
        { success: false, message: "Invalid admin secret key" },
        { status: 403 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Check if user already exists
    const existingUser = await db.collection<User>(COLLECTION_USERS).findOne({ email: email.toLowerCase() });
    if (existingUser) {
      logger.warn("Email already registered in admin signup", { email });
      return NextResponse.json(
        { success: false, message: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user document
    const userId = new ObjectId();
    const newUser: User = {
      _id: userId,
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      role: ADMIN_ROLE,
      createdAt: new Date(),
    };

    // Insert user into database
    try {
      const result = await db.collection<User>(COLLECTION_USERS).insertOne(newUser);
      logger.info("Admin user created", {
        email: newUser.email,
        userId: result.insertedId.toString(),
      });

      // Prepare response user object
      const { password: _, ...userWithoutPassword } = {
        ...newUser,
        _id: result.insertedId.toString(),
      };

      return NextResponse.json({
        success: true,
        message: "Admin account created successfully",
        user: userWithoutPassword,
      });
    } catch (mongoError) {
      if (mongoError instanceof Error && (mongoError as any).code === 11000) {
        logger.warn("Duplicate key error in admin signup", { email });
        return NextResponse.json(
          { success: false, message: "Email already registered" },
          { status: 409 }
        );
      }
      throw mongoError;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Admin signup failed", { error: errorMessage });
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}