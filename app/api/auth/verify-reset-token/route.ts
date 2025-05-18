import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { logger } from "@/app/config/logger";

// Constants
const COLLECTION_USERS = "users";

export async function GET(request: Request) {
  try {
    logger.info("Verifying reset token");

    // Get token from URL
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      logger.warn("Missing token parameter");
      return NextResponse.json(
        { valid: false, message: "Token is required" },
        { status: 400 }
      );
    }

    // Hash the token for comparison using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedToken = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

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
        { valid: false, message: "Database connection error" },
        { status: 500 }
      );
    }

    // Find user with this token and check if it's still valid
    const user = await db.collection(COLLECTION_USERS).findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: new Date() }, // Token must not be expired
    });

    if (!user) {
      logger.info("Invalid or expired reset token");
      return NextResponse.json(
        { valid: false, message: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    logger.info("Reset token verified successfully");
    return NextResponse.json({ valid: true });
  } catch (error) {
    logger.error("Token verification error", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { valid: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
