import nodemailer from "nodemailer";
import twilio from "twilio";
import { logger } from "../config/logger";
import { getPhoneNumber } from "../utils/contactInfo";
import { formatCurrency, formatDate } from "./utils";

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Check email configuration
const emailConfigured = !!(EMAIL_USER && EMAIL_PASS && ADMIN_EMAIL);
if (!emailConfigured) {
  logger.warn("Email configuration incomplete", {
    hasEmailUser: !!EMAIL_USER,
    hasEmailPass: !!EMAIL_PASS,
    hasAdminEmail: !!ADMIN_EMAIL,
  });
  console.warn("Email sending will be disabled due to missing configuration");
}

// Check Twilio configuration (optional for SMS)
const twilioConfigured = !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER);
let twilioClient: ReturnType<typeof twilio> | null = null;

if (twilioConfigured) {
  try {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    logger.info("Twilio SMS configured successfully");
  } catch (error) {
    logger.error("Failed to initialize Twilio client", { error });
    console.warn("SMS sending will be disabled due to Twilio configuration error");
  }
} else {
  logger.warn("Twilio configuration incomplete - SMS sending disabled", {
    hasTwilioSid: !!TWILIO_ACCOUNT_SID,
    hasTwilioToken: !!TWILIO_AUTH_TOKEN,
    hasTwilioPhone: !!TWILIO_PHONE_NUMBER,
  });
}

export const createTransporter = () => {
  if (!emailConfigured) {
    throw new Error("Email configuration is incomplete");
  }
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
};

const createEmailTemplate = (
  title: string,
  headerMessage: string,
  content: string,
  detailsHtml: string,
  action?: { text: string; url: string; color?: string },
  footerMessage: string = "Thank you for choosing Dizit Solutions for your home service needs."
) => {
  const supportPhone = getPhoneNumber();
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: ${action?.color || "#3b82f6"}; text-align: center;">${title}</h2>
      <div style="background-color: #f0f9ff; border-left: 4px solid ${action?.color || "#3b82f6"}; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-size: 16px;">${headerMessage}</p>
      </div>
      <p>Hello ${content.includes("Hello") ? "" : content.split(",")[0] || "Customer"},</p>
      ${content}
      ${detailsHtml ? `
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #4b5563; margin-top: 0;">Details:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${detailsHtml}
        </table>
      </div>` : ""}
      ${action ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${action.url}" style="background-color: ${action.color || "#3b82f6"}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">${action.text}</a>
      </div>` : ""}
      <p>If you have any questions, contact our support team at <a href="tel:${supportPhone}" style="color: #3b82f6; text-decoration: none;">${supportPhone}</a>.</p>
      <p>${footerMessage}</p>
      <p>Best regards,<br>Dizit Solutions Team</p>
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #6b7280; text-align: center;">
        <p>© ${new Date().getFullYear()} Dizit Solutions. All rights reserved.</p>
      </div>
    </div>
  `;
};

async function sendSMS(phone: string, message: string): Promise<boolean> {
  try {
    if (!twilioConfigured || !twilioClient) {
      logger.warn("SMS sending skipped - Twilio not configured", { phone: "[REDACTED]" });
      return false;
    }

    await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: phone.startsWith("+") ? phone : `+91${phone}`,
    });
    await logger.info("SMS sent successfully", { phone: "[REDACTED]" });
    return true;
  } catch (error) {
    await logger.error("Failed to send SMS", { error: error instanceof Error ? error.message : "Unknown error", phone: "[REDACTED]" });
    return false; // Don't throw error, just return false
  }
}

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
  try {
    const transporter = createTransporter();
    const resetUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "https://dizitsolutions.com"}/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: EMAIL_USER,
      to: email,
      subject: "Password Reset - Dizit Solutions",
      html: createEmailTemplate(
        "Password Reset Request",
        "Your password reset request has been received!",
        `You requested a password reset for your Dizit Solutions account. This link will expire in 1 hour. If you didn't request this, please ignore this email or contact support.`,
        "",
        { text: "Reset Password", url: resetUrl }
      ),
    };
    const info = await transporter.sendMail(mailOptions);
    await logger.info("Password reset email sent", { email: "[REDACTED]" });
    return info.accepted.length > 0;
  } catch (error) {
    await logger.error("Failed to send password reset email", { error: error instanceof Error ? error.message : "Unknown error", email: "[REDACTED]" });
    throw error;
  }
}

