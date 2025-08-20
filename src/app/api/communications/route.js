import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Communication from '@/models/Communication';
import Lead from '@/models/Lead';
import User from '@/models/User';
import { authenticateUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const {
      leadId,
      type,
      subject,
      notes,
      duration,
      outcome,
      followUpRequired,
      followUpDate,
      direction = 'outbound'
    } = await request.json();

    if (!leadId || !type || !notes) {
      return NextResponse.json(
        { error: 'Lead ID, type, and notes are required' },
        { status: 400 }
      );
    }

    // Check if user has access to this lead
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (user.role !== 'admin' && lead.assignedTo.toString() !== user.userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create communication record
    const communication = await Communication.create({
      leadId,
      type,
      direction,
      subject,
      notes,
      duration: duration || undefined,
      outcome: outcome || undefined,
      followUpRequired: Boolean(followUpRequired),
      followUpDate: followUpRequired && followUpDate ? new Date(followUpDate) : undefined,
      createdBy: user.userId,
    });

    const populatedCommunication = await Communication.findById(communication._id)
      .populate('leadId', 'name')
      .populate('createdBy', 'name');

    return NextResponse.json({
      message: 'Communication added successfully',
      communication: populatedCommunication,
    });
  } catch (error) {
    console.error('Create communication error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const limit = parseInt(searchParams.get('limit')) || 20;
    const skip = parseInt(searchParams.get('skip')) || 0;

    let query = {};
    
    if (leadId) {
      // Check if user has access to this lead
      const lead = await Lead.findById(leadId);
      if (!lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }
      
      if (user.role !== 'admin' && lead.assignedTo.toString() !== user.userId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      
      query.leadId = leadId;
    } else if (user.role !== 'admin') {
      // For non-admin users, only show communications for their leads
      const userLeads = await Lead.find({ assignedTo: user.userId }).select('_id');
      query.leadId = { $in: userLeads.map(lead => lead._id) };
    }

    const communications = await Communication.find(query)
      .populate('leadId', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Communication.countDocuments(query);

    return NextResponse.json({
      communications,
      total,
      hasMore: skip + communications.length < total
    });
  } catch (error) {
    console.error('Get communications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}