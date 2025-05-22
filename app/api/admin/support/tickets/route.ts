import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyToken } from '@/app/lib/auth-edge';

// Helper function to verify admin access
async function verifyAdminAccess(req: NextRequest) {
  // Get token from cookies or authorization header
  const token = req.cookies.get('token')?.value ||
               req.headers.get('authorization')?.split(' ')[1];

  if (!token) {
    return null;
  }

  // Verify the token
  const decoded = await verifyToken(token);
  if (!decoded || !decoded.userId || decoded.role !== 'admin') {
    return null;
  }

  return { userId: decoded.userId, userName: decoded.name };
}

// GET: Fetch all support tickets (admin only)
export async function GET(req: NextRequest) {
  try {
    // Verify admin access
    const admin = await verifyAdminAccess(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const ticketId = url.searchParams.get('ticketId');

    // Connect to database
    const { db } = await connectToDatabase();

    // If ticketId is provided, fetch a single ticket
    if (ticketId) {
      try {
        const ticket = await db.collection('supportTickets').findOne({
          _id: new ObjectId(ticketId)
        });

        if (!ticket) {
          return NextResponse.json(
            { success: false, message: 'Ticket not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({ success: true, ticket });
      } catch (error) {
        return NextResponse.json(
          { success: false, message: 'Invalid ticket ID' },
          { status: 400 }
        );
      }
    }

    // Build query for filtering
    const query: any = {};
    if (status) {
      query.status = status;
    }

    // Fetch tickets with pagination
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const tickets = await db
      .collection('supportTickets')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const totalTickets = await db.collection('supportTickets').countDocuments(query);

    return NextResponse.json({
      success: true,
      tickets,
      pagination: {
        total: totalTickets,
        page,
        limit,
        totalPages: Math.ceil(totalTickets / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch support tickets' },
      { status: 500 }
    );
  }
}

// PATCH: Update a ticket (admin only)
export async function PATCH(req: NextRequest) {
  try {
    // Verify admin access
    const admin = await verifyAdminAccess(req);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const { ticketId, status, adminResponse } = await req.json();

    if (!ticketId) {
      return NextResponse.json(
        { success: false, message: 'Ticket ID is required' },
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Find the ticket
    const ticket = await db.collection('supportTickets').findOne({
      _id: new ObjectId(ticketId)
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Prepare update
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
    }

    if (adminResponse) {
      const response = {
        message: adminResponse,
        respondedBy: admin.userId,
        respondedByName: admin.userName || 'Admin',
        isAdmin: true,
        respondedAt: new Date().toISOString()
      };

      // Add to responses array
      await db.collection('supportTickets').updateOne(
        { _id: new ObjectId(ticketId) },
        { $push: { responses: response } }
      );
    }

    // Update the ticket
    await db.collection('supportTickets').updateOne(
      { _id: new ObjectId(ticketId) },
      { $set: updateData }
    );

    // Get the updated ticket
    const updatedTicket = await db.collection('supportTickets').findOne({
      _id: new ObjectId(ticketId)
    });

    return NextResponse.json({
      success: true,
      message: 'Ticket updated successfully',
      ticket: updatedTicket
    });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update support ticket' },
      { status: 500 }
    );
  }
}
