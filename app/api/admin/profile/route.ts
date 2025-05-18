import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Get admin profile
export async function GET(request: Request) {
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
    let admin = await db.collection("admins").findOne(
      { _id: objectId },
      { projection: { password: 0 } } // Exclude password from the result
    );

    // If not found in admins collection, try the users collection with role=admin
    if (!admin) {
      admin = await db.collection("users").findOne(
        { _id: objectId, role: "admin" },
        { projection: { password: 0 } } // Exclude password from the result
      );
    }

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      admin
    });
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update admin profile
export async function PUT(request: Request) {
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
    const updateData = await request.json();

    // Validate required fields
    if (!updateData.name || !updateData.email) {
      return NextResponse.json(
        { success: false, message: "Name and email are required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Check if email is already in use by another admin
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(adminId);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Invalid admin ID format" },
        { status: 400 }
      );
    }

    // Check if email is already in use in either collection
    const existingAdminInAdminsCollection = await db.collection("admins").findOne({
      email: updateData.email,
      _id: { $ne: objectId }
    });

    const existingAdminInUsersCollection = await db.collection("users").findOne({
      email: updateData.email,
      _id: { $ne: objectId },
      role: "admin"
    });

    if (existingAdminInAdminsCollection || existingAdminInUsersCollection) {
      return NextResponse.json(
        { success: false, message: "Email is already in use by another admin" },
        { status: 400 }
      );
    }

    // First check which collection the admin is in
    const adminInAdminsCollection = await db.collection("admins").findOne({ _id: objectId });
    const adminInUsersCollection = await db.collection("users").findOne({ _id: objectId, role: "admin" });

    let result;
    let collectionName;

    if (adminInAdminsCollection) {
      // Update in admins collection
      result = await db.collection("admins").updateOne(
        { _id: objectId },
        {
          $set: {
            name: updateData.name,
            email: updateData.email,
            phone: updateData.phone || "",
            updatedAt: new Date().toISOString()
          }
        }
      );
      collectionName = "admins";
    } else if (adminInUsersCollection) {
      // Update in users collection
      result = await db.collection("users").updateOne(
        { _id: objectId, role: "admin" },
        {
          $set: {
            name: updateData.name,
            email: updateData.email,
            phone: updateData.phone || "",
            updatedAt: new Date().toISOString()
          }
        }
      );
      collectionName = "users";
    } else {
      return NextResponse.json(
        { success: false, message: "Admin not found in any collection" },
        { status: 404 }
      );
    }

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Admin not found" },
        { status: 404 }
      );
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, message: "No changes made to the profile" },
        { status: 304 }
      );
    }

    // Get updated admin profile from the correct collection
    const updatedAdmin = await db.collection(collectionName).findOne(
      { _id: objectId },
      { projection: { password: 0 } } // Exclude password from the result
    );

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      admin: updatedAdmin
    });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