export async function sendBookingConfirmationEmail(bookingDetails: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  service: string;
  amount: number;
  bookingDate?: string;
  bookingTime?: string;
  paymentId: string;
  orderId: string;
}): Promise<boolean> {
  try {
    const transporter = createTransporter();
    const { customerEmail, customerAddress, service, amount, bookingDate, bookingTime, paymentId, orderId } = bookingDetails;
    const formattedAmount = formatCurrency(amount);
    let formattedDate = "To be confirmed";
    if (bookingDate) {
      try {
        formattedDate = await formatDate(bookingDate, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        if (bookingTime) formattedDate += ` at ${bookingTime}`;
      } catch (_error) {
        await logger.warn("Invalid booking date format", { bookingDate, bookingTime });
        formattedDate = `${bookingDate} ${bookingTime || ""}`;
      }
    }

    const detailsHtml = `
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Service:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${service}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Appointment:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${formattedDate}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Amount Paid:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${formattedAmount}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Address:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${customerAddress}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Payment ID:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${paymentId}</td></tr>
      <tr><td style="padding: 8px 0; color: #6b7280;">Order ID:</td><td style="padding: 8px 0; font-weight: 500;">${orderId}</td></tr>
    `;

    const mailOptions = {
      from: EMAIL_USER,
      to: customerEmail,
      subject: `Booking Confirmation - ${service} - Dizit Solutions`,
      html: createEmailTemplate(
        "Booking Confirmation",
        "Thank you for booking with Dizit Solutions!",
        `Your booking for <strong>${service}</strong> has been confirmed. A technician will be assigned shortly. We'll contact you to confirm the exact time of service.`,
        detailsHtml
      ),
    };

    const info = await transporter.sendMail(mailOptions);
    await logger.info("Booking confirmation email sent", { email: "[REDACTED]" });
    return info.accepted.length > 0;
  } catch (error) {
    await logger.error("Failed to send booking confirmation email", { error: error instanceof Error ? error.message : "Unknown error", email: "[REDACTED]" });
    throw error;
  }
}

export async function sendBookingUpdateEmail(updateDetails: {
  type: "reschedule" | "cancellation";
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  service: string;
  bookingDate?: string;
  bookingTime?: string;
  oldDate?: string;
  oldTime?: string;
  newDate?: string;
  newTime?: string;
  reason?: string;
  bookingId: string;
  orderId: string;
}): Promise<boolean> {
  try {
    const transporter = createTransporter();
    const { type, customerEmail, customerPhone, service, bookingDate, bookingTime, oldDate, oldTime, newDate, newTime, reason, bookingId, orderId } = updateDetails;

    let subject = "";
    let title = "";
    let message = "";
    let actionText = "";
    let detailsHtml = "";

    if (type === "reschedule") {
      subject = `Booking Rescheduled - ${service} - Dizit Solutions`;
      title = "Booking Rescheduled";
      message = `Your booking for <strong>${service}</strong> has been rescheduled as requested.`;
      actionText = "Rescheduled";
      const formattedOldDate = oldDate ? await formatDate(oldDate) : "Not specified";
      const formattedNewDate = newDate ? await formatDate(newDate) : "Not specified";
      detailsHtml = `
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Previous Date:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${formattedOldDate} ${oldTime || ""}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">New Date:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${formattedNewDate} ${newTime || ""}</td></tr>
      `;
    } else {
      subject = `Booking Cancelled - ${service} - Dizit Solutions`;
      title = "Booking Cancelled";
      message = `Your booking for <strong>${service}</strong> has been cancelled as requested.`;
      actionText = "Cancelled";
      const formattedDate = bookingDate ? await formatDate(bookingDate) : "Not specified";
      detailsHtml = `
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Booking Date:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${formattedDate} ${bookingTime || ""}</td></tr>
        ${reason ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Cancellation Reason:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${reason}</td></tr>` : ""}
      `;
    }

    detailsHtml += `
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Booking ID:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${bookingId}</td></tr>
      <tr><td style="padding: 8px 0; color: #6b7280;">Order ID:</td><td style="padding: 8px 0; font-weight: 500;">${orderId}</td></tr>
    `;

    const mailOptions = {
      from: EMAIL_USER,
      to: customerEmail,
      subject,
      html: createEmailTemplate(title, `Your booking has been ${actionText.toLowerCase()}!`, message, detailsHtml, undefined, ""),
    };

    const info = await transporter.sendMail(mailOptions);
    await logger.info(`Booking ${type} email sent`, { email: "[REDACTED]" });

    if (customerPhone) {
      await sendSMS(
        customerPhone,
        `Dizit Solutions: Your booking for ${service} has been ${actionText.toLowerCase()}. ${
          type === "reschedule" ? `New appointment: ${newDate} ${newTime}` : ""
        } For details, check your email.`
      );
    }

    return info.accepted.length > 0;
  } catch (error) {
    await logger.error(`Failed to send booking ${updateDetails.type} email or SMS`, { error: error instanceof Error ? error.message : "Unknown error", email: "[REDACTED]" });
    throw error;
  }
}

export async function sendBookingReminderEmail(reminderDetails: {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  service: string;
  bookingDate: string;
  bookingTime: string;
  bookingId: string;
  orderId: string;
  hoursRemaining: number;
}): Promise<boolean> {
  try {
    const transporter = createTransporter();
    const { customerEmail, customerPhone, service, bookingDate, bookingTime, bookingId, hoursRemaining } = reminderDetails;

    const formattedDate = await formatDate(bookingDate, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const reminderType = hoursRemaining <= 4 ? "today" : hoursRemaining <= 24 ? "tomorrow" : "upcoming";
    const detailsHtml = `
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Service:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${service}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Date:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${formattedDate}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Time:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${bookingTime}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Booking ID:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${bookingId}</td></tr>
    `;

    const mailOptions = {
      from: EMAIL_USER,
      to: customerEmail,
      subject: `Reminder: Your ${service} Appointment - Dizit Solutions`,
      html: createEmailTemplate(
        "Appointment Reminder",
        `Your service appointment is ${reminderType === "today" ? "today" : reminderType === "tomorrow" ? "tomorrow" : "coming up"}!`,
        `This is a friendly reminder about your upcoming appointment for <strong>${service}</strong>.<div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;"><p style="margin: 0; font-size: 14px;"><strong>Please note:</strong> Our technician will arrive within the scheduled time slot. Please ensure someone is available at the location to provide access.</p></div>`,
        detailsHtml
      ),
    };

    const info = await transporter.sendMail(mailOptions);
    await logger.info("Booking reminder email sent", { email: "[REDACTED]" });

    if (customerPhone) {
      await sendSMS(
        customerPhone,
        `Dizit Solutions: Reminder for your ${service} appointment ${
          reminderType === "today" ? "today" : reminderType === "tomorrow" ? "tomorrow" : "on " + formattedDate
        } at ${bookingTime}. For assistance, call ${getPhoneNumber()}.`
      );
    }

    return info.accepted.length > 0;
  } catch (error) {
    await logger.error("Failed to send booking reminder email or SMS", { error: error instanceof Error ? error.message : "Unknown error", email: "[REDACTED]" });
    throw error;
  }
}

