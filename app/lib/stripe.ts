import Stripe from "stripe";
import { logger } from "../config/logger";

// Environment variables
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_API_VERSION = process.env.STRIPE_API_VERSION || "2025-04-30.basil";
const ENABLE_STRIPE_MOCK = process.env.STRIPE_MOCK === "true";
const isDevelopment = process.env.NODE_ENV !== "production";

// Validate environment variables
if (!STRIPE_SECRET_KEY && !ENABLE_STRIPE_MOCK) {
  const errorMessage = "STRIPE_SECRET_KEY is not set in environment variables";
  if (isDevelopment) {
    logger.warn(errorMessage);
  } else {
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}

// Validate secret key format
if (STRIPE_SECRET_KEY && !STRIPE_SECRET_KEY.startsWith("sk_") && !STRIPE_SECRET_KEY.startsWith("rk_")) {
  const errorMessage = "Invalid STRIPE_SECRET_KEY format; must start with 'sk_' or 'rk_'";
  logger.error(errorMessage);
  throw new Error(errorMessage);
}

// Validate API version (basic check)
const VALID_API_VERSIONS = ["2025-04-30.basil", "2024-11-21", "2024-06-20"]; // Update as needed
if (!VALID_API_VERSIONS.includes(STRIPE_API_VERSION)) {
  logger.warn(`Unrecognized STRIPE_API_VERSION: ${STRIPE_API_VERSION}. Using default.`);
}

// Mock Stripe instance for testing
const createMockStripe = (): Stripe => {
  return {
    checkout: {
      sessions: {
        create: async (params: Stripe.Checkout.SessionCreateParams) => {
          const amount = params.line_items?.[0]?.price_data?.unit_amount || 0;
          const currency = params.line_items?.[0]?.price_data?.currency || params.currency || "INR";
          await logger.info("Mock Stripe checkout session created", {
            amount: amount / 100, // Convert cents to currency unit
            currency,
            mode: params.mode,
          });
          return {
            id: `mock_session_${Date.now()}`,
            url: params.success_url || "https://example.com/checkout",
            amount_total: amount,
            currency,
            status: "open",
          } as Stripe.Checkout.Session;
        },
      },
    },
    paymentIntents: {
      create: async (params: Stripe.PaymentIntentCreateParams) => {
        await logger.info("Mock Stripe payment intent created", {
          amount: params.amount / 100,
          currency: params.currency,
        });
        return {
          id: `mock_intent_${Date.now()}`,
          client_secret: `mock_secret_${Date.now()}`,
          amount: params.amount,
          currency: params.currency,
          status: "requires_payment_method",
        } as Stripe.PaymentIntent;
      },
      retrieve: async (id: string) => {
        await logger.info("Mock Stripe payment intent retrieved", { intentId: id });
        return {
          id,
          status: "succeeded",
          amount: 1000, // Default mock amount
          currency: "INR",
        } as Stripe.PaymentIntent;
      },
    },
    customers: {
      create: async (params: Stripe.CustomerCreateParams) => {
        await logger.info("Mock Stripe customer created", { email: params.email ? "[REDACTED]" : undefined });
        return {
          id: `mock_customer_${Date.now()}`,
          email: params.email,
        } as Stripe.Customer;
      },
    },
  } as Stripe;
};

let stripe: Stripe;

try {
  if (ENABLE_STRIPE_MOCK) {
    await logger.info("Initializing Stripe in mock mode");
    stripe = createMockStripe();
  } else {
    stripe = new Stripe(STRIPE_SECRET_KEY!, {
      apiVersion: STRIPE_API_VERSION as Stripe.LatestApiVersion,
      typescript: true,
    });
    await logger.info("Stripe initialized successfully", { apiVersion: STRIPE_API_VERSION });
  }
} catch (error) {
  await logger.error("Failed to initialize Stripe", {
    error: error instanceof Error ? error.message : "Unknown error",
    stack: isDevelopment ? (error instanceof Error ? error.stack : undefined) : undefined,
  });

  if (isDevelopment || ENABLE_STRIPE_MOCK) {
    await logger.warn("Falling back to mock Stripe instance due to initialization failure");
    stripe = createMockStripe();
  } else {
    throw new Error("Stripe initialization failed in production");
  }
}

export default stripe;