# Dizit Solutions

This is a Next.js project for Dizit Solutions, a home appliance service provider.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
MONGODB_DB=Dizitsolution

# JWT Authentication
JWT_SECRET=your-jwt-secret-key-at-least-32-characters

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-app-password
ADMIN_EMAIL=admin@example.com

# Payment Gateway - Razorpay
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
RAZORPAY_WEBHOOK_SECRET=your-razorpay-webhook-secret

# Payment Gateway - Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key

# Admin Authentication
ADMIN_AUTH_SECRET=your-admin-secret-key
ADMIN_SECRET_KEY=your-admin-secret-key

# Cron Jobs
CRON_API_KEY=your-cron-api-key

# Public Environment Variables (accessible in browser)
NEXT_PUBLIC_WHATSAPP_NUMBER=9112564731
NEXT_PUBLIC_CALL_NUMBER=9112564731
NEXT_PUBLIC_PHONE=9112564731
```

## Deploy on Vercel

### Prerequisites

1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Install the Vercel CLI: `npm i -g vercel`

### Deployment Steps

1. **Set up environment variables in Vercel**:
   - Go to your project settings in the Vercel dashboard
   - Add all the environment variables from `.env.local`

2. **Deploy using Vercel CLI**:
   ```bash
   vercel
   ```

3. **Or deploy using GitHub integration**:
   - Connect your GitHub repository to Vercel
   - Configure the build settings
   - Deploy

### Troubleshooting Vercel Deployment

If you encounter issues with Vercel deployment:

1. **API Routes**: Make sure the `functions` pattern in `vercel.json` matches your actual API routes structure.
2. **Environment Variables**: Verify all required environment variables are set in Vercel.
3. **Build Errors**: Check the build logs for specific errors.
4. **Serverless Function Size**: If functions are too large, optimize imports or split into smaller functions.

## Features

- User authentication (login/signup)
- Admin dashboard
- Booking and payment functionality
- Service management
- Customer management
- Special offers and discounts
