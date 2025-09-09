import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Communication from '@/models/Communication';
import { authenticateUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { leadIds, status, notes } = await request.json();

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'No lead IDs provided' }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Validate status value
    const validStatuses = ['New', 'Contacted', 'In Progress', 'Follow-up', 'Converted', 'Lost'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    // Build query based on user role
    let query = { _id: { $in: leadIds } };
    
    // Non-admin users can only update leads assigned to them
    if (user.role !== 'admin') {
      query.assignedTo = user.userId;
    }

    // Check how many leads match the criteria
    const leadsToUpdate = await Lead.find(query).select('_id name status');
    
    if (leadsToUpdate.length === 0) {
      return NextResponse.json({ error: 'No leads found to update or insufficient permissions' }, { status: 404 });
    }

    // Update the leads
    const updateResult = await Lead.updateMany(query, { 
      $set: { 
        status,
        updatedAt: new Date()
      }
    });

    // If notes are provided, create communication records for each lead
    if (notes && notes.trim()) {
      const communicationPromises = leadsToUpdate.map(lead => {
        return Communication.create({
          leadId: lead._id,
          userId: user.userId,
          type: 'note',
          notes: `Bulk status change to "${status}": ${notes.trim()}`,
          date: new Date(),
        });
      });
      
      await Promise.all(communicationPromises);
    }

    return NextResponse.json({
      message: `Successfully updated ${updateResult.modifiedCount} lead(s) to status "${status}"`,
      updatedCount: updateResult.modifiedCount,
      updatedLeads: leadsToUpdate.map(lead => ({ 
        id: lead._id, 
        name: lead.name, 
        oldStatus: lead.status,
        newStatus: status 
      }))
    });

  } catch (error) {
    console.error('Bulk status update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}