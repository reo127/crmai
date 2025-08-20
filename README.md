# CRM System - Customer Relationship Management

A comprehensive CRM system built with Next.js, MongoDB, and TailwindCSS for managing leads, tracking customer interactions, and analyzing sales performance.

## Features

### 🎯 Core Functionality
- **Lead Management**: Add, edit, view, and delete leads with comprehensive tracking
- **Role-Based Access Control**: Admin and User roles with specific permissions
- **Communication Tracking**: Log calls, emails, WhatsApp messages, and meetings
- **Analytics Dashboard**: Performance metrics, conversion rates, and trend analysis
- **Follow-up Management**: Schedule and track follow-up activities

### 👥 User Roles

#### Admin Role
- ✅ Manage all leads in the system
- ✅ Create and manage user accounts
- ✅ Bulk upload leads via CSV/Excel
- ✅ Access company-wide analytics
- ✅ Manage products and lead sources
- ✅ Assign/reassign leads to team members

#### User (Sales Team) Role
- ✅ View and manage assigned leads only
- ✅ Add new leads (auto-assigned to self)
- ✅ Log interactions and update lead status
- ✅ Personal performance analytics
- ✅ Export personal lead data

### 🖥️ Core Screens
1. **Dashboard** - Personal/company-wide metrics and summaries
2. **Leads Management** - Comprehensive lead listing with filters and actions
3. **Lead Detail** - Individual lead management with interaction history
4. **Analytics** - Performance reports and conversion analytics

## Tech Stack

- **Frontend**: Next.js 15, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication
- **Styling**: TailwindCSS for responsive design

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd crm-two
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/crm
# For MongoDB Atlas, use: mongodb+srv://username:password@cluster.mongodb.net/crm

NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=your-jwt-secret-here
```

### 4. Database Setup

#### Option A: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Database will be created automatically

#### Option B: MongoDB Atlas
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get the connection string and update `MONGODB_URI`

### 5. Initialize Database
Run the following command to set up default data:

```bash
curl -X POST http://localhost:3000/api/init
```

This creates:
- Default admin user (email: admin@crm.com, password: admin123)
- Default products and lead sources

### 6. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Login Credentials

After running the database initialization:

**Admin Account:**
- Email: `admin@crm.com`
- Password: `admin123`

## Usage Guide

### Getting Started
1. Login with admin credentials
2. Navigate to leads section to start adding leads
3. Use the dashboard to monitor performance
4. Access analytics for insights and reports

### Adding Leads
1. Click "Add Lead" button on the leads page
2. Fill in required information (Name, Phone, Product Interest, Source, Value)
3. Assign to team members (Admin) or auto-assign to self (User)
4. Save and start tracking interactions

### Managing Interactions
1. Open any lead detail page
2. Use "Add Interaction" to log calls, emails, meetings
3. Update lead status based on interaction outcomes
4. Schedule follow-ups as needed

### Analytics & Reporting
- Access dashboard for quick metrics overview
- Use analytics page for detailed performance insights
- Filter data by date ranges, users, or lead sources
- Export data for external analysis

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Leads
- `GET /api/leads` - List leads (with filters)
- `POST /api/leads` - Create new lead
- `GET /api/leads/[id]` - Get lead details
- `PUT /api/leads/[id]` - Update lead
- `DELETE /api/leads/[id]` - Delete lead (Admin only)

### Interactions
- `POST /api/interactions` - Create interaction log

### System
- `POST /api/init` - Initialize database with default data

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── leads/            # Lead management pages
│   ├── login/            # Authentication pages
│   └── analytics/        # Analytics pages
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── layout/           # Layout components
│   └── ui/               # UI components
├── lib/                  # Utility libraries
│   ├── mongodb.js        # Database connection
│   ├── auth.js           # Authentication utilities
│   └── initDb.js         # Database initialization
└── models/               # Mongoose models
    ├── User.js
    ├── Lead.js
    ├── Product.js
    ├── Source.js
    └── Interaction.js
```

## Customization

### Adding New Lead Sources
1. Login as admin
2. Navigate to admin panel
3. Add custom sources for lead tracking

### Modifying Lead Fields
1. Update the Lead model in `src/models/Lead.js`
2. Update the lead forms in components
3. Update API validation

### Styling Customization
- Modify `tailwind.config.js` for theme changes
- Update component styles in individual files
- Global styles in `src/app/globals.css`

## Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Input validation and sanitization
- Protected API routes

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on git push

### Other Platforms
1. Build the project: `npm run build`
2. Start the production server: `npm start`
3. Configure environment variables
4. Set up MongoDB connection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test
4. Submit a pull request

## Troubleshooting

### Common Issues

**Database Connection Issues:**
- Verify MongoDB is running
- Check connection string in `.env.local`
- Ensure network access for MongoDB Atlas

**Authentication Issues:**
- Verify JWT_SECRET is set
- Check if user exists in database
- Clear browser cookies and try again

**Build Issues:**
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Next.js cache: `rm -rf .next`

## Support

For support and questions:
1. Check the troubleshooting section
2. Review the code documentation
3. Open an issue in the repository

## License

MIT License - see LICENSE file for details
