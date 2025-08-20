import connectToDatabase from './mongodb';
import User from '@/models/User';
import Product from '@/models/Product';
import Source from '@/models/Source';

export async function initializeDatabase() {
  try {
    await connectToDatabase();

    // Check if admin user exists
    let adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      // Create default admin user
      adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@crm.com',
        password: 'admin123', // This will be hashed by the pre-save hook
        role: 'admin',
      });
      console.log('✅ Default admin user created');
    }

    // Initialize default products
    const defaultProducts = [
      { name: 'Software Development', description: 'Custom software development services' },
      { name: 'Digital Marketing', description: 'Digital marketing and SEO services' },
      { name: 'Web Design', description: 'Website design and development' },
      { name: 'Mobile App Development', description: 'iOS and Android app development' },
      { name: 'Consulting', description: 'Business and technical consulting' },
    ];

    for (const productData of defaultProducts) {
      const existingProduct = await Product.findOne({ name: productData.name });
      if (!existingProduct) {
        await Product.create({
          ...productData,
          createdBy: adminUser._id,
        });
      }
    }
    console.log('✅ Default products initialized');

    // Initialize default sources
    const defaultSources = [
      { name: 'Website', description: 'Leads from company website' },
      { name: 'Referral', description: 'Referrals from existing clients' },
      { name: 'Cold Call', description: 'Cold calling campaigns' },
      { name: 'Social Media', description: 'Social media platforms' },
      { name: 'Advertisement', description: 'Paid advertising campaigns' },
      { name: 'Email Marketing', description: 'Email marketing campaigns' },
      { name: 'Trade Show', description: 'Trade shows and events' },
    ];

    for (const sourceData of defaultSources) {
      const existingSource = await Source.findOne({ name: sourceData.name });
      if (!existingSource) {
        await Source.create({
          ...sourceData,
          createdBy: adminUser._id,
        });
      }
    }
    console.log('✅ Default sources initialized');

    console.log('✅ Database initialization complete');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
}