import Razorpay from "razorpay";
import {logger} from "../config/logger"

// Environment variables
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const isDevelopment = process.env.NODE_ENV !== "production";

// Validate environment variables
if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  const errorMessage = "Missing Razorpay configuration";
  logger.error(errorMessage, {
    RAZORPAY_KEY_ID: RAZORPAY_KEY_ID ? "Set" : "Not set",
    RAZORPAY_KEY_SECRET: RAZORPAY_KEY_SECRET ? "Set" : "Not set",
  });
  throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set");
}

// Validate key format
if (!RAZORPAY_KEY_ID.startsWith("rzp_")) {
  const errorMessage = "Invalid RAZORPAY_KEY_ID format; must start with 'rzp_'";
  logger.error(errorMessage);
  throw new Error(errorMessage);
}

// Initialize Razorpay instance
let razorpay: Razorpay;

try {
  logger.info("Initializing Razorpay instance");
  razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
  logger.info("Razorpay initialized successfully");
} catch (error) {
  logger.error("Failed to initialize Razorpay", {
    error: error instanceof Error ? error.message : "Unknown error",
    stack: isDevelopment && error instanceof Error ? error.stack : undefined,
  });
  throw error;
}

export default razorpay;