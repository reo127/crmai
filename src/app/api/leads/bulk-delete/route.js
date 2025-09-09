import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import { authenticateUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { leadIds } = await request.json();

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'No lead IDs provided' }, { status: 400 });
    }

    // Build query based on user role
    let query = { _id: { $in: leadIds } };
    
    // Non-admin users can only delete leads assigned to them
    if (user.role !== 'admin') {
      query.assignedTo = user.userId;
    }

    // Check how many leads match the criteria
    const leadsToDelete = await Lead.find(query).select('_id name');
    
    if (leadsToDelete.length === 0) {
      return NextResponse.json({ error: 'No leads found to delete or insufficient permissions' }, { status: 404 });
    }

    // Perform the deletion
    const result = await Lead.deleteMany(query);

    return NextResponse.json({
      message: `Successfully deleted ${result.deletedCount} lead(s)`,
      deletedCount: result.deletedCount,
      deletedLeads: leadsToDelete.map(lead => ({ id: lead._id, name: lead.name }))
    });

  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}