import { NextResponse } from "next/server";
import { connectToDatabase, ObjectId } from "@/app/lib/mongodb";
import bcrypt from "bcryptjs";
import { logger } from "@/app/config/logger";
import { sendPasswordResetEmail } from "@/app/lib/email";

// Constants
const COLLECTION_USERS = "users";
const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

export async function POST(request: Request) {
  try {
    logger.info("Processing forgot password request");

    // Parse request body
    let email: string;
    try {
      const body = await request.json();
      email = body.email?.trim().toLowerCase();
    } catch (parseError) {
      const errorMessage = parseError instanceof Error ? parseError.message : "Unknown error";
      logger.warn("Failed to parse request body", { error: errorMessage });
      return NextResponse.json(
        { success: false, message: "Invalid request format" },
        { status: 400 }
      );
    }

    // Validate email
    if (!email) {
      logger.warn("Missing required field: email");
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logger.warn("Invalid email format in forgot password request", { email });
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
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
      const errorMessage = dbError instanceof Error ? dbError.message : "Unknown error";
      logger.error("Database connection error", { error: errorMessage });
      return NextResponse.json(
        { success: false, message: "Database connection error" },
        { status: 500 }
      );
    }

    // Find user by email
    const user = await db.collection(COLLECTION_USERS).findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      logger.info("Forgot password request for non-existent email", { email });
      return NextResponse.json({
        success: true,
        message: "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const resetToken = Array.from(tokenBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const resetTokenExpiry = new Date(Date.now() + TOKEN_EXPIRY);

    // Hash token for storage
    const hashedToken = await bcrypt.hash(resetToken, 12);

    // Update user with reset token, invalidating previous tokens
    try {
      await db.collection(COLLECTION_USERS).updateOne(
        { _id: new ObjectId(user._id) },
        {
          $set: {
            resetToken: hashedToken,
            resetTokenExpiry,
          },
          $unset: {
            previousResetToken: "", // Clear any old tokens
          },
        }
      );
      logger.debug("Reset token stored for user", { email, userId: user._id.toString() });
    } catch (mongoError) {
      const errorMessage = mongoError instanceof Error ? mongoError.message : "Unknown error";
      logger.error("Failed to store reset token", { error: errorMessage, email });
      return NextResponse.json(
        { success: false, message: "Internal server error" },
        { status: 500 }
      );
    }

    // Create reset URL
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
        `${request.headers.get("x-forwarded-proto") || "http"}://${request.headers.get("host")}`;
    const resetUrl = `${baseUrl}/reset-password/${resetToken}`;

    // Send email with reset link
    try {
      await sendPasswordResetEmail(email, resetUrl);
      logger.info("Password reset email sent", { email });
    } catch (emailError) {
      const errorMessage = emailError instanceof Error ? emailError.message : "Unknown error";
      logger.error("Failed to send password reset email", { error: errorMessage, email });
      // Continue to avoid revealing user existence
    }

    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Forgot password error", { error: errorMessage });
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export const config = {
  runtime: "edge", // Ensure Edge compatibility
};