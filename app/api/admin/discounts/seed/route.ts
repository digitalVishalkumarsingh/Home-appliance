import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";
import { ObjectId } from "mongodb";

// Seed discounts for testing
export async function GET(request: Request) {
  try {
    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Check if there are any existing discounts
    const existingDiscounts = await db.collection("discounts").countDocuments();
    
    if (existingDiscounts > 0) {
      return NextResponse.json({
        success: true,
        message: "Discounts already exist in the database",
        count: existingDiscounts
      });
    }

    // Get service categories
    const categories = await db.collection("serviceCategories").find({}).toArray();
    
    // If no categories found, create default ones
    let acCategory;
    let washingMachineCategory;
    
    if (categories.length === 0) {
      // Create default categories
      const defaultCategories = [
        {
          name: "AC Services",
          slug: "ac-services",
          description: "All air conditioner related services",
          imageUrl: "/images/services/ac-service.jpg",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          name: "Washing Machine Services",
          slug: "washing-machine-services",
          description: "All washing machine related services",
          imageUrl: "/images/services/washing-machine.jpg",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      const result = await db.collection("serviceCategories").insertMany(defaultCategories);
      
      // Get the inserted categories
      acCategory = {
        _id: result.insertedIds[0],
        ...defaultCategories[0]
      };
      
      washingMachineCategory = {
        _id: result.insertedIds[1],
        ...defaultCategories[1]
      };
    } else {
      // Find AC and Washing Machine categories
      acCategory = categories.find(c => 
        c.slug === "ac-services" || 
        c.name.toLowerCase().includes("ac") || 
        c.name.toLowerCase().includes("air conditioner")
      );
      
      washingMachineCategory = categories.find(c => 
        c.slug === "washing-machine-services" || 
        c.name.toLowerCase().includes("washing") || 
        c.name.toLowerCase().includes("laundry")
      );
      
      // If categories not found, use the first two categories
      if (!acCategory && categories.length > 0) {
        acCategory = categories[0];
      }
      
      if (!washingMachineCategory && categories.length > 1) {
        washingMachineCategory = categories[1];
      } else if (!washingMachineCategory && categories.length > 0) {
        washingMachineCategory = categories[0];
      }
    }
    
    // Create sample discounts
    const now = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    
    const sampleDiscounts = [];
    
    if (acCategory) {
      sampleDiscounts.push({
        name: "Summer AC Special",
        description: "Special discount on all AC services for the summer season",
        categoryId: acCategory._id.toString(),
        categoryName: acCategory.name,
        discountType: "percentage",
        discountValue: 15,
        startDate: now.toISOString(),
        endDate: oneMonthLater.toISOString(),
        isActive: true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      });
    }
    
    if (washingMachineCategory) {
      sampleDiscounts.push({
        name: "Monsoon Washing Machine Offer",
        description: "Special discount on all washing machine services during monsoon",
        categoryId: washingMachineCategory._id.toString(),
        categoryName: washingMachineCategory.name,
        discountType: "fixed",
        discountValue: 200,
        startDate: now.toISOString(),
        endDate: oneMonthLater.toISOString(),
        isActive: true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      });
    }
    
    // Add a general discount for all services
    if (acCategory) {
      sampleDiscounts.push({
        name: "New User Special",
        description: "Special discount for new users on their first booking",
        categoryId: acCategory._id.toString(), // Using AC category as a fallback
        categoryName: "All Services",
        discountType: "percentage",
        discountValue: 10,
        startDate: now.toISOString(),
        endDate: oneMonthLater.toISOString(),
        isActive: true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      });
    }
    
    // Insert discounts
    if (sampleDiscounts.length > 0) {
      const result = await db.collection("discounts").insertMany(sampleDiscounts);
      
      return NextResponse.json({
        success: true,
        message: "Sample discounts created successfully",
        count: result.insertedCount,
        discounts: sampleDiscounts.map((discount, index) => ({
          ...discount,
          _id: result.insertedIds[index]
        }))
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "No categories found to create discounts"
      }, { status: 400 });
    }
  } catch (error) {
    console.error("Error seeding discounts:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
