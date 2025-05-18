import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { Db } from "mongodb";

// Function to update service prices based on settings
async function updateServicePrices(db: Db, serviceCharges: any) {
  try {
    console.log("Updating service prices with charges:", serviceCharges);

    // Update AC service prices
    if (serviceCharges.acService > 0) {
      await db.collection("services").updateMany(
        {
          $or: [
            { type: "ac" },
            { category: "ac" },
            { title: { $regex: /AC|Air Conditioner/i } }
          ]
        },
        {
          $set: {
            "pricing.basic.price": `₹${serviceCharges.acService}`,
            "pricing.comprehensive.price": `₹${Math.round(serviceCharges.acService * 1.5)}`,
            updatedAt: new Date()
          }
        }
      );
    }

    // Update washing machine service prices
    if (serviceCharges.washingMachineService > 0) {
      await db.collection("services").updateMany(
        {
          $or: [
            { type: "washingmachine" },
            { category: "washingmachine" },
            { title: { $regex: /Washing Machine/i } }
          ]
        },
        {
          $set: {
            "pricing.basic.price": `₹${serviceCharges.washingMachineService}`,
            "pricing.comprehensive.price": `₹${Math.round(serviceCharges.washingMachineService * 1.5)}`,
            updatedAt: new Date()
          }
        }
      );
    }

    // Update refrigerator service prices
    if (serviceCharges.refrigeratorService > 0) {
      await db.collection("services").updateMany(
        {
          $or: [
            { type: "refrigerator" },
            { category: "refrigerator" },
            { title: { $regex: /Refrigerator|Fridge/i } }
          ]
        },
        {
          $set: {
            "pricing.basic.price": `₹${serviceCharges.refrigeratorService}`,
            "pricing.comprehensive.price": `₹${Math.round(serviceCharges.refrigeratorService * 1.5)}`,
            updatedAt: new Date()
          }
        }
      );
    }

    // Update microwave service prices
    if (serviceCharges.microwaveService > 0) {
      await db.collection("services").updateMany(
        {
          $or: [
            { type: "microwave" },
            { category: "microwave" },
            { title: { $regex: /Microwave/i } }
          ]
        },
        {
          $set: {
            "pricing.basic.price": `₹${serviceCharges.microwaveService}`,
            "pricing.comprehensive.price": `₹${Math.round(serviceCharges.microwaveService * 1.5)}`,
            updatedAt: new Date()
          }
        }
      );
    }

    // Update TV service prices
    if (serviceCharges.tvService > 0) {
      await db.collection("services").updateMany(
        {
          $or: [
            { type: "tv" },
            { category: "tv" },
            { title: { $regex: /TV|Television/i } }
          ]
        },
        {
          $set: {
            "pricing.basic.price": `₹${serviceCharges.tvService}`,
            "pricing.comprehensive.price": `₹${Math.round(serviceCharges.tvService * 1.5)}`,
            updatedAt: new Date()
          }
        }
      );
    }

    console.log("Service prices updated successfully");
  } catch (error) {
    console.error("Error updating service prices:", error);
    // Don't throw error to prevent settings update from failing
  }
}

// Get settings
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

    const decoded = verifyToken(token);

    if (!decoded || (decoded as {role?: string}).role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get settings
    const settings = await db.collection("settings").findOne({});

    if (!settings) {
      // Create default settings if none exist
      const defaultSettings = {
        siteName: "Dizit Solutions",
        siteEmail: "info@dizitsolutions.com",
        contactPhone: "9112564731",
        address: "Varanasi, Uttar Pradesh, India",
        serviceCharges: {
          acService: 1200,
          washingMachineService: 800,
          refrigeratorService: 1000,
          microwaveService: 600,
          tvService: 900,
        },
        taxRate: 18,
        paymentGateway: {
          razorpay: {
            enabled: false,
            keyId: "",
            keySecret: "",
            webhookSecret: "",
          },
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.collection("settings").insertOne(defaultSettings);

      return NextResponse.json({
        success: true,
        settings: defaultSettings,
      });
    }

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update settings
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

    const decoded = verifyToken(token);

    if (!decoded || (decoded as {role?: string}).role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Parse request body
    const updateData = await request.json();

    // Validate required fields
    if (!updateData.siteName || !updateData.siteEmail || !updateData.contactPhone) {
      return NextResponse.json(
        { success: false, message: "Site name, email, and contact phone are required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Check if settings exist
    const existingSettings = await db.collection("settings").findOne({});

    if (!existingSettings) {
      // Create new settings
      const newSettings = {
        ...updateData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.collection("settings").insertOne(newSettings);

      return NextResponse.json({
        success: true,
        message: "Settings created successfully",
        settings: newSettings,
      });
    }

    // Update settings
    console.log("Updating settings with data:", JSON.stringify(updateData, null, 2));

    // Extract service charges with proper type conversion
    const serviceCharges = {
      acService: parseFloat(String(updateData.serviceCharges?.acService)) || 0,
      washingMachineService: parseFloat(String(updateData.serviceCharges?.washingMachineService)) || 0,
      refrigeratorService: parseFloat(String(updateData.serviceCharges?.refrigeratorService)) || 0,
      microwaveService: parseFloat(String(updateData.serviceCharges?.microwaveService)) || 0,
      tvService: parseFloat(String(updateData.serviceCharges?.tvService)) || 0,
    };

    console.log("Extracted service charges:", serviceCharges);

    // Create a clean update object without any potential circular references
    const cleanUpdateData = {
      siteName: updateData.siteName || "",
      siteEmail: updateData.siteEmail || "",
      contactPhone: updateData.contactPhone || "",
      address: updateData.address || "",
      serviceCharges: serviceCharges,
      taxRate: parseFloat(String(updateData.taxRate)) || 0,
      paymentGateway: {
        razorpay: {
          enabled: Boolean(updateData.paymentGateway?.razorpay?.enabled),
          keyId: updateData.paymentGateway?.razorpay?.keyId || "",
          keySecret: updateData.paymentGateway?.razorpay?.keySecret || "",
          webhookSecret: updateData.paymentGateway?.razorpay?.webhookSecret || "",
        },
      },
      updatedAt: new Date().toISOString()
    };

    console.log("Clean update data:", JSON.stringify(cleanUpdateData, null, 2));

    // Update the settings document
    const result = await db.collection("settings").updateOne(
      { _id: existingSettings._id },
      { $set: cleanUpdateData }
    );

    // Also update service prices in the services collection
    await updateServicePrices(db, serviceCharges);

    // Check if any changes were made
    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, message: "No changes made to the settings" },
        { status: 304 }
      );
    }

    // Get updated settings
    const updatedSettings = await db.collection("settings").findOne({ _id: existingSettings._id });

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      settings: updatedSettings,
    });
  } catch (error) {
    console.error("Error updating settings:", error);

    // Provide more detailed error message
    let errorMessage = "Internal server error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String((error as any).message);
    }

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