export async function sendTechnicianCredentialsEmail(technicianDetails: {
  name: string;
  email: string;
  resetToken: string;
  phone: string;
}): Promise<boolean> {
  try {
    // Check if email is configured
    if (!emailConfigured) {
      await logger.warn("Email sending skipped - email not configured", { email: "[REDACTED]" });
      console.log("Email configuration missing, skipping technician credentials email");
      return false;
    }

    const transporter = createTransporter();
    const { name, email, resetToken, phone } = technicianDetails;
    const loginUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "https://dizitsolutions.com"}/reset-password?token=${resetToken}`;

    await logger.info("Sending technician credentials email", { email: "[REDACTED]" });

    const detailsHtml = `
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Email:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${email}</td></tr>
    `;

    const mailOptions = {
      from: EMAIL_USER,
      to: email,
      subject: "Welcome to Dizit Solutions - Your Technician Account",
      html: createEmailTemplate(
        "Welcome to Dizit Solutions!",
        "Your technician account has been created!",
        `We're excited to have you join our team. Please set your password using the link below. This link expires in 1 hour.<div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;"><p style="margin: 0; font-size: 14px;"><strong>Important:</strong> Set your password immediately to secure your account.</p></div>`,
        detailsHtml,
        { text: "Set Password", url: loginUrl }
      ),
    };

    const info = await transporter.sendMail(mailOptions);
    await logger.info("Technician credentials email sent", { email: "[REDACTED]", messageId: info.messageId });

    // Try to send SMS (optional)
    if (phone) {
      try {
        await sendSMS(
          phone,
          `Welcome to Dizit Solutions, ${name}! Set your password at ${loginUrl}.`
        );
      } catch (smsError) {
        logger.warn("SMS sending failed but continuing", { error: smsError });
      }
    }

    return info.accepted.length > 0;
  } catch (error) {
    await logger.error("Failed to send technician credentials email", { error: error instanceof Error ? error.message : "Unknown error", email: "[REDACTED]" });
    return false; // Don't throw error, just return false
  }
}

