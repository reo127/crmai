import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Interaction from '@/models/Interaction';
import { authenticateUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const leadId = params.id;
    let query = { _id: leadId };
    
    if (user.role !== 'admin') {
      query.assignedTo = user.userId;
    }

    const lead = await Lead.findOne(query)
      .populate('assignedTo', 'name email')
      .populate('productInterest', 'name')
      .populate('source', 'name')
      .populate('createdBy', 'name');

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const interactions = await Interaction.find({ lead: leadId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({ lead, interactions });
  } catch (error) {
    console.error('Get lead error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const leadId = params.id;
    const body = await request.json();
    
    let query = { _id: leadId };
    if (user.role !== 'admin') {
      query.assignedTo = user.userId;
    }

    const existingLead = await Lead.findOne(query);
    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const updateData = { ...body };
    
    if (user.role !== 'admin') {
      delete updateData.assignedTo;
    }

    if (updateData.leadValue) {
      updateData.leadValue = parseFloat(updateData.leadValue);
    }

    const updatedLead = await Lead.findByIdAndUpdate(
      leadId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name email')
      .populate('productInterest', 'name')
      .populate('source', 'name')
      .populate('createdBy', 'name');

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('Update lead error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await authenticateUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const leadId = params.id;
    const deletedLead = await Lead.findByIdAndDelete(leadId);
    
    if (!deletedLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    await Interaction.deleteMany({ lead: leadId });

    return NextResponse.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}