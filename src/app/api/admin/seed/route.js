import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Product from '@/models/Product';
import Source from '@/models/Source';
import User from '@/models/User';
import { authenticateUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await authenticateUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get admin user for createdBy field
    const adminUser = await User.findById(user.userId);
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }

    // Default products
    const defaultProducts = [
      { name: 'Software Development', description: 'Custom software development services' },
      { name: 'Digital Marketing', description: 'Digital marketing and SEO services' },
      { name: 'Web Development', description: 'Website development and design' },
      { name: 'Mobile App Development', description: 'iOS and Android app development' },
      { name: 'Consulting', description: 'Business and technology consulting' },
      { name: 'E-commerce Solutions', description: 'Online store and e-commerce platforms' },
      { name: 'Cloud Services', description: 'Cloud infrastructure and migration services' },
    ];

    // Default sources
    const defaultSources = [
      { name: 'Website', description: 'Leads from company website' },
      { name: 'Referral', description: 'Leads from referrals' },
      { name: 'Social Media', description: 'Leads from social media platforms' },
      { name: 'Email Campaign', description: 'Leads from email marketing' },
      { name: 'Cold Call', description: 'Leads from cold calling' },
      { name: 'Trade Show', description: 'Leads from trade shows and events' },
      { name: 'Google Ads', description: 'Leads from Google advertising' },
      { name: 'LinkedIn', description: 'Leads from LinkedIn outreach' },
    ];

    let createdProducts = 0;
    let createdSources = 0;

    // Create products
    for (const productData of defaultProducts) {
      const existingProduct = await Product.findOne({ name: productData.name });
      if (!existingProduct) {
        await Product.create({
          ...productData,
          createdBy: adminUser._id,
        });
        createdProducts++;
      }
    }

    // Create sources
    for (const sourceData of defaultSources) {
      const existingSource = await Source.findOne({ name: sourceData.name });
      if (!existingSource) {
        await Source.create({
          ...sourceData,
          createdBy: adminUser._id,
        });
        createdSources++;
      }
    }

    return NextResponse.json({
      message: 'Database seeded successfully',
      created: {
        products: createdProducts,
        sources: createdSources,
      },
      total: {
        products: await Product.countDocuments({ isActive: true }),
        sources: await Source.countDocuments({ isActive: true }),
      },
    });

  } catch (error) {
    console.error('Seed database error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}