export async function sendAdminBookingNotificationEmail(bookingDetails: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  service: string;
  amount: number;
  bookingDate?: string;
  bookingTime?: string;
  paymentId: string;
  orderId: string;
}): Promise<boolean> {
  try {
    const sendAdminEmails = process.env.SEND_ADMIN_BOOKING_EMAILS !== "false";
    if (!sendAdminEmails) {
      await logger.info("Admin booking notification email skipped (disabled by configuration)");
      return true;
    }

    const transporter = createTransporter();
    const { customerName, customerAddress, service, amount, bookingDate, bookingTime, paymentId, orderId } = bookingDetails;

    const formattedAmount = formatCurrency(amount);
    const formattedDate = bookingDate ? await formatDate(bookingDate) : "Not specified";
    const detailsHtml = `
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Customer:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${customerName}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Phone:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">[REDACTED]</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Email:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">[REDACTED]</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Service:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${service}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Date/Time:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${formattedDate} ${bookingTime || ""}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Amount:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${formattedAmount}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Address:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${customerAddress}</td></tr>
      <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Payment ID:</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${paymentId}</td></tr>
      <tr><td style="padding: 8px 0; color: #6b7280;">Order ID:</td><td style="padding: 8px 0; font-weight: 500;">${orderId}</td></tr>
    `;

    const mailOptions = {
      from: EMAIL_USER,
      to: ADMIN_EMAIL,
      subject: `New Booking: ${service} - ${customerName}`,
      html: createEmailTemplate(
        "New Booking Notification",
        "A new booking has been made!",
        `Please log in to the admin dashboard to manage this booking.`,
        detailsHtml
      ),
    };

    const info = await transporter.sendMail(mailOptions);
    await logger.info("Admin booking notification email sent", { email: "[REDACTED]" });
    return info.accepted.length > 0;
  } catch (error) {
    await logger.error("Failed to send admin booking notification email", { error: error instanceof Error ? error.message : "Unknown error", email: "[REDACTED]" });
    throw error;
  }
}