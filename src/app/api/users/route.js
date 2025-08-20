import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { authenticateUser } from '@/lib/auth';

// Get users for dropdowns (admins can see all, users see only themselves)
export async function GET(request) {
  try {
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    let query = { isActive: true };
    
    // If not admin, only return current user
    if (user.role !== 'admin') {
      query._id = user.userId;
    }

    const users = await User.find(query)
      .select('name email role')
      .sort({ name: 1 });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}