import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { connectToDatabase } from "@/app/lib/mongodb";
import nodemailer from "nodemailer";
import { verifyToken, getTokenFromRequest } from "@/app/lib/auth";

// Define the expected request body structure
interface ContactForm {
  name: string;
  phone: string;
  service: string;
  description?: string;
  userId?: string;
}

// JWT payload interface
interface JwtPayload {
  userId: string;
  email: string;
  role?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { name, phone, service, description }: ContactForm = await request.json();

    // Validate input
    if (!name || !phone || !service) {
      return NextResponse.json(
        { success: false, error: "Name, phone, and service are required" },
        { status: 400 }
      );
    }

    // Validate phone number format
    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid 10-digit phone number" },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Generate a unique booking ID
    const lastBooking = await db
      .collection("bookings")
      .find({})
      .sort({ _id: -1 })
      .limit(1)
      .toArray();

    let bookingId = "BK001";

    if (lastBooking.length > 0 && lastBooking[0].bookingId) {
      const lastId = lastBooking[0].bookingId;
      const numericPart = parseInt(lastId.substring(2));
      bookingId = `BK${(numericPart + 1).toString().padStart(3, "0")}`;
    }

    // Map service codes to service names
    const serviceNames: { [key: string]: string } = {
      ac: "AC Repair",
      washing_machine: "Washing Machine Repair",
      fridge: "Refrigerator Repair",
      // Add more services as needed
    };

    const serviceName = serviceNames[service] || service;

    // Try to send email notification
    let emailSent = false;

    // Check if admin booking emails are disabled
    const sendAdminEmails = process.env.SEND_ADMIN_BOOKING_EMAILS !== "false";

    if (sendAdminEmails) {
      try {
        // Send Email
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: "singhvishalkumar412@gmail.com",
          subject: `New Booking Request: ${serviceName} (${bookingId})`,
          text: `
            Booking ID: ${bookingId}
            Name: ${name}
            Phone: ${phone}
            Service: ${serviceName}
            Description: ${description || "No description provided"}
          `,
        };

        const info = await transporter.sendMail(mailOptions);
        emailSent = info.accepted.length > 0;
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Continue with saving to database even if email fails
      }
    } else {
      console.log("Admin booking notification email skipped (disabled by configuration)");
      // Mark as sent to avoid confusion in the response
      emailSent = true;
    }

    // Create new booking
    await db.collection("bookings").insertOne({
      bookingId,
      name,
      phone,
      service,
      serviceName,
      description: description || "",
      status: "pending", // pending, confirmed, completed, cancelled
      paymentStatus: "pending", // pending, paid
      amount: 0, // Will be updated after service assessment
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Booking submitted successfully",
      bookingId,
      emailSent,
    });
  } catch (error) {
    console.error("Error submitting booking:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
