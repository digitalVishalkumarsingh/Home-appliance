// app/lib/auth.ts
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { logger } from "../config/logger";
import * as jose from "jose";

const JWT_SECRET: string = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  logger.error("JWT_SECRET is not set in environment variables");
  throw new Error("JWT_SECRET must be set in .env");
}
if (JWT_SECRET.length < 32) {
  logger.error("JWT_SECRET is too short", { length: JWT_SECRET.length });
  throw new Error("JWT_SECRET must be at least 32 characters long");
}

const validateJwtExpiresIn = (expiresIn: string | undefined): string => {
  if (!expiresIn) return "1d";
  const regex = /^\d+[dhms]$/;
  if (!regex.test(expiresIn)) {
    logger.warn(`Invalid JWT_EXPIRES_IN format: ${expiresIn}, defaulting to 1d`);
    return "1d";
  }
  return expiresIn;
};

const JWT_EXPIRES_IN = validateJwtExpiresIn(process.env.JWT_EXPIRES_IN);

export class AuthError extends Error {
  type: "auth";
  constructor(message: string, public code: string) {
    super(message);
    this.name = "AuthError";
    this.type = "auth";
  }
}

export interface JwtPayload {
  sub: any;
  userId: string;
  role: string;
  email?: string;
  name?: string;
  iat?: number;
  exp?: number;
}

export async function generateToken(payload: Omit<JwtPayload, "iat" | "exp">): Promise<string> {
  try {
    if (!payload.userId || !payload.role) {
      const error = new AuthError("Payload must include userId and role", "INVALID_PAYLOAD");
      logger.error("Invalid payload for token generation", {
        hasUserId: !!payload.userId,
        hasRole: !!payload.role,
        error: error.message,
      });
      throw error;
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new jose.SignJWT({
      userId: payload.userId,
      role: payload.role,
      ...(payload.email && { email: payload.email }),
      ...(payload.name && { name: payload.name }),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("dizit-solutions")
      .setAudience("dizit-app")
      .setExpirationTime(JWT_EXPIRES_IN)
      .sign(secret);

    logger.debug("JWT token generated", { userId: payload.userId });
    return token;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to generate JWT token", {
      error: errorMessage,
      userId: payload.userId || "unknown",
    });
    throw error instanceof AuthError
      ? error
      : new AuthError("Failed to generate token", "TOKEN_GENERATION_FAILED");
  }
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  try {
    if (!token || typeof token !== "string") {
      throw new AuthError("Invalid token format", "INVALID_TOKEN_FORMAT");
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: ["HS256"],
      issuer: "dizit-solutions",
      audience: "dizit-app",
    });

    if (!payload.userId || !payload.role) {
      throw new AuthError("Invalid token payload", "INVALID_TOKEN_PAYLOAD");
    }

    logger.debug("JWT token verified", { userId: (payload as any).userId });
    return payload as unknown as JwtPayload;
  } catch (error) {
    const errorMessage =
      error instanceof jose.errors.JWTExpired
        ? "Token has expired"
        : error instanceof jose.errors.JWTInvalid
        ? "Invalid token"
        : error instanceof jose.errors.JWTClaimValidationFailed
        ? "Token not active yet"
        : error instanceof AuthError
        ? error.message
        : "Token verification failed";
    const errorCode =
      error instanceof jose.errors.JWTExpired
        ? "TOKEN_EXPIRED"
        : error instanceof jose.errors.JWTInvalid
        ? "INVALID_TOKEN"
        : error instanceof jose.errors.JWTClaimValidationFailed
        ? "TOKEN_NOT_ACTIVE"
        : error instanceof AuthError
        ? error.code
        : "TOKEN_VERIFICATION_FAILED";

    logger.error("Token verification failed", {
      error: errorMessage,
      code: errorCode,
    });
    throw new AuthError(errorMessage, errorCode);
  }
}

