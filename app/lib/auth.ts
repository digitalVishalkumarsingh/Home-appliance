import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Use a secret that's at least 32 characters long for better security
const JWT_SECRET = process.env.JWT_SECRET || 'xtyfyyu-j77nn-secure-jwt-secret-key-32chars';

// Generate a JWT token
export function generateToken(payload: any) {
  // Increase token expiration to 7 days for better user experience
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Verify a JWT token
export function verifyToken(token: string) {
  try {
    // Use ignoreExpiration: false to ensure we check expiration properly
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: false });

    // If userId is a buffer object, convert it to a string
    if (decoded && typeof decoded === 'object' && 'userId' in decoded) {
      if (decoded.userId && typeof decoded.userId === 'object' && 'buffer' in decoded.userId) {
        // Convert buffer to hex string
        const bufferObj = decoded.userId as { buffer: { [key: number]: number } };
        const bufferArray = Object.values(bufferObj.buffer);
        const buffer = Buffer.from(bufferArray);
        const hexString = buffer.toString('hex');

        // Create a new object with the userId as a string
        return {
          ...decoded,
          userId: hexString
        };
      }
    }

    return decoded;
  } catch (error) {
    // Log the error but don't include sensitive token information
    if (error instanceof jwt.TokenExpiredError) {
      console.error("Token verification failed: Token expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error("Token verification failed: Invalid token");
    } else {
      console.error("Token verification failed:", error instanceof Error ? error.message : "Unknown error");
    }

    throw error; // Re-throw the error to be handled by the caller
  }
}

// Get the current user from the token in cookies
export async function getCurrentUser() {
  const cookieStore = cookies();
  const token = (await cookieStore).get('token')?.value;

  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Check if the user is an admin
export function isAdmin(user: any) {
  return user && user.role === 'admin';
}

// Extract token from request (either from Authorization header or cookies)
export function getTokenFromRequest(request: Request): string | null {
  // Try to get token from Authorization header
  let token = request.headers.get("Authorization")?.split(" ")[1];

  // If no token in header, try to get from cookies
  if (!token) {
    const cookieHeader = request.headers.get("Cookie");
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      token = cookies.token;
    }
  }

  return token || null;
}

