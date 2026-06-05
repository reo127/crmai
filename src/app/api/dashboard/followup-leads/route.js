import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import { authenticateUser } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Base query: In Progress or Follow-up status
    let query = {
      status: { $in: ['In Progress', 'Follow-up'] },
    };

    // Admin sees all, others see only assigned
    if (user.role !== 'admin') {
      query.assignedTo = new mongoose.Types.ObjectId(user.userId);
    }

    // Date filter on followUpDate if provided
    if (dateFrom || dateTo) {
      query.followUpDate = {};
      if (dateFrom) query.followUpDate.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        query.followUpDate.$lte = end;
      }
    }

    const leads = await Lead.find(query)
      .populate('source', 'name')
      .populate('assignedTo', 'name')
      .sort({ followUpDate: 1, updatedAt: -1 })
      .limit(50);

    const formattedLeads = leads.map(lead => ({
      _id: lead._id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      companyName: lead.companyName,
      status: lead.status,
      priority: lead.priority,
      leadValue: lead.leadValue || 0,
      productInterest: lead.productInterest || '',
      source: lead.source?.name || 'Unknown',
      followUpDate: lead.followUpDate,
      assignedTo: lead.assignedTo?.name || '',
      updatedAt: lead.updatedAt,
    }));

    return NextResponse.json({ leads: formattedLeads });
  } catch (error) {
    console.error('Followup leads error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
