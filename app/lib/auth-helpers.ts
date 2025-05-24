
import { SignJWT, jwtVerify, JWTPayload } from "jose";
import { nanoid } from "nanoid";
import { logger } from "../../app/config/logger";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be set in .env and be at least 32 characters long");
}
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

const TOKEN_EXPIRATION = "1d";

export interface UserPayload extends JWTPayload {
  userId: string;
  email: string;
  role: "admin" | "technician" | "customer";
  [key: string]: any;
}

export class AuthError extends Error {
  type: "auth";
  constructor(message: string) {
    super(message);
    this.type = "auth";
  }
}

function validateUserPayload(payload: UserPayload): void {
  if (!payload.userId || typeof payload.userId !== "string") {
    throw new AuthError("Invalid userId");
  }
  if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    throw new AuthError("Invalid email");
  }
  if (!payload.role || !["admin", "technician", "customer"].includes(payload.role)) {
    throw new AuthError("Invalid role");
  }
}

export async function generateToken(payload: UserPayload): Promise<string> {
  try {
    validateUserPayload(payload);
    const token = await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256" })
      .setJti(nanoid())
      .setIssuedAt()
      .setExpirationTime(TOKEN_EXPIRATION)
      .sign(SECRET_KEY);

    logger.info("JWT token generated", { userId: payload.userId, role: payload.role });
    return token;
  } catch (error) {
    logger.error("Error generating JWT token", { error });
    throw new AuthError(
      error instanceof Error ? error.message : "Failed to generate authentication token"
    );
  }
}

export async function verifyToken(token: string): Promise<UserPayload> {
  try {
    if (!token || typeof token !== "string") {
      throw new AuthError("Invalid token");
    }
    const { payload } = await jwtVerify(token, SECRET_KEY);
    validateUserPayload(payload as UserPayload);
    logger.debug("JWT token verified", { userId: payload.userId });
    return payload as UserPayload;
  } catch (error) {
    logger.error("Error verifying JWT token", { error });
    throw new AuthError(
      error instanceof Error ? error.message : "Invalid or expired token"
    );
  }
}
