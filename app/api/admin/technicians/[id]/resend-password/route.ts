import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { generateRandomPassword } from "@/app/utils/passwordGenerator";
import { sendTechnicianCredentialsEmail } from "@/app/lib/email";

// Resend password for a technician
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded || (decoded as {role?: string}).role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Get technician ID from URL params
    const { id } = await context.params;

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Find technician by ID
    const technician = await db.collection("technicians").findOne({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : id
    });

    if (!technician) {
      return NextResponse.json(
        { success: false, message: "Technician not found" },
        { status: 404 }
      );
    }

    // Find user account associated with this technician
    let user;

    // If technician has a userId, use that to find the user
    if (technician.userId) {
      user = await db.collection("users").findOne({
        _id: ObjectId.isValid(technician.userId)
          ? new ObjectId(technician.userId)
          : technician.userId
      });
    }

    // If no user found by userId, try finding by email
    if (!user) {
      user = await db.collection("users").findOne({
        email: technician.email
      });
    }

    // If still no user found, create a new user account
    if (!user) {
      // Generate a random password
      const password = generateRandomPassword(10, true, true, true, false);

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user account for technician
      const userResult = await db.collection("users").insertOne({
        name: technician.name,
        email: technician.email,
        phone: technician.phone,
        password: hashedPassword,
        role: "technician",
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Update technician with user ID reference
      await db.collection("technicians").updateOne(
        { _id: ObjectId.isValid(id) ? new ObjectId(id) : id },
        {
          $set: {
            userId: userResult.insertedId,
            accountCreated: true,
            updatedAt: new Date()
          }
        }
      );

      // Send email with login credentials
      let emailSent = false;
      try {
        console.log("Attempting to send credentials email for new user account:", technician.email);

        emailSent = await sendTechnicianCredentialsEmail({
          name: technician.name,
          email: technician.email,
          password: password,
          phone: technician.phone
        });

        console.log("Email sending result:", emailSent);
      } catch (emailError) {
        console.error("Error sending technician credentials email:", emailError);
        console.error("Error details:", {
          error: emailError instanceof Error ? emailError.message : "Unknown error",
          stack: emailError instanceof Error ? emailError.stack : undefined,
          email: technician.email
        });
      }

      return NextResponse.json({
        success: true,
        message: "User account created and login credentials sent via email",
        emailSent,
        // Include the password in the response for debugging
        // This should be removed in production
        debug: {
          password: password,
          emailConfig: {
            user: process.env.EMAIL_USER ? "configured" : "missing",
            pass: process.env.EMAIL_PASS ? "configured" : "missing"
          }
        }
      });
    }

    // If user exists, generate a new password and update it
    const password = generateRandomPassword(10, true, true, true, false);

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
          role: "technician" // Ensure role is set to technician
        }
      }
    );

    // Send email with new login credentials
    let emailSent = false;
    try {
      console.log("Attempting to send credentials email for password reset:", technician.email);

      emailSent = await sendTechnicianCredentialsEmail({
        name: technician.name,
        email: technician.email,
        password: password,
        phone: technician.phone
      });

      console.log("Email sending result:", emailSent);
    } catch (emailError) {
      console.error("Error sending technician credentials email:", emailError);
      console.error("Error details:", {
        error: emailError instanceof Error ? emailError.message : "Unknown error",
        stack: emailError instanceof Error ? emailError.stack : undefined,
        email: technician.email
      });
    }

    return NextResponse.json({
      success: true,
      message: "Password reset and login credentials sent via email",
      emailSent,
      // Include the password in the response for debugging
      // This should be removed in production
      debug: {
        password: password,
        emailConfig: {
          user: process.env.EMAIL_USER ? "configured" : "missing",
          pass: process.env.EMAIL_PASS ? "configured" : "missing"
        }
      }
    });
  } catch (error) {
    console.error("Error resending technician password:", error);
    return NextResponse.json(
      { success: false, message: "Failed to resend technician password" },
      { status: 500 }
    );
  }
}