export async function getUserFromToken(token: string): Promise<JwtPayload> {
  try {
    return await verifyToken(token);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to get user from token", {
      error: errorMessage,
      code: error instanceof AuthError ? error.code : "UNKNOWN",
    });
    throw error instanceof AuthError
      ? error
      : new AuthError("Failed to get user from token", "USER_RETRIEVAL_FAILED");
  }
}

export async function getCurrentUser(): Promise<JwtPayload> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("token");

    if (!tokenCookie?.value) {
      logger.debug("No authentication token found in cookies");
      throw new AuthError("No token provided", "NO_TOKEN");
    }

    const decoded = await verifyToken(tokenCookie.value);
    logger.debug("Current user retrieved", { userId: decoded.userId, role: decoded.role });
    return decoded;
  } catch (error) {
    logger.error("Failed to get current user", {
      error: error instanceof Error ? error.message : String(error),
      code: error instanceof AuthError ? error.code : "UNKNOWN",
    });
    throw error instanceof AuthError
      ? error
      : new AuthError("Failed to get current user", "USER_RETRIEVAL_FAILED");
  }
}

export function isAdmin(user: JwtPayload | null): boolean {
  const isAdminUser = user?.role === "admin";
  logger.debug("Admin check", { userId: user?.userId || "unknown", isAdmin: isAdminUser });
  return isAdminUser;
}

export function isTechnician(user: JwtPayload | null): boolean {
  const isTechnicianUser = user?.role === "technician";
  logger.debug("Technician check", {
    userId: user?.userId || "unknown",
    isTechnician: isTechnicianUser,
  });
  return isTechnicianUser;
}

export function isUser(user: JwtPayload | null): boolean {
  const isRegularUser = user?.role === "user";
  logger.debug("User check", { userId: user?.userId || "unknown", isUser: isRegularUser });
  return isRegularUser;
}

export function getUserRole(user: JwtPayload | null): string | null {
  return user?.role || null;
}

export function hasRole(user: JwtPayload | null, roles: string[]): boolean {
  if (!user?.role) return false;
  return roles.includes(user.role);
}

// Overloaded function to handle both Request and NextRequest
export function getTokenFromRequest(request: Request | NextRequest): string {
  try {
    if (!request || !request.headers) {
      logger.warn("Invalid request object provided to getTokenFromRequest");
      throw new AuthError("Invalid request object", "INVALID_REQUEST");
    }

    // Check if it's a NextRequest (has cookies.getAll method)
    if ('cookies' in request && typeof request.cookies.getAll === 'function') {
      // Handle NextRequest
      const nextRequest = request as NextRequest;

      // Debug: Log all cookies
      const allCookies = nextRequest.cookies.getAll();
      console.log("getTokenFromRequest - All cookies:", allCookies.map(c => ({ name: c.name, hasValue: !!c.value })));

      // First try the main httpOnly token cookie
      const token = nextRequest.cookies.get("token")?.value;
      if (token) {
        console.log("getTokenFromRequest - Token found in main cookie");
        logger.debug("Token extracted from NextRequest cookies (httpOnly)");
        return token;
      }

      // Try auth_token cookie (non-httpOnly for navigation)
      const authToken = nextRequest.cookies.get("auth_token")?.value;
      if (authToken) {
        console.log("getTokenFromRequest - Token found in auth_token cookie");
        logger.debug("Token extracted from auth_token cookie");
        return authToken;
      }

      // Try backup token cookie (for debugging/fallback)
      const backupToken = nextRequest.cookies.get("token_backup")?.value;
      if (backupToken) {
        console.log("getTokenFromRequest - Token found in backup cookie");
        logger.debug("Token extracted from backup cookie");
        return backupToken;
      }
    } else {
      // Handle regular Request - parse cookies manually
      const cookieHeader = request.headers.get('Cookie');
      if (cookieHeader) {
        console.log("getTokenFromRequest - Parsing cookies from header");
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          if (key && value) {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, string>);

        // Try different cookie names
        const token = cookies.token || cookies.auth_token || cookies.token_backup;
        if (token) {
          console.log("getTokenFromRequest - Token found in cookies");
          logger.debug("Token extracted from Request cookies");
          return token;
        }
      }
    }

    // Try Authorization header for both request types
    const authHeader = request.headers.get("Authorization");
    if (authHeader) {
      console.log("getTokenFromRequest - Checking Authorization header");
      const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
      if (bearerMatch && bearerMatch[1]) {
        const token = bearerMatch[1].trim();
        if (token) {
          console.log("getTokenFromRequest - Token found in Authorization header");
          logger.debug("Token extracted from Authorization header");
          return token;
        }
      }
    }

    console.log("getTokenFromRequest - No authentication token found in request");
    logger.debug("No authentication token found in request");
    throw new AuthError("No token provided", "NO_TOKEN");
  } catch (error) {
    logger.error("Failed to extract token from request", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error instanceof AuthError
      ? error
      : new AuthError("Failed to extract token", "TOKEN_EXTRACTION_FAILED");
  }
}

export async function setTokenCookie(token: string): Promise<void> {
  try {
    if (!token || typeof token !== "string") {
      throw new AuthError("Invalid token provided", "INVALID_TOKEN_INPUT");
    }

    const cookieStore = await cookies();
    const maxAge = parseDuration(JWT_EXPIRES_IN);
    if (!Number.isInteger(maxAge) || maxAge <= 0) {
      throw new AuthError("Invalid maxAge for cookie", "INVALID_COOKIE_MAXAGE");
    }

    const vercelDomain =
      process.env.VERCEL_URL && process.env.NODE_ENV === "production"
        ? `.${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}` // Prepend dot for subdomain support
        : undefined;

    cookieStore.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge, // Ensure maxAge is a valid integer
      path: "/",
      ...(vercelDomain && { domain: vercelDomain }),
    });

    logger.debug("Authentication token cookie set successfully", { maxAge, domain: vercelDomain });
  } catch (error) {
    logger.error("Failed to set authentication token cookie", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error instanceof AuthError
      ? error
      : new AuthError("Failed to set token cookie", "COOKIE_SET_FAILED");
  }
}

