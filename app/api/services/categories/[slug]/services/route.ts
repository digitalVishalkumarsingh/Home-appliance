import { NextResponse } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import { ObjectId } from "mongodb";
import { services as staticServices } from "@/app/lib/services";

// Get services for a specific category
export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    // Get params from context
    const params = await context.params;
    const slug = params.slug;

    if (!slug) {
      return NextResponse.json(
        { success: false, message: "Category slug is required" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Find the category by slug
    const category = await db.collection("serviceCategories").findOne({ slug });

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Service category not found" },
        { status: 404 }
      );
    }

    // Find services for this category
    const services = await db
      .collection("services")
      .find({
        $or: [
          { categoryId: category._id.toString() },
          { categoryId: category.slug },
          { category: category.slug },
          { type: slug.replace('-services', '') }
        ],
        isActive: true
      })
      .toArray();

    // If no services found in database, filter static services
    if (!services || services.length === 0) {
      // Map category slug to service type
      const typeMap: Record<string, string> = {
        'ac-services': 'ac',
        'washing-machine-services': 'washingmachine',
        'refrigerator-services': 'refrigerator',
        'microwave-services': 'microwave',
        'tv-services': 'tv'
      };

      const serviceType = typeMap[slug] || slug.replace('-services', '');

      // Filter static services by type
      const filteredServices = staticServices.filter(service =>
        service.type === serviceType ||
        service.category === slug ||
        (service.id && service.id.includes(serviceType))
      );

      if (filteredServices.length > 0) {
        return NextResponse.json({
          success: true,
          services: filteredServices,
          source: "static"
        });
      }

      // If no matching static services, return empty array
      return NextResponse.json({
        success: true,
        services: [],
        source: "none"
      });
    }

    return NextResponse.json({
      success: true,
      services,
      source: "database"
    });
  } catch (error) {
    console.error("Error fetching services for category:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
