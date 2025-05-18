import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { verifyToken, getTokenFromStandardRequest } from "@/app/lib/auth-edge";
import { connectToDatabase } from "@/app/lib/mongodb";
import { logger } from "@/app/config/logger";

// Constants
const COLLECTION_USERS = "users";

// TypeScript Interfaces
interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

interface User {
  _id: ObjectId | string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  createdAt: Date;
}

// API Response type
interface ApiResponse {
  success: boolean;
  message: string;
  user?: Omit<User, "password">;
}

// Helper function to extract and validate token
async function extractAndVerifyToken(request: Request): Promise<JwtPayload | null> {
  try {
    // First try to get token from Authorization header
    const authHeader = request.headers.get("Authorization");
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
      logger.debug("Token extracted from Authorization header");
    } else {
      // If not in header, try to get from cookies
      token = getTokenFromStandardRequest(request);
      if (token) {
        logger.debug("Token extracted from cookies");
      } else {
        logger.warn("No token found in request");
        return null;
      }
    }

    // Verify the token
    const decoded = await verifyToken(token);
    if (!decoded) {
      logger.warn("Token verification failed - null result");
      return null;
    }

    // Ensure the decoded token has the expected structure
    if (typeof decoded !== "object" || !("userId" in decoded)) {
      logger.warn("Token has invalid structure", { decoded: typeof decoded });
      return null;
    }

    logger.debug("Token verified successfully", { userId: decoded.userId });
    return decoded as unknown as JwtPayload;
  } catch (error) {
    logger.error("Token verification error", { error: error instanceof Error ? error.message : "Unknown error" });
    return null;
  }
}

export async function GET(request: Request) {
  try {
    logger.debug("Processing /api/auth/me request");

    // Extract and verify token
    const decoded = await extractAndVerifyToken(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Invalid or missing token" },
        { status: 401 }
      );
    }

    // Validate ObjectId
    let userId: ObjectId;
    try {
      // Handle both string and buffer user IDs
      if (typeof decoded.userId === 'string') {
        // If userId is already a string, use it directly
        userId = new ObjectId(decoded.userId);
        logger.debug("Valid ObjectId from string", { userId: decoded.userId });
      } else if (decoded.userId && typeof decoded.userId === 'object' && 'buffer' in decoded.userId) {
        // If userId is a buffer object, convert it to a proper ObjectId
        // Convert buffer to hex string first to avoid deprecated constructor
        const bufferObj = decoded.userId as { buffer: { [key: number]: number } };
        const bufferArray = Object.values(bufferObj.buffer);
        const buffer = Buffer.from(bufferArray);
        const hexString = buffer.toString('hex');
        userId = new ObjectId(hexString);
        logger.debug("Valid ObjectId from buffer", { userId: userId.toString() });
      } else {
        throw new Error("Unsupported userId format");
      }
    } catch (error) {
      logger.warn("Invalid user ID format", { userId: decoded.userId });
      return NextResponse.json(
        { success: false, message: "Invalid user ID format" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();
    logger.debug("Connected to database");

    // Find user by ID
    logger.debug("Looking for user with ID", { userId: decoded.userId });
    const user = await db.collection<User>(COLLECTION_USERS).findOne({ _id: userId });

    if (!user) {
      logger.warn("User not found", { userId: decoded.userId });
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    logger.debug("User found", { email: user.email });

    // Exclude password from response
    const { password, ...userWithoutPassword } = user;

    // Create response with security headers
    const response = NextResponse.json({
      success: true,
      message: "User data retrieved successfully",
      user: userWithoutPassword,
    });

    // Set security headers
    response.headers.set("Content-Security-Policy", "default-src 'self'");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

    logger.debug("Returning successful response");
    return response;
  } catch (error) {
    // Log error with context
    logger.error("Failed to retrieve user data", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

