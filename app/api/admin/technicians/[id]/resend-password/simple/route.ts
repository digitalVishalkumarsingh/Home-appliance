import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

// Simple resend password without email complications
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log("Simple resend password started");
    
    // Verify admin authentication
    let token;
    try {
      token = getTokenFromRequest(request);
    } catch (tokenError) {
      console.error("Token extraction failed:", tokenError);
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: "No token provided" },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = await verifyToken(token);
    } catch (verifyError) {
      console.error("Token verification failed:", verifyError);
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    if (!decoded || (decoded as {role?: string}).role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    // Get technician ID
    const { id } = await context.params;
    console.log("Resending password for technician ID:", id);

    // Connect to database
    let db;
    try {
      const connection = await connectToDatabase();
      db = connection.db;
    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      return NextResponse.json(
        { success: false, message: "Database connection failed" },
        { status: 500 }
      );
    }

    // Find technician
    let technician;
    try {
      technician = await db.collection("technicians").findOne({
        _id: ObjectId.isValid(id) ? new ObjectId(id) : id
      });
    } catch (findError) {
      console.error("Error finding technician:", findError);
      return NextResponse.json(
        { success: false, message: "Error finding technician" },
        { status: 500 }
      );
    }

    if (!technician) {
      return NextResponse.json(
        { success: false, message: "Technician not found" },
        { status: 404 }
      );
    }

    // Generate new simple password
    const newPassword = "temp123"; // Simple temporary password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update technician password
    try {
      await db.collection("technicians").updateOne(
        { _id: ObjectId.isValid(id) ? new ObjectId(id) : id },
        {
          $set: {
            password: hashedPassword,
            updatedAt: new Date(),
            accountCreated: true
          }
        }
      );
      console.log("Technician password updated successfully");
    } catch (updateError) {
      console.error("Error updating technician password:", updateError);
      return NextResponse.json(
        { success: false, message: "Failed to update password" },
        { status: 500 }
      );
    }

    // Also update user account if exists
    try {
      const userUpdateResult = await db.collection("users").updateOne(
        { email: technician.email },
        {
          $set: {
            password: hashedPassword,
            updatedAt: new Date(),
            role: "technician"
          }
        }
      );
      
      if (userUpdateResult.matchedCount > 0) {
        console.log("User account password also updated");
      } else {
        console.log("No user account found to update");
      }
    } catch (userUpdateError) {
      console.error("Error updating user account:", userUpdateError);
      // Continue even if user update fails
    }

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
      temporaryPassword: newPassword,
      technicianEmail: technician.email,
      note: "Password has been reset to: temp123"
    });

  } catch (error) {
    console.error("Unexpected error in simple resend password:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Simple resend password endpoint",
    note: "This resets technician password to 'temp123' without email complications"
  });
}
