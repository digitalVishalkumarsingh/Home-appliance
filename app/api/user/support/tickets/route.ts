import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getTokenFromRequest, verifyToken, AuthError } from '@/app/lib/auth';

// Define UserPayload type here if not exported from auth module
interface UserPayload {
  userId: string;
  name?: string;
  email?: string;
  role?: string;
}

// Define types for clarity
interface Ticket {
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  message: string;
  status: 'open' | 'pending' | 'closed';
  createdAt: string;
  updatedAt: string;
  responses: Array<{
    message: string;
    respondedBy: string;
    respondedAt: string;
  }>;
}

interface PostRequestBody {
  subject: string;
  message: string;
}

interface PatchRequestBody {
  ticketId: string;
  status?: 'open' | 'pending' | 'closed';
  adminResponse?: string;
}

// GET: Fetch user's support tickets
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    let decoded: UserPayload;
    try {
      decoded = await verifyToken(token);
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 401 }
        );
      }
      throw error;
    }

    const userId = decoded.userId;
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID not found in token' },
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase({ timeoutMs: parseInt(process.env.MONGODB_TIMEOUT_MS || '10000') });

    // Fetch tickets for the user
    const tickets = await db
      .collection<Ticket>('supportTickets')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, tickets });
  } catch (error) {
    console.error('Error fetching support tickets:', (error as any).message);
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
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    let decoded: UserPayload;
    try {
      decoded = await verifyToken(token);
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 401 }
        );
      }
      throw error;
    }

    const userId = decoded.userId;
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID not found in token' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await req.json() as PostRequestBody;
    const { subject, message } = body;

    // Validate input
    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Subject and message are required' },
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase({ timeoutMs: parseInt(process.env.MONGODB_TIMEOUT_MS || '10000') });

    // Get user details if not available from token
    let userName = decoded.name || '';
    let userEmail = decoded.email || '';
    if (!userName || !userEmail) {
      try {
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        if (!user) {
          return NextResponse.json(
            { success: false, message: 'User not found' },
            { status: 404 }
          );
        }
        userName = user.name || 'Unknown';
        userEmail = user.email || 'Unknown';
      } catch (error) {
        console.error('Error fetching user details:', (error as any).message);
      }
    }

    // Create new ticket
    const newTicket: Ticket = {
      userId,
      userName,
      userEmail,
      subject,
      message,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responses: [],
    };

    const result = await db.collection<Ticket>('supportTickets').insertOne(newTicket);

    return NextResponse.json({
      success: true,
      message: 'Support ticket created successfully',
      ticketId: result.insertedId.toString(),
    });
  } catch (error) {
    console.error('Error creating support ticket:', (error as any).message);
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
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    let decoded: UserPayload;
    try {
      decoded = await verifyToken(token);
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 401 }
        );
      }
      throw error;
    }

    const userId = decoded.userId;
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID not found in token' },
        { status: 400 }
      );
    }

    const isAdmin = decoded.role === 'admin';

    // Parse request body
    const body = await req.json() as PatchRequestBody;
    const { ticketId, status, adminResponse } = body;

    // Validate input
    if (!ticketId) {
      return NextResponse.json(
        { success: false, message: 'Ticket ID is required' },
        { status: 400 }
      );
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(ticketId);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid ticket ID' },
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase({ timeoutMs: parseInt(process.env.MONGODB_TIMEOUT_MS || '10000') });

    // Find the ticket
    const ticket = await db.collection<Ticket>('supportTickets').findOne({ _id: objectId });
    if (!ticket) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Only allow admin to update status or add responses
    if ((status || adminResponse) && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized to perform this action' },
        { status: 403 }
      );
    }

    // Validate status if provided
    if (status && !['open', 'pending', 'closed'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Prepare update
    const updateData: Partial<Ticket> = {
      updatedAt: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;
    }

    const updateOperations: any = { $set: updateData };
    if (adminResponse?.trim()) {
      const response = {
        message: adminResponse,
        respondedBy: userId,
        respondedAt: new Date().toISOString(),
      };
      updateOperations.$push = { responses: response };
    }

    // Update the ticket
    const result = await db.collection<Ticket>('supportTickets').updateOne(
      { _id: objectId },
      updateOperations
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Ticket not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Ticket updated successfully',
    });
  } catch (error) {
    console.error('Error updating support ticket:', (error as any).message);
    return NextResponse.json(
      { success: false, message: 'Failed to update support ticket' },
      { status: 500 }
    );
  }
}