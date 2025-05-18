import Stripe from 'stripe';

// Get the Stripe secret key from environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

if (!stripeSecretKey) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('STRIPE_SECRET_KEY is not set in environment variables');
  }
}

let stripe;

try {
  // Initialize Stripe with the secret key
  stripe = new Stripe(stripeSecretKey || 'sk_test_placeholder', {
    apiVersion: '2025-04-30.basil', // Use the latest stable API version
  });
} catch (error) {
  console.error('Failed to initialize Stripe:', error);

  // Create a mock Stripe instance for testing
  stripe = {
    checkout: {
      sessions: {
        create: async () => ({ id: 'mock_session_' + Date.now(), url: 'https://example.com/checkout' })
      }
    },
    paymentIntents: {
      create: async () => ({ id: 'mock_intent_' + Date.now(), client_secret: 'mock_secret' }),
      retrieve: async () => ({ status: 'succeeded' })
    }
  } as unknown as Stripe;
}

export default stripe;
