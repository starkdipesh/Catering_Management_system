# CaterFlow - Catering Management SaaS Platform

A complete multi-tenant SaaS platform for catering businesses to manage their operations including customers, events, menus, staff, inventory, billing, and analytics.

## Features

### Core Features
- **Multi-tenant Architecture** - Complete data isolation between catering businesses
- **Role-based Access Control** - Super Admin, Tenant Admin, Manager, and Staff roles
- **Customer Management** - Track customers, their history, and preferences
- **Event Management** - Schedule and manage catering events with calendar view
- **Menu Management** - Create menu categories, items, and packages
- **Inventory Management** - Track stock levels with low stock alerts
- **Staff Management** - Assign staff to events and track schedules
- **Invoicing & Payments** - Generate invoices and track payments
- **Subscription Billing** - Integrated with Stripe/Razorpay
- **Analytics Dashboard** - Revenue charts, event statistics, and reports

### User Roles
- **Super Admin** - Platform owner, manages all tenants and subscription plans
- **Tenant Admin** - Business owner, manages their entire catering business
- **Manager** - Manages events, assigns staff, handles customers
- **Staff** - Views assigned events and updates task status

## Tech Stack

### Backend
- Node.js 18+
- Express.js
- MySQL 8.0
- JWT Authentication
- bcrypt password hashing
- Stripe/Razorpay integration

### Frontend
- Next.js 14
- React 18
- TailwindCSS
- Chart.js for analytics
- React Query for data fetching
- Zustand for state management

## Project Structure

```
caterflow/
├── backend/                    # Node.js Express API
│   ├── config/               # Database & app configuration
│   ├── controllers/          # API controllers
│   ├── middleware/           # Auth, tenant isolation, validation
│   ├── models/               # Database models
│   ├── routes/               # API routes
│   ├── services/             # Business logic services
│   ├── utils/                # Helper functions
│   ├── seeds/                # Database seeders
│   ├── server.js             # Main server file
│   └── package.json
├── frontend/                   # Next.js frontend
│   ├── app/                  # Next.js app directory
│   ├── components/           # Reusable components
│   ├── contexts/             # React contexts
│   ├── hooks/                # Custom hooks
│   ├── lib/                  # API client & utilities
│   └── package.json
├── database/
│   ├── schema.sql            # Database schema
│   └── seed.sql              # Sample data
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+

### Database Setup

1. Create MySQL database:
```bash
mysql -u root -p
CREATE DATABASE caterflow;
USE caterflow;
SOURCE database/schema.sql;
SOURCE database/seed.sql;
```

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials and secrets
```

4. Start development server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

4. Start development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## Default Login Credentials

### Super Admin
- Email: `admin@caterflow.com`
- Password: (set via database seed or registration)

### Sample Tenant Users
- Royal Wedding Catering: `rajesh@royalcatering.com`
- Urban Events Catering: `priya@urbanevents.com`
- Food Fiesta Catering: `amit@foodfiesta.com`

## Deployment

### Backend (Render/Railway)

1. Push code to GitHub
2. Connect repository to Render/Railway
3. Set environment variables
4. Deploy

### Frontend (Vercel)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Database (PlanetScale/Amazon RDS)

1. Create MySQL database instance
2. Run schema.sql and seed.sql
3. Update backend environment variables

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new tenant
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Events
- `GET /api/events` - List events
- `POST /api/events` - Create event
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `GET /api/events/calendar` - Get events for calendar

### Menu
- `GET /api/menu/categories` - List categories
- `GET /api/menu/items` - List menu items
- `GET /api/menu/packages` - List packages

### Inventory
- `GET /api/inventory/items` - List inventory items
- `GET /api/inventory/items/low-stock` - Get low stock alerts
- `POST /api/inventory/transactions` - Record transaction

### Invoices & Payments
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/payments` - List payments
- `POST /api/payments` - Record payment

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/calendar` - Get calendar events
- `GET /api/dashboard/notifications` - Get notifications

## Environment Variables

### Backend (.env)
```
NODE_ENV=production
PORT=5000
DB_HOST=your-db-host
DB_NAME=caterflow
DB_USER=your-db-user
DB_PASSWORD=your-db-password
JWT_SECRET=your-jwt-secret
STRIPE_SECRET_KEY=sk_live_...
RAZORPAY_KEY_ID=rzp_live_...
FRONTEND_URL=https://your-domain.com
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

## License

MIT License - See LICENSE file for details

## Support

For support, email support@caterflow.com or open an issue on GitHub.
