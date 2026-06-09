import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import User from '@/models/User';
import Interaction from '@/models/Interaction';
import { authenticateUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await authenticateUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { leadIds, assignedTo } = body;

    // Validation
    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: 'Lead IDs array is required' },
        { status: 400 }
      );
    }

    if (!assignedTo) {
      return NextResponse.json(
        { error: 'Assigned user is required' },
        { status: 400 }
      );
    }

    // Verify the assigned user exists
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return NextResponse.json(
        { error: 'Assigned user not found' },
        { status: 404 }
      );
    }

    // Find all selected leads
    const leads = await Lead.find({ _id: { $in: leadIds } }).populate('assignedTo', 'name');

    if (leads.length === 0) {
      return NextResponse.json(
        { error: 'No valid leads found' },
        { status: 404 }
      );
    }

    // Assign ALL leads (including already-assigned ones) and log interaction for each
    const allLeadIds = leads.map(l => l._id);

    await Lead.updateMany(
      { _id: { $in: allLeadIds } },
      { $set: { assignedTo: assignedTo } }
    );

    // Create interaction records noting the (re)assignment
    const interactionPromises = leads.map(lead => {
      const previousAssignee = lead.assignedTo?.name || 'Unassigned';
      const noteText = lead.assignedTo
        ? `Lead reassigned from ${previousAssignee} to ${assignedUser.name} by admin`
        : `Lead assigned to ${assignedUser.name} by admin`;
      return Interaction.create({
        lead: lead._id,
        user: user.userId,
        type: 'Note',
        notes: noteText,
        previousStatus: lead.status,
        newStatus: lead.status,
      });
    });

    await Promise.all(interactionPromises);

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${leads.length} lead(s) to ${assignedUser.name}`,
      assigned: leads.length,
      assignedTo: {
        id: assignedUser._id,
        name: assignedUser.name
      }
    });

  } catch (error) {
    console.error('Bulk assign error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
