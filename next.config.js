/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // These options should be at the top level, not in experimental.middleware
  skipMiddlewareUrlNormalize: true,
  skipTrailingSlashRedirect: true,

  // Disable React StrictMode in production to avoid double-rendering issues
  reactStrictMode: process.env.NODE_ENV !== 'production',

  // Increase serverless function timeout for Vercel
  serverRuntimeConfig: {
    maxDuration: 60, // 60 seconds
  },

  // Handle trailing slashes consistently
  trailingSlash: false,

  // Increase static generation timeout
  staticPageGenerationTimeout: 120,

  // Add powered by header
  poweredByHeader: false,

  // Configure output mode for better performance
  output: 'standalone',
};

module.exports = nextConfig;
