import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import { authenticateUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = parseInt(searchParams.get('skip')) || 0;

    // Get leads assigned to this user
    const leads = await Lead.find({ assignedTo: user.userId })
      .populate('productInterest', 'name')
      .populate('source', 'name')
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(skip);

    // Format leads for display
    const formattedLeads = leads.map(lead => ({
      _id: lead._id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      companyName: lead.companyName,
      status: lead.status,
      priority: lead.priority,
      leadValue: lead.leadValue || 0,
      productInterest: lead.productInterest?.name || 'Unknown',
      source: lead.source?.name || 'Unknown',
      notes: lead.notes,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    }));

    // Get total count for pagination
    const totalCount = await Lead.countDocuments({ assignedTo: user.userId });

    return NextResponse.json({ 
      leads: formattedLeads,
      total: totalCount,
      hasMore: skip + leads.length < totalCount
    });
  } catch (error) {
    console.error('Dashboard leads error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}