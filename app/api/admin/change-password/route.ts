import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    // Verify admin authentication
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      console.error("Token verification failed:", error);
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // Check if the user is an admin
    if (!decoded || (decoded as {role?: string}).role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Try to get the admin ID from different possible properties
    let adminId = (decoded as {id?: string}).id ||
                 (decoded as {_id?: string})._id ||
                 (decoded as {userId?: string}).userId;

    if (!adminId) {
      console.error("Admin ID not found in token:", decoded);
      return NextResponse.json(
        { success: false, message: "Invalid token structure: admin ID not found" },
        { status: 400 }
      );
    }

    // Parse request body
    const { currentPassword, newPassword } = await request.json();

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Current password and new password are required" },
        { status: 400 }
      );
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "New password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Find admin by ID
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(adminId);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Invalid admin ID format" },
        { status: 400 }
      );
    }

    // First try to find in the admins collection
    let admin = await db.collection("admins").findOne({ _id: objectId });
    let collectionName = "admins";

    // If not found in admins collection, try the users collection with role=admin
    if (!admin) {
      admin = await db.collection("users").findOne({ _id: objectId, role: "admin" });
      collectionName = "users";
    }

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 404 }
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update admin password in the correct collection
    const result = await db.collection(collectionName).updateOne(
      { _id: objectId },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date().toISOString()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Failed to update password" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error("Error changing admin password:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
