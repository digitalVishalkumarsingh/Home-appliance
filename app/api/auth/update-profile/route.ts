import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { getTokenFromRequest, verifyToken } from "@/app/lib/auth";

// Define the JWT payload interface
interface JwtPayload {
  userId: string;
  email: string;
  role?: string;
}

export async function PUT(request: Request) {
  try {
    // Get the token from the request
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    // Verify the token
    const decoded = verifyToken(token) as JwtPayload;

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    // Get update data from request
    let name, email, phone, currentPassword, newPassword;
    try {
      const requestData = await request.json();
      ({ name, email, phone, currentPassword, newPassword } = requestData);
      console.log("Request data received:", { name, email, phone, hasCurrentPassword: !!currentPassword, hasNewPassword: !!newPassword });
    } catch (error) {
      console.error("Error parsing request JSON:", error);
      return NextResponse.json(
        { message: "Invalid request data: Could not parse JSON" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Handle both string and buffer user IDs
    let userId: ObjectId;
    try {
      if (typeof decoded.userId === 'string') {
        // If userId is already a string, use it directly
        userId = new ObjectId(decoded.userId);
        console.log("Valid ObjectId from string", { userId: decoded.userId });
      } else if (decoded.userId && typeof decoded.userId === 'object' && 'buffer' in decoded.userId) {
        // If userId is a buffer object, convert it to a proper ObjectId
        // Convert buffer to hex string first to avoid deprecated constructor
        const bufferObj = decoded.userId as { buffer: { [key: number]: number } };
        const bufferArray = Object.values(bufferObj.buffer);
        const buffer = Buffer.from(bufferArray);
        const hexString = buffer.toString('hex');
        userId = new ObjectId(hexString);
        console.log("Valid ObjectId from buffer", { userId: userId.toString() });
      } else {
        throw new Error("Unsupported userId format");
      }
    } catch (error) {
      console.warn("Invalid user ID format", { userId: decoded.userId });
      return NextResponse.json(
        { message: "Invalid user ID format" },
        { status: 400 }
      );
    }

    // Find the user by ID
    const user = await db.collection("users").findOne({
      _id: userId
    }) as any; // Type assertion to avoid TypeScript errors

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;

    // If email is being changed, check if it's already in use
    if (email && email !== user.email) {
      const existingUser = await db.collection("users").findOne({ email });

      if (existingUser) {
        return NextResponse.json(
          { message: "Email is already in use" },
          { status: 409 }
        );
      }

      updateData.email = email;
    }

    // If password is being changed, verify current password and hash new password
    if (newPassword && currentPassword) {
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        return NextResponse.json(
          { message: "Current password is incorrect" },
          { status: 401 }
        );
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
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
      }) as any; // Type assertion to avoid TypeScript errors

      // Return updated user data without password
      const { password, ...userWithoutPassword } = updatedUser || {};

      return NextResponse.json({
        message: "Profile updated successfully",
        user: userWithoutPassword
      });
    } else {
      return NextResponse.json({
        message: "No changes to update",
        user: { ...user, password: undefined }
      });
    }
  } catch (error) {
    console.error("Update profile error:", error);
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "No stack trace";

    console.error("Error details:", { message: errorMessage, stack: errorStack });

    return NextResponse.json(
      { message: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
