import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import bcrypt from "bcryptjs";
import { generateToken } from "@/app/lib/auth-edge";
import { logger } from "@/app/config/logger";

export async function POST(request: Request) {
  try {
    logger.info("Processing login request");

    // Parse request body
    let email, password;
    try {
      const body = await request.json();
      email = body.email;
      password = body.password;
    } catch (parseError) {
      logger.error("Failed to parse request body", { error: parseError instanceof Error ? parseError.message : "Unknown error" });
      return NextResponse.json(
        { success: false, message: "Invalid request format" },
        { status: 400 }
      );
    }

    // Validate input
    if (!email || !password) {
      logger.warn("Missing required fields", { email: !!email, password: !!password });
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    let db;
    try {
      const dbConnection = await connectToDatabase();
      db = dbConnection.db;
      logger.debug("Connected to database");
    } catch (dbError) {
      logger.error("Database connection error", { error: dbError instanceof Error ? dbError.message : "Unknown error" });
      return NextResponse.json(
        { success: false, message: "Database connection error" },
        { status: 500 }
      );
    }

    // Find user by email
    let user;
    try {
      user = await db.collection("users").findOne({ email });
      logger.debug("User lookup result", { found: !!user });
    } catch (lookupError) {
      logger.error("User lookup error", { error: lookupError instanceof Error ? lookupError.message : "Unknown error" });
      return NextResponse.json(
        { success: false, message: "Error looking up user" },
        { status: 500 }
      );
    }

    if (!user) {
      logger.info("Login failed: User not found", { email });
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 401 }
      );
    }

    // Verify password
    let isPasswordValid;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
      logger.debug("Password verification result", { valid: isPasswordValid });
    } catch (passwordError) {
      logger.error("Password verification error", { error: passwordError instanceof Error ? passwordError.message : "Unknown error" });
      return NextResponse.json(
        { success: false, message: "Error verifying password" },
        { status: 500 }
      );
    }

    if (!isPasswordValid) {
      logger.info("Login failed: Invalid password", { email });
      return NextResponse.json(
        { success: false, message: "Invalid password" },
        { status: 401 }
      );
    }

    // Create JWT token using Edge-compatible implementation
    let token;
    try {
      token = await generateToken(
        { userId: user._id.toString(), email: user.email, role: user.role }
      );
      logger.debug("Token generated successfully");
    } catch (tokenError) {
      logger.error("Token generation error", { error: tokenError instanceof Error ? tokenError.message : "Unknown error" });
      return NextResponse.json(
        { success: false, message: "Error generating authentication token" },
        { status: 500 }
      );
    }

    // Return user data and token (excluding password)
    const { password: _, ...userWithoutPassword } = user;

    // Check if user is newly registered (within the last 7 days)
    const isNewUser = user.createdAt &&
      (new Date().getTime() - new Date(user.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;

    // Create response with cookie
    const response = NextResponse.json({
      success: true, // Add success flag for consistent API responses
      message: "Login successful",
      user: userWithoutPassword,
      token,
      isAdmin: user.role === "admin", // Add a special flag for admin users
      isNewUser, // Add flag to indicate if user is newly registered
    });

    // Set the token cookie in the response
    response.cookies.set({
      name: 'token',
      value: token,
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true, // Makes it accessible only by the server, not by JavaScript
    });

    logger.info("Login successful", { email, userId: user._id });
    return response;
  } catch (error) {
    logger.error("Login error", { error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

