import { jwtVerify, SignJWT } from 'jose';
import { NextRequest } from 'next/server';

// Get the JWT secret from environment variables or use a default for development
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    // For development only - in production, always use a strong secret
    if (process.env.NODE_ENV === 'production') {
      console.warn("JWT_SECRET is missing or too short in production environment.");
    }
    // Use a secret that's at least 32 characters long for HS256
    return 'xtyfyyu-j77nn-edge-compatible-secret-key-development-only-32chars';
  }
  return secret;
};

// Use a secret that's at least 32 characters long for HS256
const JWT_SECRET = new TextEncoder().encode(getJwtSecret());

// Generate a JWT token
export async function generateToken(payload: any) {
  try {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d')
      .sign(JWT_SECRET);

    return token;
  } catch (error) {
    console.error("Failed to generate token:", error);
    throw new Error("Token generation failed");
  }
}

// Verify a JWT token
export async function verifyToken(token: string) {
  if (!token) {
    console.warn("Empty token provided to verifyToken");
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    // Don't log the full error as it might contain sensitive information
    console.error("Token verification failed");
    return null;
  }
}

// Get token from request
export function getTokenFromRequest(request: NextRequest): string | undefined {
  try {
    // Get token from cookies
    const token = request.cookies.get('token')?.value;

    // If no token in cookies, try Authorization header
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
    }

    return token;
  } catch (error) {
    console.error("Error extracting token from request:", error);
    return undefined;
  }
}

// Get token from standard Request object (for API routes)
export function getTokenFromStandardRequest(request: Request): string | undefined {
  try {
    // First try Authorization header
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Then try cookies
    const cookieHeader = request.headers.get("Cookie");
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const parts = cookie.trim().split('=');
        if (parts.length >= 2) {
          const key = parts[0];
          const value = parts.slice(1).join('='); // Handle values that might contain =
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, string>);

      return cookies.token;
    }

    return undefined;
  } catch (error) {
    console.error("Error extracting token from standard request:", error);
    return undefined;
  }
}

// Extract user ID and role from token
export async function getUserFromToken(token: string | undefined) {
  if (!token) return null;

  try {
    const payload = await verifyToken(token);
    if (!payload) return null;

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    };
  } catch (error) {
    console.error("Error extracting user from token");
    return null;
  }
}

// Check if the user is an admin
export function isAdmin(user: any) {
  return user && user.role === 'admin';
}