export async function clearTokenCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const vercelDomain =
      process.env.VERCEL_URL && process.env.NODE_ENV === "production"
        ? `.${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}` // Prepend dot for subdomain support
        : undefined;

    cookieStore.set({
      name: "token",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, // Expire immediately
      path: "/",
      ...(vercelDomain && { domain: vercelDomain }),
    });

    logger.debug("Authentication token cookie cleared successfully", { domain: vercelDomain });
  } catch (error) {
    logger.error("Failed to clear authentication token cookie", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new AuthError("Failed to clear token cookie", "COOKIE_CLEAR_FAILED");
  }
}

const DEFAULT_DURATION_SECONDS = 24 * 60 * 60;

function parseDuration(duration: string): number {
  try {
    if (!duration || typeof duration !== "string") {
      throw new Error("Duration must be a non-empty string");
    }

    const match = duration.match(/^(\d+)([dhms])$/);
    if (!match) {
      throw new Error(
        `Invalid duration format: ${duration}. Expected format: <number><unit> (e.g., "1d")`
      );
    }

    const [, valueStr, unit] = match;
    const value = parseInt(valueStr, 10);

    if (isNaN(value) || value <= 0) {
      throw new Error(`Invalid duration value: ${value}. Must be a positive number`);
    }

    switch (unit) {
      case "d":
        return value * 24 * 60 * 60;
      case "h":
        return value * 60 * 60;
      case "m":
        return value * 60;
      case "s":
        return value;
      default:
        throw new Error(`Invalid duration unit: ${unit}. Expected: d, h, m, or s`);
    }
  } catch (error) {
    logger.error("Failed to parse duration for JWT_EXPIRES_IN, defaulting to 1 day", {
      error: error instanceof Error ? error.message : String(error),
      duration,
      context: "JWT_EXPIRES_IN",
      defaultDuration: DEFAULT_DURATION_SECONDS,
    });
    return DEFAULT_DURATION_SECONDS;
  }
}