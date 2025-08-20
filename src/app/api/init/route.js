import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/initDb';

export async function POST() {
  try {
    const success = await initializeDatabase();
    
    if (success) {
      return NextResponse.json({ 
        message: 'Database initialized successfully',
        credentials: {
          email: 'admin@crm.com',
          password: 'admin123'
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Database initialization failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Init API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}