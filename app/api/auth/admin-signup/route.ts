import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import bcrypt from "bcryptjs";

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
  _id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  createdAt: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
}

// For development purposes, we'll use a hardcoded secret key
// In production, this should be an environment variable
const ADMIN_AUTH_SECRET = process.env.ADMIN_AUTH_SECRET || process.env.ADMIN_SECRET_KEY || "dizit-admin-secret-2024";
console.log("Admin secret key is configured");

export async function POST(request: Request) {
  try {
    // Parse request body
    let requestBody: SignupRequestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, message: "Invalid JSON format" },
        { status: 400 }
      );
    }

    const { name, email, phone, password, secretKey } = requestBody;

    // Validate input
    if (!name || !email || !phone || !password || !secretKey) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate phone format
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { success: false, message: "Phone number must be 10 digits" },
        { status: 400 }
      );
    }

    // Validate password strength - simplified for testing
    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters",
        },
        { status: 400 }
      );
    }

    // Validate secret key
    if (secretKey !== ADMIN_AUTH_SECRET) {
      return NextResponse.json(
        { success: false, message: "Invalid admin secret key" },
        { status: 403 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Check if user already exists
    const existingUser = await db.collection<User>(COLLECTION_USERS).findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser: Omit<User, "_id"> = {
      name,
      email,
      phone,
      password: hashedPassword,
      role: ADMIN_ROLE,
      createdAt: new Date().toISOString(),
    };

    const result = await db.collection<Omit<User, "_id">>(COLLECTION_USERS).insertOne(newUser);

    // Exclude password from response
    const { password: _, ...userWithoutPassword } = {
      ...newUser,
      _id: result.insertedId.toString(),
    };

    return NextResponse.json({
      success: true,
      message: "Admin account created successfully",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Admin signup error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

