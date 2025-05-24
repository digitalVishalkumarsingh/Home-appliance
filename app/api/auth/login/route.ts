import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import bcrypt from "bcryptjs";
import { generateToken } from "@/app/lib/auth";
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

      // Log more details about the user lookup
      console.log("User lookup details:", {
        email,
        found: !!user,
        collection: "users"
      });
    } catch (lookupError) {
      logger.error("User lookup error", { error: lookupError instanceof Error ? lookupError.message : "Unknown error" });
      console.error("Database error during user lookup:", lookupError);
      return NextResponse.json(
        { success: false, message: "Error looking up user" },
        { status: 500 }
      );
    }

    if (!user) {
      logger.info("Login failed: User not found", { email });
      console.log("User not found in database:", email);
      return NextResponse.json(
        { success: false, message: "Invalid email or password" }, // More secure error message
        { status: 401 }
      );
    }

    // Verify password
    let isPasswordValid;
    try {
      // Check if user.password exists
      if (!user.password) {
        logger.error("Password verification error: User has no password", { email });
        console.error("User has no password hash:", email);
        return NextResponse.json(
          { success: false, message: "Account error. Please contact support." },
          { status: 500 }
        );
      }

      isPasswordValid = await bcrypt.compare(password, user.password);
      logger.debug("Password verification result", { valid: isPasswordValid });
      console.log("Password verification result:", { valid: isPasswordValid, email });
    } catch (passwordError) {
      logger.error("Password verification error", { error: passwordError instanceof Error ? passwordError.message : "Unknown error" });
      console.error("Error during password verification:", passwordError);
      return NextResponse.json(
        { success: false, message: "Error verifying password" },
        { status: 500 }
      );
    }

    if (!isPasswordValid) {
      logger.info("Login failed: Invalid password", { email });
      console.log("Invalid password for user:", email);
      return NextResponse.json(
        { success: false, message: "Invalid email or password" }, // More secure error message
        { status: 401 }
      );
    }

    // Create JWT token using Edge-compatible implementation
    let token;
    try {
      // Ensure user has required fields
      if (!user._id) {
        logger.error("Token generation error: User has no ID", { email });
        console.error("User has no ID:", email);
        return NextResponse.json(
          { success: false, message: "Account error. Please contact support." },
          { status: 500 }
        );
      }

      // Ensure user has a role
      const userRole = user.role || 'user'; // Default to 'user' if no role is specified

      // Generate token with user data
      token = await generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: userRole
      });

      logger.debug("Token generated successfully");
      console.log("Token generated successfully for user:", email);
    } catch (tokenError) {
      logger.error("Token generation error", { error: tokenError instanceof Error ? tokenError.message : "Unknown error" });
      console.error("Error generating token:", tokenError);
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
      isTechnician: user.role === "technician", // Add a special flag for technician users
      isNewUser, // Add flag to indicate if user is newly registered
    });

    // Set the token cookie in the response (httpOnly for security)
    response.cookies.set({
      name: 'token',
      value: token,
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true, // Makes it accessible only by the server, not by JavaScript
    });

    // Also set a non-httpOnly cookie for client-side access (for navigation)
    // This is less secure but needed for middleware to work with client-side navigation
    response.cookies.set({
      name: 'auth_token',
      value: token,
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false, // Accessible by JavaScript for client-side navigation
    });

    // Log the successful login
    logger.info("Login successful", { email, userId: user._id, role: user.role });
    console.log("Login successful:", {
      email,
      userId: user._id.toString(),
      role: user.role,
      isAdmin: user.role === "admin",
      isTechnician: user.role === "technician"
    });

    return response;
  } catch (error) {
    logger.error("Login error", { error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

