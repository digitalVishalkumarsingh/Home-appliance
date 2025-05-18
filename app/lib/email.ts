import nodemailer from "nodemailer";
import { logger } from "@/app/config/logger";
import { getPhoneNumber } from "@/app/utils/contactInfo";

// SMS provider mock (replace with actual SMS provider in production)
const sendSMS = async (phone: string, message: string): Promise<boolean> => {
  try {
    // This is a mock implementation
    console.log(`[SMS MOCK] Sending SMS to ${phone}: ${message}`);
    // In production, integrate with an actual SMS provider like Twilio, MessageBird, etc.
    return true;
  } catch (error) {
    console.error('SMS sending error:', error);
    return false;
  }
};

// Email configuration
export const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    logger.warn("Email credentials not configured. Check your .env.local file.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

// Send password reset email
export const sendPasswordResetEmail = async (
  email: string,
  resetUrl: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset - Dizit Solutions",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #3b82f6; text-align: center;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>You requested a password reset for your Dizit Solutions account. Please click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </div>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
          <p>Thank you,<br>Dizit Solutions Team</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
            <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
            <p>${resetUrl}</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info("Password reset email sent", { email });
    return info.accepted.length > 0;
  } catch (error) {
    logger.error("Failed to send password reset email", {
      error: error instanceof Error ? error.message : "Unknown error",
      email,
    });
    return false;
  }
};

// Send booking confirmation email to customer
export const sendBookingConfirmationEmail = async (
  bookingDetails: {
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
  }
): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    const {
      customerName,
      customerEmail,
      // customerPhone is used in the admin notification but not in customer email
      customerAddress,
      service,
      amount,
      bookingDate,
      bookingTime,
      paymentId,
      orderId
    } = bookingDetails;

    // Format amount to Indian Rupees
    const formattedAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);

    // Format date if available
    let formattedDate = 'To be confirmed';
    if (bookingDate) {
      try {
        const date = new Date(bookingDate);
        formattedDate = date.toLocaleDateString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        if (bookingTime) {
          formattedDate += ` at ${bookingTime}`;
        }
      } catch (error) {
        formattedDate = `${bookingDate} ${bookingTime || ''}`;
      }
    }

    const supportPhone = getPhoneNumber();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: customerEmail,
      subject: `Booking Confirmation - ${service} - Dizit Solutions`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #3b82f6; text-align: center;">Booking Confirmation</h2>

          <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px;">Thank you for booking with Dizit Solutions!</p>
          </div>

          <p>Hello ${customerName},</p>
          <p>Your booking for <strong>${service}</strong> has been confirmed. We're looking forward to serving you.</p>

          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #4b5563; margin-top: 0;">Booking Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Service:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${service}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Appointment:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Amount Paid:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${formattedAmount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Address:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${customerAddress}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Payment ID:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${paymentId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Order ID:</td>
                <td style="padding: 8px 0; font-weight: 500;">${orderId}</td>
              </tr>
            </table>
          </div>

          <p>Our team will contact you shortly to confirm the exact time of service. If you need to make any changes to your booking, please contact us at <a href="tel:${supportPhone}" style="color: #3b82f6; text-decoration: none;">${supportPhone}</a>.</p>

          <div style="text-align: center; margin: 30px 0;">
            <p style="margin-bottom: 10px; font-weight: bold;">Need help or have questions?</p>
            <a href="tel:${supportPhone}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Call Us</a>
          </div>

          <p>Thank you for choosing Dizit Solutions for your home service needs.</p>
          <p>Best regards,<br>Dizit Solutions Team</p>

          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #6b7280; text-align: center;">
            <p>© ${new Date().getFullYear()} Dizit Solutions. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info("Booking confirmation email sent", { email: customerEmail });
    return info.accepted.length > 0;
  } catch (error) {
    logger.error("Failed to send booking confirmation email", {
      error: error instanceof Error ? error.message : "Unknown error",
      email: bookingDetails.customerEmail,
    });
    return false;
  }
};

