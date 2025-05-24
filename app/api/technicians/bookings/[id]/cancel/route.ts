'use server';
import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import { getTokenFromRequest, verifyToken } from '@/app/lib/auth';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { logger } from '@/app/config/logger';

// Validation schema for request body
const CancelBookingSchema = z.object({
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
}).strict();

export const config = {
  runtime: 'nodejs', // Use Node.js runtime for MongoDB and logger compatibility
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let client;
  try {
    logger.debug('Processing POST /api/bookings/[id]/cancel', { bookingId: params.id });

    // Verify authentication
    const token = getTokenFromRequest(request);
    if (!token) {
      logger.warn('No token found in request');
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token); // Fixed to async
    if (!decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
      logger.warn('Token verification failed or invalid structure', { decoded });
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;
    logger.debug('Token verified', { userId });

    // Validate request body
    const body = await request.json();
    const parsedBody = CancelBookingSchema.safeParse(body);
    if (!parsedBody.success) {
      logger.warn('Invalid request body', { errors: parsedBody.error.errors });
      return NextResponse.json(
        { success: false, message: `Invalid input: ${parsedBody.error.message}` },
        { status: 400 }
      );
    }
    const { notes } = parsedBody.data;

    // Connect to MongoDB
    const { db, client: dbClient } = await connectToDatabase({ timeoutMs: 10000 });
    client = dbClient;
    logger.debug('Connected to MongoDB');

    // Validate booking ID
    const bookingId = params.id;
    if (!ObjectId.isValid(bookingId)) {
      logger.warn('Invalid booking ID', { bookingId });
      return NextResponse.json(
        { success: false, message: 'Invalid booking ID' },
        { status: 400 }
      );
    }

    // Verify user and technician in one query
    if (!ObjectId.isValid(userId)) {
      logger.warn('Invalid user ID', { userId });
      return NextResponse.json(
        { success: false, message: 'Invalid user ID' },
        { status: 400 }
      );
    }
    const user = await db.collection('users').findOne({
      _id: new ObjectId(userId),
    });
    if (!user) {
      logger.warn('User not found', { userId });
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    if (user.role !== 'technician') {
      logger.warn('Unauthorized: Technician role required', { userId, role: user.role });
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Technician role required' },
        { status: 403 }
      );
    }

    const technician = await db.collection('technicians').findOne({ userId });
    if (!technician) {
      logger.warn('Technician profile not found', { userId });
      return NextResponse.json(
        { success: false, message: 'Technician profile not found' },
        { status: 404 }
      );
    }

    // Start MongoDB transaction
    const session = await client.startSession();
    let response;

    try {
      await session.withTransaction(async () => {
        // Find booking
        const booking = await db.collection('bookings').findOne(
          {
            _id: new ObjectId(bookingId),
            technicianId: technician._id.toString(),
            status: { $in: ['assigned', 'in_progress'] },
          },
          { session }
        );

        if (!booking) {
          logger.warn('Booking not found or cannot be cancelled', { bookingId, technicianId: technician._id });
          throw new Error('Booking not found, not assigned to you, or cannot be cancelled');
        }

        // Update booking status
        const now = new Date();
        const updateData: any = {
          status: 'cancelled',
          cancelledAt: now,
          updatedAt: now,
          cancellationReason: 'Cancelled by technician',
        };
        if (notes) {
          updateData.notes = notes;
        }

        const updateResult = await db.collection('bookings').updateOne(
          { _id: booking._id },
          { $set: updateData },
          { session }
        );

        if (updateResult.modifiedCount === 0) {
          logger.error('Failed to update booking status', { bookingId });
          throw new Error('Failed to update booking status');
        }

        // Update technician status
        await db.collection('technicians').updateOne(
          { _id: technician._id },
          {
            $set: {
              status: 'available',
              updatedAt: now,
              lastActive: now,
            },
          },
          { session }
        );

        // Create customer notification
        const customerNotification = {
          recipientId: booking.userId,
          recipientType: 'customer',
          title: 'Booking Cancelled',
          message: `Your ${booking.service || 'service'} booking has been cancelled by the technician.`,
          type: 'booking_update',
          referenceId: booking._id.toString(),
          isRead: false,
          createdAt: now,
          updatedAt: now,
        };

        await db.collection('notifications').insertOne(customerNotification, { session });

        // Create admin notification
        const adminNotification = {
          recipientType: 'admin',
          title: 'Booking Cancelled',
          message: `Technician ${technician.name || user.name} has cancelled booking #${booking._id.toString()}.`,
          type: 'booking_update',
          referenceId: booking._id.toString(),
          isRead: false,
          createdAt: now,
          updatedAt: now,
        };

        await db.collection('notifications').insertOne(adminNotification, { session });

        response = {
          success: true,
          message: 'Booking cancelled successfully',
          booking: {
            _id: booking._id.toString(),
            status: 'cancelled',
            cancelledAt: now.toISOString(),
            cancellationReason: 'Cancelled by technician',
          },
        };

        logger.debug('Booking cancelled successfully', { bookingId, technicianId: technician._id });
      }, {
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
      });
    } finally {
      await session.endSession();
    }

    // Set security headers
    const nextResponse = NextResponse.json(response);
    nextResponse.headers.set('Content-Security-Policy', "default-src 'self'");
    nextResponse.headers.set('X-Content-Type-Options', 'nosniff');
    nextResponse.headers.set('X-Frame-Options', 'DENY');
    nextResponse.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

    return nextResponse;
  } catch (error: any) {
    logger.error('Error cancelling booking', {
      error: error.message,
      stack: error.stack,
      bookingId: params.id,
    });
    const message =
      error.message.includes('Booking not found')
        ? error.message
        : error.name === 'MongoTimeoutError'
          ? 'Database connection timed out'
          : error.name === 'MongoServerError' && error.code === 11000
            ? 'Database error: Duplicate key'
            : 'Failed to cancel booking';
    return NextResponse.json(
      { success: false, message },
      {
        status:
          error.message.includes('Booking not found')
            ? 404
            : error.name === 'MongoTimeoutError'
              ? 504
              : error.name === 'MongoServerError' && error.code === 11000
                ? 409
                : 500,
      }
    );
  } finally {
    if (client) {
      await client.close();
      logger.debug('MongoDB client closed');
    }
  }
}