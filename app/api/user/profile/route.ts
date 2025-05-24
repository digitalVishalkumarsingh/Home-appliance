import { NextResponse, NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";

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
  address?: string;
  profileImage?: string;
  createdAt: Date;
}

export async function GET(request: Request) {
  try {
    console.log("Processing /api/user/profile request");

    // Extract token from request
    const token = getTokenFromRequest(new NextRequest(request));
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = await verifyToken(token) as JwtPayload;
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    // Parse userId
    let userId: ObjectId;
    try {
      // Handle different formats of userId
      if (ObjectId.isValid(decoded.userId)) {
        userId = new ObjectId(decoded.userId);
      } else if (typeof decoded.userId === 'string' && decoded.userId.length === 24) {
        // Try to convert string to ObjectId
        userId = new ObjectId(decoded.userId);
      } else {
        throw new Error("Invalid userId format");
      }
    } catch (error) {
      console.warn("Invalid user ID format", { userId: decoded.userId });
      return NextResponse.json(
        { success: false, message: "Invalid user ID format" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });
    console.log("Connected to database");

    // Find user by ID
    console.log("Looking for user with ID", { userId: decoded.userId });
    const user = await db.collection<User>("users").findOne({ _id: userId });

    if (!user) {
      console.warn("User not found", { userId: decoded.userId });
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    console.log("User found", { email: user.email });

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

    console.log("Returning successful response");
    return response;
  } catch (error) {
    // Log error with context
    console.error("Failed to retrieve user data", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update user profile
export async function PUT(request: NextRequest) {
  try {
    console.log("Processing PUT /api/user/profile request");

    // Extract token from request
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = await verifyToken(token) as JwtPayload;
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    // Parse userId
    let userId: ObjectId;
    try {
      if (ObjectId.isValid(decoded.userId)) {
        userId = new ObjectId(decoded.userId);
      } else {
        throw new Error("Invalid userId format");
      }
    } catch (error) {
      console.warn("Invalid user ID format", { userId: decoded.userId });
      return NextResponse.json(
        { success: false, message: "Invalid user ID format" },
        { status: 400 }
      );
    }

    // Get update data from request
    const { name, email, phone, address, profileImage } = await request.json();

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });

    // Find the user by ID
    const user = await db.collection("users").findOne({
      _id: userId
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (profileImage) updateData.profileImage = profileImage;

    // If email is being changed, check if it's already in use
    if (email && email !== user.email) {
      const existingUser = await db.collection("users").findOne({ email });

      if (existingUser) {
        return NextResponse.json(
          { success: false, message: "Email is already in use" },
          { status: 409 }
        );
      }

      updateData.email = email;
    }

    // Update user data if there are changes
    if (Object.keys(updateData).length > 0) {
      await db.collection("users").updateOne(
        { _id: userId },
        { $set: updateData }
      );

      // Get updated user data
      const updatedUser = await db.collection("users").findOne({
        _id: userId
      });

      // Return updated user data without password
      const { password, ...userWithoutPassword } = (updatedUser as User) || {};

      return NextResponse.json({
        success: true,
        message: "Profile updated successfully",
        user: userWithoutPassword
      });
    } else {
      return NextResponse.json({
        success: true,
        message: "No changes to update",
        user: { ...user, password: undefined }
      });
    }
  } catch (error) {
    console.error("Update profile error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

