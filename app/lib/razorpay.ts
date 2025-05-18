// Use require for Razorpay to avoid ESM issues
const Razorpay = require('razorpay');

// Initialize Razorpay with the API keys from environment variables
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

// Create a mock Razorpay instance if keys are missing
let razorpay;

try {
  if (!keyId || !keySecret) {
    console.warn('RAZORPAY_KEY_ID and/or RAZORPAY_KEY_SECRET environment variables are missing');

    // Create a mock Razorpay instance for testing
    razorpay = {
      orders: {
        create: async () => ({ id: 'mock_order_' + Date.now() })
      },
      payments: {
        fetch: async () => ({ status: 'created' }),
        capture: async () => ({ status: 'captured' })
      }
    };
  } else {
    // Initialize real Razorpay instance
    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
} catch (error) {
  console.error('Failed to initialize Razorpay:', error);

  // Create a mock Razorpay instance as fallback
  razorpay = {
    orders: {
      create: async () => ({ id: 'mock_order_' + Date.now() })
    },
    payments: {
      fetch: async () => ({ status: 'created' }),
      capture: async () => ({ status: 'captured' })
    }
  };
}

export default razorpay;
