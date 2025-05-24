import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getTokenFromRequest, verifyToken } from '@/app/lib/auth';
import { connectToDatabase } from '@/app/lib/mongodb';
import { logger } from '@/app/config/logger';

// Constants
const COLLECTION_USERS = 'users';

// TypeScript Interfaces
interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

interface User {
  _id: ObjectId;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  createdAt: Date;
}

interface ApiResponse {
  success: boolean;
  message: string;
  user?: Omit<User, 'password'>;
}

import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    logger.debug('Processing GET /api/auth/me');

    // Extract and verify token using auth.ts
    const token = getTokenFromRequest(request);
    if (!token) {
      logger.warn('No token found in request');
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Invalid or missing token' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
      logger.warn('Token verification failed or invalid structure', { decoded });
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    // Validate ObjectId
    let userId: ObjectId;
    try {
      userId = new ObjectId(decoded.userId);
      logger.debug('Valid ObjectId', { userId: decoded.userId });
    } catch (error) {
      logger.warn('Invalid user ID format', { userId: decoded.userId });
      return NextResponse.json(
        { success: false, message: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });
    logger.debug('Connected to MongoDB');

    // Find user
    const user = await db.collection<User>(COLLECTION_USERS).findOne({ _id: userId });
    if (!user) {
      logger.warn('User not found', { userId: decoded.userId });
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    logger.debug('User found', { email: user.email });

    // Exclude password from response
    const { password, ...userWithoutPassword } = user;

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'User data retrieved successfully',
      user: userWithoutPassword,
    });

    // Set security headers
    response.headers.set('Content-Security-Policy', "default-src 'self'");
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    logger.debug('Returning successful response');
    return response;
  } catch (error) {
    logger.error('Failed to retrieve user data', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    logger.debug('Processing PUT /api/user/profile');

    // Extract and verify token using auth.ts
    const token = getTokenFromRequest(request);
    if (!token) {
      logger.warn('No token found in request');
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Invalid or missing token' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
      logger.warn('Token verification failed or invalid structure', { decoded });
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    // Validate ObjectId
    let userId: ObjectId;
    try {
      userId = new ObjectId(decoded.userId);
      logger.debug('Valid ObjectId', { userId: decoded.userId });
    } catch (error) {
      logger.warn('Invalid user ID format', { userId: decoded.userId });
      return NextResponse.json(
        { success: false, message: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });
    logger.debug('Connected to MongoDB');

    // Parse request body
    const { name, phone } = await request.json();
    if (!name || !phone) {
      logger.warn('Missing required fields: name or phone');
      return NextResponse.json(
        { success: false, message: 'Bad Request: Missing required fields' },
        { status: 400 }
      );
    }

    // Update user profile
    const result = await db.collection<User>(COLLECTION_USERS).updateOne(
      { _id: userId },
      { $set: { name, phone } }
    );
    if (result.modifiedCount === 0) {
      logger.warn('User profile update failed', { userId: decoded.userId });
      return NextResponse.json(
        { success: false, message: 'User profile update failed' },
        { status: 500 }
      );
    }

    logger.debug('User profile updated', { userId: decoded.userId });

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'User profile updated successfully',
    });

    // Set security headers
    response.headers.set('Content-Security-Policy', "default-src 'self'");
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    logger.debug('Returning successful response');
    return response;
  } catch (error) {
    logger.error('Failed to update user profile', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}