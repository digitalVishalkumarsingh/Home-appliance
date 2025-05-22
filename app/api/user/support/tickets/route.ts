import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyAuth } from '@/app/lib/auth-helpers';

// GET: Fetch user's support tickets
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const decoded = await verifyAuth(req);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Connect to database
    const { db } = await connectToDatabase();

    // Fetch tickets for the user
    const tickets = await db
      .collection('supportTickets')
      .find({ userId: userId.toString() })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, tickets });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch support tickets' },
      { status: 500 }
    );
  }
}

// POST: Create a new support ticket
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const decoded = await verifyAuth(req);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;
    let userEmail = decoded.email;
    let userName = decoded.name;

    // Parse request body
    const { subject, message } = await req.json();

    // Validate input
    if (!subject || !message) {
      return NextResponse.json(
        { success: false, message: 'Subject and message are required' },
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Get user details if not available from session/token
    if (!userName || !userEmail) {
      const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
      if (user) {
        userName = user.name;
        userEmail = user.email;
      }
    }

    // Create new ticket
    const newTicket = {
      userId: userId.toString(),
      userName: userName || 'Unknown',
      userEmail: userEmail || 'Unknown',
      subject,
      message,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responses: []
    };

    const result = await db.collection('supportTickets').insertOne(newTicket);

    return NextResponse.json({
      success: true,
      message: 'Support ticket created successfully',
      ticketId: result.insertedId
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}

// PATCH: Update a ticket (for admin responses or status changes)
export async function PATCH(req: NextRequest) {
  try {
    // Verify authentication
    const decoded = await verifyAuth(req);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;
    const isAdmin = decoded.role === 'admin';

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

    // Only allow admin to update status or add responses
    if (status || adminResponse) {
      if (!isAdmin) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized to perform this action' },
          { status: 403 }
        );
      }
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
        respondedBy: userId.toString(),
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

    return NextResponse.json({
      success: true,
      message: 'Ticket updated successfully'
    });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update support ticket' },
      { status: 500 }
    );
  }
}
