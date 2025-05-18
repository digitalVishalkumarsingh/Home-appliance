import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { ObjectId } from "mongodb";
import { logger } from "@/app/config/logger";
import { sendPasswordResetEmail } from "@/app/lib/email";

// Constants
const COLLECTION_USERS = "users";
const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

export async function POST(request: Request) {
  try {
    logger.info("Processing forgot password request");

    // Parse request body
    let email;
    try {
      const body = await request.json();
      email = body.email?.trim().toLowerCase();
    } catch (parseError) {
      logger.error("Failed to parse request body", {
        error: parseError instanceof Error ? parseError.message : "Unknown error"
      });
      return NextResponse.json(
        { success: false, message: "Invalid request format" },
        { status: 400 }
      );
    }

    // Validate input
    if (!email) {
      logger.warn("Missing required field: email");
      return NextResponse.json(
        { success: false, message: "Email is required" },
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
      logger.error("Database connection error", {
        error: dbError instanceof Error ? dbError.message : "Unknown error"
      });
      return NextResponse.json(
        { success: false, message: "Database connection error" },
        { status: 500 }
      );
    }

    // Find user by email
    const user = await db.collection(COLLECTION_USERS).findOne({ email });

    // For security reasons, don't reveal if the email exists or not
    // Always return a success response even if the email doesn't exist
    if (!user) {
      logger.info("Forgot password request for non-existent email", { email });
      return NextResponse.json({
        success: true,
        message: "If an account with that email exists, a password reset link has been sent."
      });
    }

    // Generate a reset token using Web Crypto API
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const resetToken = Array.from(tokenBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const resetTokenExpiry = new Date(Date.now() + TOKEN_EXPIRY);

    // Hash the token for storage using a simple hashing approach
    // Since we can't use Node's crypto in Edge Runtime
    const encoder = new TextEncoder();
    const data = encoder.encode(resetToken);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedToken = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Update user with reset token
    await db.collection(COLLECTION_USERS).updateOne(
      { _id: new ObjectId(user._id) },
      {
        $set: {
          resetToken: hashedToken,
          resetTokenExpiry,
        },
      }
    );

    // Create reset URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ||
                   `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`;
    const resetUrl = `${baseUrl}/reset-password/${resetToken}`;

    // Send email with reset link
    try {
      await sendPasswordResetEmail(email, resetUrl);
    } catch (emailError) {
      logger.error("Failed to send password reset email", {
        error: emailError instanceof Error ? emailError.message : "Unknown error",
        email
      });
      // Continue anyway to avoid revealing if the email exists
    }

    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent."
    });
  } catch (error) {
    logger.error("Forgot password error", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