// Send booking update email (reschedule or cancellation)
export const sendBookingUpdateEmail = async (
  updateDetails: {
    type: 'reschedule' | 'cancellation';
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
  }
): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    const {
      type,
      customerName,
      customerEmail,
      service,
      bookingDate,
      bookingTime,
      oldDate,
      oldTime,
      newDate,
      newTime,
      reason,
      bookingId,
      orderId
    } = updateDetails;

    const supportPhone = getPhoneNumber();

    // Determine email subject and content based on update type
    let subject = '';
    let title = '';
    let message = '';
    let actionText = '';
    let actionColor = '';
    let detailsHtml = '';

    if (type === 'reschedule') {
      subject = `Booking Rescheduled - ${service} - Dizit Solutions`;
      title = 'Booking Rescheduled';
      message = `Your booking for <strong>${service}</strong> has been rescheduled as requested.`;
      actionText = 'Rescheduled';
      actionColor = '#3b82f6'; // blue

      // Format dates for display
      const formattedOldDate = oldDate ? new Date(oldDate).toLocaleDateString('en-IN') : 'Not specified';
      const formattedNewDate = newDate ? new Date(newDate).toLocaleDateString('en-IN') : 'Not specified';

      detailsHtml = `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Previous Date:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${formattedOldDate} ${oldTime || ''}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">New Date:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${formattedNewDate} ${newTime || ''}</td>
        </tr>
      `;
    } else if (type === 'cancellation') {
      subject = `Booking Cancelled - ${service} - Dizit Solutions`;
      title = 'Booking Cancelled';
      message = `Your booking for <strong>${service}</strong> has been cancelled as requested.`;
      actionText = 'Cancelled';
      actionColor = '#ef4444'; // red

      // Format date for display
      const formattedDate = bookingDate ? new Date(bookingDate).toLocaleDateString('en-IN') : 'Not specified';

      detailsHtml = `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Booking Date:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${formattedDate} ${bookingTime || ''}</td>
        </tr>
        ${reason ? `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Cancellation Reason:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${reason}</td>
        </tr>
        ` : ''}
      `;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: customerEmail,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: ${actionColor}; text-align: center;">${title}</h2>

          <div style="background-color: #f0f9ff; border-left: 4px solid ${actionColor}; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px;">Your booking has been ${actionText.toLowerCase()}!</p>
          </div>

          <p>Hello ${customerName},</p>
          <p>${message}</p>

          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #4b5563; margin-top: 0;">Booking Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Service:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${service}</td>
              </tr>
              ${detailsHtml}
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Booking ID:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${bookingId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Order ID:</td>
                <td style="padding: 8px 0; font-weight: 500;">${orderId}</td>
              </tr>
            </table>
          </div>

          <p>If you have any questions or need further assistance, please contact our support team at <a href="tel:${supportPhone}" style="color: #3b82f6; text-decoration: none;">${supportPhone}</a>.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="tel:${supportPhone}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Call Us</a>
          </div>

          <p>Thank you for choosing Dizit Solutions for your home service needs.</p>
          <p>Best regards,<br>Dizit Solutions Team</p>

          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #6b7280; text-align: center;">
            <p>© ${new Date().getFullYear()} Dizit Solutions. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Booking ${type} email sent`, { email: customerEmail });

    // Also send SMS notification if we have a phone number
    if (updateDetails.customerPhone) {
      try {
        await sendSMS(
          updateDetails.customerPhone,
          `Dizit Solutions: Your booking for ${service} has been ${actionText.toLowerCase()}. ${
            type === 'reschedule' ? `New appointment: ${newDate} ${newTime}` : ''
          } For details, check your email.`
        );
      } catch (smsError) {
        logger.error("Failed to send SMS notification", {
          error: smsError instanceof Error ? smsError.message : "Unknown error",
        });
      }
    }

    return info.accepted.length > 0;
  } catch (error) {
    logger.error(`Failed to send booking ${updateDetails.type} email`, {
      error: error instanceof Error ? error.message : "Unknown error",
      email: updateDetails.customerEmail,
    });
    return false;
  }
};

// Send booking reminder email
export const sendBookingReminderEmail = async (
  reminderDetails: {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    service: string;
    bookingDate: string;
    bookingTime: string;
    bookingId: string;
    orderId: string;
    hoursRemaining: number;
  }
): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    const {
      customerName,
      customerEmail,
      customerPhone,
      service,
      bookingDate,
      bookingTime,
      bookingId,
      // orderId is not used in this function but is part of the interface
      hoursRemaining
    } = reminderDetails;

    const supportPhone = getPhoneNumber();

    // Format date for display
    const formattedDate = new Date(bookingDate).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Determine reminder type based on hours remaining
    let reminderType = 'upcoming';
    if (hoursRemaining <= 24) {
      reminderType = 'tomorrow';
    } else if (hoursRemaining <= 4) {
      reminderType = 'today';
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: customerEmail,
      subject: `Reminder: Your ${service} Appointment - Dizit Solutions`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #3b82f6; text-align: center;">Appointment Reminder</h2>

          <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px;">Your service appointment is ${reminderType === 'today' ? 'today' : reminderType === 'tomorrow' ? 'tomorrow' : 'coming up'}!</p>
          </div>

          <p>Hello ${customerName},</p>
          <p>This is a friendly reminder about your upcoming appointment for <strong>${service}</strong>.</p>

          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #4b5563; margin-top: 0;">Appointment Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Service:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${service}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Date:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Time:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${bookingTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Booking ID:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${bookingId}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;">
              <strong>Please note:</strong> Our technician will arrive within the scheduled time slot.
              Please ensure someone is available at the location to provide access.
            </p>
          </div>

          <p>If you need to reschedule or have any questions, please contact our support team at <a href="tel:${supportPhone}" style="color: #3b82f6; text-decoration: none;">${supportPhone}</a>.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="tel:${supportPhone}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Call Us</a>
          </div>

          <p>Thank you for choosing Dizit Solutions for your home service needs.</p>
          <p>Best regards,<br>Dizit Solutions Team</p>

          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #6b7280; text-align: center;">
            <p>© ${new Date().getFullYear()} Dizit Solutions. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info("Booking reminder email sent", { email: customerEmail });

    // Also send SMS reminder if we have a phone number
    if (customerPhone) {
      try {
        await sendSMS(
          customerPhone,
          `Dizit Solutions: Reminder for your ${service} appointment ${reminderType === 'today' ? 'today' : reminderType === 'tomorrow' ? 'tomorrow' : 'on ' + formattedDate} at ${bookingTime}. For assistance, call ${supportPhone}.`
        );
      } catch (smsError) {
        logger.error("Failed to send SMS reminder", {
          error: smsError instanceof Error ? smsError.message : "Unknown error",
        });
      }
    }

    return info.accepted.length > 0;
  } catch (error) {
    logger.error("Failed to send booking reminder email", {
      error: error instanceof Error ? error.message : "Unknown error",
      email: reminderDetails.customerEmail,
    });
    return false;
  }
};

// Send booking notification to admin
export const sendAdminBookingNotificationEmail = async (
  bookingDetails: {
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
  }
): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    const {
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      service,
      amount,
      bookingDate,
      bookingTime,
      paymentId,
      orderId
    } = bookingDetails;

    // Format amount to Indian Rupees
    const formattedAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);

    // Admin email (could be configured in .env)
    const adminEmail = process.env.ADMIN_EMAIL || "singhvishalkumar412@gmail.com";

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmail,
      subject: `New Booking: ${service} - ${customerName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #3b82f6; text-align: center;">New Booking Notification</h2>

          <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px;">A new booking has been made!</p>
          </div>

          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #4b5563; margin-top: 0;">Booking Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Customer:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${customerName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Phone:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${customerPhone}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Email:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${customerEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Service:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${service}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Date/Time:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${bookingDate || 'Not specified'} ${bookingTime || ''}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Amount:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${formattedAmount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Address:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${customerAddress}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Payment ID:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${paymentId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Order ID:</td>
                <td style="padding: 8px 0; font-weight: 500;">${orderId}</td>
              </tr>
            </table>
          </div>

          <p>Please log in to the admin dashboard to manage this booking.</p>

          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #6b7280; text-align: center;">
            <p>© ${new Date().getFullYear()} Dizit Solutions. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info("Admin booking notification email sent", { adminEmail });
    return info.accepted.length > 0;
  } catch (error) {
    logger.error("Failed to send admin booking notification email", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
};
