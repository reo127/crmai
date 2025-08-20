import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Communication from '@/models/Communication';
import { authenticateUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = await authenticateUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get leads assigned to this employee
    const leads = await Lead.find({ assignedTo: params.id }).select('_id name');
    const leadIds = leads.map(lead => lead._id);

    // Create a map of lead IDs to names for quick lookup
    const leadMap = {};
    leads.forEach(lead => {
      leadMap[lead._id.toString()] = lead.name;
    });

    // Get recent communications
    const communications = await Communication.find({ 
      leadId: { $in: leadIds }
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('leadId', 'name');

    // Get recent lead status changes (newly created or updated leads)
    const recentLeads = await Lead.find({ 
      assignedTo: params.id,
      $or: [
        { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, // Last 7 days
        { updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
      ]
    })
    .sort({ updatedAt: -1 })
    .limit(10);

    // Combine and format activity
    const activity = [];

    // Add communication activities
    communications.forEach(comm => {
      activity.push({
        description: `${comm.type.charAt(0).toUpperCase() + comm.type.slice(1)} with ${comm.leadId?.name || 'Unknown Lead'}: ${comm.notes || 'No notes'}`,
        createdAt: comm.createdAt,
        type: 'communication'
      });
    });

    // Add lead activities
    recentLeads.forEach(lead => {
      const isNewLead = new Date(lead.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      if (isNewLead) {
        activity.push({
          description: `New lead assigned: ${lead.name} (${lead.status})`,
          createdAt: lead.createdAt,
          type: 'lead_assignment'
        });
      } else {
        activity.push({
          description: `Lead updated: ${lead.name} status changed to ${lead.status}`,
          createdAt: lead.updatedAt,
          type: 'lead_update'
        });
      }
    });

    // Sort all activity by date (newest first) and limit to 15 items
    activity.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const recentActivity = activity.slice(0, 15);

    return NextResponse.json({ activity: recentActivity });
  } catch (error) {
    console.error('Get employee activity error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}