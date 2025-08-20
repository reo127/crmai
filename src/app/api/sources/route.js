import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Source from '@/models/Source';
import { authenticateUser } from '@/lib/auth';

export async function GET() {
  try {
    await connectToDatabase();
    
    const sources = await Source.find({ isActive: true })
      .select('name description')
      .sort({ name: 1 });

    return NextResponse.json({ sources });
  } catch (error) {
    console.error('Get sources error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await authenticateUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Source name is required' },
        { status: 400 }
      );
    }

    const source = await Source.create({
      name,
      description,
      createdBy: user.userId,
    });

    return NextResponse.json({
      message: 'Source created successfully',
      source,
    }, { status: 201 });

  } catch (error) {
    console.error('Create source error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}