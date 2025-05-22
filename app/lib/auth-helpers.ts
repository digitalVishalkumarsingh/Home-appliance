import { NextRequest } from 'next/server';
import { verifyToken } from './auth-edge';

/**
 * Extract token from request cookies or authorization header
 * @param request The Next.js request object
 * @returns The extracted token or null if not found
 */
export function extractToken(request: NextRequest | Request): string | null {
  // Try to get token from authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Try to get token from cookies
  if (request instanceof NextRequest) {
    return request.cookies.get('token')?.value || null;
  }
  
  // For standard Request objects, parse cookies manually
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    return cookies.token || null;
  }
  
  return null;
}

/**
 * Verify user authentication
 * @param request The Next.js request object
 * @returns The decoded token payload or null if authentication fails
 */
export async function verifyAuth(request: NextRequest | Request) {
  const token = extractToken(request);
  
  if (!token) {
    return null;
  }
  
  try {
    return await verifyToken(token);
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Verify admin authentication
 * @param request The Next.js request object
 * @returns The decoded token payload or null if authentication fails or user is not an admin
 */
export async function verifyAdminAuth(request: NextRequest | Request) {
  const decoded = await verifyAuth(request);
  
  if (!decoded || (decoded as {role?: string}).role !== 'admin') {
    return null;
  }
  
  return decoded;
}
