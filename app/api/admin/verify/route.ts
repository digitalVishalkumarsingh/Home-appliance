import { NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from '@/app/lib/auth';
import { connectToDatabase } from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';
import { logger } from '@/app/config/logger';

import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    logger.debug('Processing GET /api/admin/verify');

    // Extract and verify token
    const token = getTokenFromRequest(request);
    if (!token) {
      logger.warn('No token found in admin verify request');
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Invalid or missing token' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
      logger.warn('Token verification failed in admin verify', { decoded });
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    // Validate ObjectId
    let userId: ObjectId;
    try {
      userId = new ObjectId(decoded.userId);
      logger.debug('Valid ObjectId in admin verify', { userId: decoded.userId });
    } catch (error) {
      logger.warn('Invalid user ID format in admin verify', { userId: decoded.userId });
      return NextResponse.json(
        { success: false, message: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase({ timeoutMs: 10000 });
    logger.debug('Connected to MongoDB for admin verify');

    // Find user and verify admin role
    const user = await db.collection('users').findOne({ _id: userId });
    if (!user) {
      logger.warn('User not found in admin verify', { userId: decoded.userId });
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      logger.warn('Non-admin user attempted admin verify', { 
        userId: decoded.userId, 
        role: user.role 
      });
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    logger.debug('Admin verification successful', { 
      userId: decoded.userId, 
      email: user.email 
    });

    // Return success response
    const response = NextResponse.json({
      success: true,
      message: 'Admin verification successful',
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    // Set security headers
    response.headers.set('Content-Security-Policy', "default-src 'self'");
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    return response;
  } catch (error) {
    logger.error('Failed to verify admin', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
