import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Interaction from '@/models/Interaction';
import Lead from '@/models/Lead';
import { authenticateUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const {
      lead: leadId,
      type,
      outcome,
      notes,
      duration,
      followUpDate,
    } = body;

    if (!leadId || !type || !notes) {
      return NextResponse.json(
        { error: 'Lead, type, and notes are required' },
        { status: 400 }
      );
    }

    let query = { _id: leadId };
    if (user.role !== 'admin') {
      query.assignedTo = user.userId;
    }

    const lead = await Lead.findOne(query);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const previousStatus = lead.status;
    let updateData = {
      lastContactedAt: new Date(),
    };

    if (followUpDate) {
      updateData.followUpDate = new Date(followUpDate);
    }

    if (outcome === 'Converted') {
      updateData.status = 'Converted';
      updateData.convertedAt = new Date();
    } else if (outcome === 'Follow-up Scheduled') {
      updateData.status = 'Follow-up';
    } else if (outcome === 'Not Interested') {
      updateData.status = 'Lost';
    } else if (outcome === 'Interested') {
      updateData.status = 'In Progress';
    } else if (previousStatus === 'New') {
      updateData.status = 'Contacted';
    }

    await Lead.findByIdAndUpdate(leadId, updateData);

    const interaction = await Interaction.create({
      lead: leadId,
      user: user.userId,
      type,
      outcome,
      notes,
      duration: duration || null,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      previousStatus,
      newStatus: updateData.status || previousStatus,
    });

    const populatedInteraction = await Interaction.findById(interaction._id)
      .populate('user', 'name')
      .populate('lead', 'name');

    return NextResponse.json(populatedInteraction, { status: 201 });
  } catch (error) {
    console.error('Create interaction error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}