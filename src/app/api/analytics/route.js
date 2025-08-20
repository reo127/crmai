import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Product from '@/models/Product';
import Source from '@/models/Source';
import User from '@/models/User';
import { authenticateUser } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Build query based on user role
    let baseQuery = {};
    if (user.role !== 'admin') {
      baseQuery.assignedTo = new mongoose.Types.ObjectId(user.userId);
    }

    // Conversion Funnel Data
    const conversionFunnel = await Lead.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const funnelData = {
      new: 0,
      contacted: 0,
      inProgress: 0,
      converted: 0,
      lost: 0,
      followUp: 0
    };

    conversionFunnel.forEach(item => {
      switch (item._id) {
        case 'New':
          funnelData.new = item.count;
          break;
        case 'Contacted':
          funnelData.contacted = item.count;
          break;
        case 'In Progress':
          funnelData.inProgress = item.count;
          break;
        case 'Converted':
          funnelData.converted = item.count;
          break;
        case 'Lost':
          funnelData.lost = item.count;
          break;
        case 'Follow-up':
          funnelData.followUp = item.count;
          break;
      }
    });

    // Source Analysis
    const sourceAnalysis = await Lead.aggregate([
      { $match: baseQuery },
      {
        $lookup: {
          from: 'sources',
          localField: 'source',
          foreignField: '_id',
          as: 'sourceInfo'
        }
      },
      { $unwind: '$sourceInfo' },
      {
        $group: {
          _id: '$sourceInfo.name',
          totalLeads: { $sum: 1 },
          converted: {
            $sum: { $cond: [{ $eq: ['$status', 'Converted'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          name: '$_id',
          leads: '$totalLeads',
          converted: '$converted',
          rate: {
            $multiply: [
              { $divide: ['$converted', '$totalLeads'] },
              100
            ]
          }
        }
      },
      { $sort: { leads: -1 } }
    ]);

    // Monthly Trends (last 12 months)
    const monthlyTrends = await Lead.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalLeads: { $sum: 1 },
          converted: {
            $sum: { $cond: [{ $eq: ['$status', 'Converted'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
      {
        $project: {
          month: {
            $arrayElemAt: [
              ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              '$_id.month'
            ]
          },
          leads: '$totalLeads',
          converted: '$converted'
        }
      }
    ]);

    // User Performance (admin only)
    let userPerformance = [];
    if (user.role === 'admin') {
      userPerformance = await Lead.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'assignedTo',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        { $unwind: '$userInfo' },
        {
          $group: {
            _id: '$userInfo._id',
            name: { $first: '$userInfo.name' },
            totalLeads: { $sum: 1 },
            converted: {
              $sum: { $cond: [{ $eq: ['$status', 'Converted'] }, 1, 0] }
            }
          }
        },
        {
          $project: {
            name: 1,
            leads: '$totalLeads',
            converted: '$converted',
            rate: {
              $multiply: [
                { $divide: ['$converted', '$totalLeads'] },
                100
              ]
            }
          }
        },
        { $sort: { leads: -1 } }
      ]);
    }

    // Lead Value Analytics
    const leadValueStats = await Lead.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$leadValue' },
          convertedValue: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'Converted'] },
                '$leadValue',
                0
              ]
            }
          },
          avgLeadValue: { $avg: '$leadValue' }
        }
      }
    ]);

    const valueStats = leadValueStats[0] || {
      totalValue: 0,
      convertedValue: 0,
      avgLeadValue: 0
    };

    return NextResponse.json({
      conversionFunnel: funnelData,
      sourceAnalysis,
      monthlyTrends,
      userPerformance,
      valueStats,
      totalLeads: await Lead.countDocuments(baseQuery),
      role: user.role
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}