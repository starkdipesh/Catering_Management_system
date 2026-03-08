# CaterFlow - Complete System Workflow Documentation

## Table of Contents
1. [System Architecture Overview](#1-system-architecture-overview)
2. [User Roles & Permissions](#2-user-roles--permissions)
3. [Complete Workflow Diagrams](#3-complete-workflow-diagrams)
4. [Module-by-Module Workflows](#4-module-by-module-workflows)
5. [Data Flow & Integration](#5-data-flow--integration)
6. [Business Logic & Rules](#6-business-logic--rules)

---

## 1. System Architecture Overview

### 1.1 Multi-Tenant SaaS Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CATERFLOW SAAS PLATFORM                             │
│                           (Single Codebase)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │   Tenant A      │  │   Tenant B      │  │   Tenant C      │              │
│  │  Royal Catering │  │  Urban Events   │  │  Food Fiesta    │              │
│  │                 │  │                 │  │                 │              │
│  │  • Users: 15    │  │  • Users: 8     │  │  • Users: 5     │              │
│  │  • Customers:200│  │  • Customers:120│  │  • Customers:80 │              │
│  │  • Events:50/mo │  │  • Events:30/mo │  │  • Events:20/mo │              │
│  │  • Plan: Pro    │  │  • Plan: Free   │  │  • Plan: Basic  │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
│                                                                             │
│  Each tenant has COMPLETE DATA ISOLATION                                    │
│  • Separate database rows (tenant_id filter on every query)                 │
│  • Independent customers, events, invoices                                  │
│  • Role-based access within tenant                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Tech Stack Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Browser/Devices → Next.js 14 (React 18) → TailwindCSS → Heroicons          │
│                                                                             │
│  State Management:                                                          │
│  • AuthContext (JWT tokens, user state)                                     │
│  • React Query (server state, caching)                                      │
│  • Zustand (optional client state)                                          │
│                                                                             │
│  Charts: Chart.js (revenue, event distribution)                             │
│  Forms: Native React with validation                                        │
│  HTTP: Axios with interceptors (auto token refresh)                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ HTTPS/API Calls
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             API GATEWAY LAYER                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Express.js Server (Node.js 18+)                                            │
│                                                                             │
│  Middleware Pipeline:                                                       │
│  1. Helmet (Security headers)                                               │
│  2. CORS (Cross-origin requests)                                            │
│  3. Rate Limiting (100 req/15min)                                           │
│  4. Body Parser (JSON, URL-encoded)                                         │
│  5. Compression (gzip)                                                      │
│  6. Morgan (Request logging)                                                │
│                                                                             │
│  Auth Middleware:                                                           │
│  • JWT verification                                                         │
│  • Tenant isolation (extract tenant_id from token)                          │
│  • Role checking (super_admin, tenant_admin, manager, staff)                │
│  • Subscription limit checking                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ SQL Queries
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             DATA LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  MySQL 8.0 Database                                                         │
│                                                                             │
│  Connection Pool (mysql2)                                                   │
│  • Max connections: 10                                                      │
│  • Query timeout: 30s                                                       │
│  • Automatic reconnection                                                   │
│                                                                             │
│  25+ Tables with relationships                                              │
│  • Indexes on all foreign keys                                              │
│  • Composite indexes for tenant queries                                     │
│  • JSON columns for flexible data                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ Webhook Events
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL INTEGRATIONS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Payment Gateways:                                                          │
│  • Stripe (International) → /webhooks/stripe                                │
│  • Razorpay (India) → /webhooks/razorpay/verify                             │
│                                                                             │
│  Email Service (Nodemailer):                                                │
│  • Welcome emails                                                           │
│  • Invoice notifications                                                    │
│  • Password reset                                                           │
│  • Low stock alerts                                                         │
│                                                                             │
│  File Storage (Optional):                                                   │
│  • AWS S3 / Cloudinary for logo uploads                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. User Roles & Permissions

### 2.1 Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ROLE HIERARCHY                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  SUPER_ADMIN (Platform Owner)                                               │
│  ├── Can view ALL tenants                                                   │
│  ├── Can manage subscription plans                                          │
│  ├── Can suspend/activate tenants                                           │
│  ├── Can view platform revenue                                              │
│  ├── Can impersonate any tenant                                             │
│  └── tenant_id = NULL (not bound to any tenant)                             │
│                                                                             │
│  TENANT_ADMIN (Business Owner)                                              │
│  ├── Can manage their tenant's settings                                     │
│  ├── Can manage users (create/edit/delete)                                  │
│  ├── Can manage subscription (upgrade/downgrade)                            │
│  ├── Full access to all tenant data                                         │
│  ├── Can view reports and analytics                                         │
│  └── Assigned to ONE tenant                                                 │
│                                                                             │
│  MANAGER (Operations Manager)                                               │
│  ├── Can manage customers (CRUD)                                            │
│  ├── Can manage events (CRUD)                                               │
│  ├── Can manage inventory                                                   │
│  ├── Can manage invoices and payments                                       │
│  ├── Can assign staff to events                                             │
│  ├── Can view dashboard and reports                                         │
│  └── CANNOT: Manage users, subscription settings                            │
│                                                                             │
│  STAFF (Kitchen/Service Staff)                                              │
│  ├── Can view assigned events                                               │
│  ├── Can view personal schedule                                             │
│  ├── Can update task status                                                 │
│  ├── Can view menu items                                                    │
│  └── CANNOT: View financial data, customer info, manage others              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Permission Matrix

| Feature | Super Admin | Tenant Admin | Manager | Staff |
|---------|-------------|--------------|---------|-------|
| Manage All Tenants | ✓ | ✗ | ✗ | ✗ |
| Manage Subscription Plans | ✓ | ✗ | ✗ | ✗ |
| View Platform Stats | ✓ | ✗ | ✗ | ✗ |
| Manage Tenant Settings | ✗ | ✓ | ✗ | ✗ |
| Manage Users | ✗ | ✓ | ✗ | ✗ |
| Upgrade Subscription | ✗ | ✓ | ✗ | ✗ |
| Manage Customers | ✗ | ✓ | ✓ | ✗ |
| Manage Events | ✗ | ✓ | ✓ | ✗ |
| Manage Menu | ✗ | ✓ | ✓ | ✗ |
| Manage Inventory | ✗ | ✓ | ✓ | ✗ |
| Manage Invoices | ✗ | ✓ | ✓ | ✗ |
| Assign Staff | ✗ | ✓ | ✓ | ✗ |
| View Dashboard | ✓ | ✓ | ✓ | ✗ |
| View Own Schedule | ✗ | ✓ | ✓ | ✓ |
| View Menu Items | ✓ | ✓ | ✓ | ✓ |

---

## 3. Complete Workflow Diagrams

### 3.1 High-Level System Workflow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        CATERFLOW COMPLETE SYSTEM WORKFLOW                           │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: TENANT ONBOARDING (New Business Registration)                              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  1. LANDING PAGE                                                                    │
│     ├── View Pricing Plans                                                          │
│     ├── View Features                                                               │
│     └── Click "Get Started"                                                         │
│              │                                                                      │
│              ▼                                                                      │
│  2. REGISTRATION FORM                                                               │
│     ├── Enter Business Name                                                         │
│     ├── Enter Owner Name                                                            │
│     ├── Enter Email                                                                 │
│     ├── Enter Phone                                                                 │
│     ├── Enter Password                                                              │
│     └── Submit                                                                      │
│              │                                                                      │
│              ▼                                                                      │
│  3. BACKEND PROCESSING                                                              │
│     ├── Generate unique tenant_id (TNT-XXXXXX)                                      │
│     ├── Create tenant record                                                        │
│     ├── Assign FREE plan (14-day trial)                                             │
│     ├── Create tenant_admin user                                                    │
│     ├── Hash password                                                               │
│     ├── Generate JWT tokens                                                         │
│     ├── Send welcome email                                                          │
│     └── Log activity                                                                │
│              │                                                                      │
│              ▼                                                                      │
│  4. ONBOARDING DASHBOARD                                                            │
│     ├── Show "Welcome to CaterFlow"                                                 │
│     ├── Quick setup checklist:                                                      │
│     │   ├── [ ] Add business logo                                                   │
│     │   ├── [ ] Add first customer                                                  │
│     │   ├── [ ] Create first menu item                                              │
│     │   ├── [ ] Add staff members                                                   │
│     │   └── [ ] Create first event                                                  │
│     └── Trial countdown timer                                                       │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: CORE SETUP (Business Configuration)                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  1. SETTINGS & CONFIGURATION                                                        │
│     ├── Upload business logo                                                        │
│     ├── Configure tax rate (GST %)                                                  │
│     ├── Set invoice terms                                                           │
│     ├── Configure notification preferences                                          │
│     └── Set currency (INR/USD)                                                      │
│              │                                                                      │
│              ▼                                                                      │
│  2. MENU SETUP                                                                      │
│     ├── Create Categories (Starters, Mains, Desserts)                               │
│     │   └── For each category: name, description, order                             │
│     │                                                                               │
│     ├── Add Menu Items                                                              │
│     │   └── For each item:                                                          │
│     │       ├── Name, Description                                                   │
│     │       ├── Category assignment                                                 │
│     │       ├── Price per plate                                                     │
│     │       ├── Ingredients list                                                    │
│     │       ├── Dietary flags (veg/vegan/gluten-free)                               │
│     │       ├── Min quantity                                                        │
│     │       └── Upload image                                                        │
│     │                                                                               │
│     └── Create Menu Packages                                                        │
│         └── For each package:                                                       │
│             ├── Name (e.g., "Wedding Special")                                      │
│             ├── Type (standard/custom)                                              │
│             ├── Base price per plate                                                │
│             ├── Min guests                                                          │
│             └── Select items with quantities                                        │
│              │                                                                      │
│              ▼                                                                      │
│  3. INVENTORY SETUP                                                                 │
│     ├── Create Inventory Categories                                                 │
│     │   └── (Raw Materials, Spices, Beverages, Equipment)                           │
│     │                                                                               │
│     ├── Add Suppliers                                                               │
│     │   └── Name, Contact, Phone, Email, GST, Categories                            │
│     │                                                                               │
│     └── Add Inventory Items                                                         │
│         └── For each item:                                                          │
│             ├── Name, Description                                                   │
│             ├── Category, Supplier                                                  │
│             ├── Unit (kg, liters, pieces)                                           │
│             ├── Current quantity                                                    │
│             ├── Min threshold (reorder point)                                       │
│             ├── Cost per unit                                                       │
│             └── Storage location                                                    │
│              │                                                                      │
│              ▼                                                                      │
│  4. STAFF SETUP                                                                     │
│     └── For each staff member:                                                      │
│         ├── Create User (email, password, name, phone)                              │
│         ├── Set Role (manager/staff)                                                │
│         ├── Add Staff Details:                                                      │
│         │   ├── Employee code                                                       │
│         │   ├── Designation (Head Chef, Waiter, etc.)                               │
│         │   ├── Department (Kitchen/Service/Mgmt)                                   │
│         │   ├── Joining date                                                        │
│         │   ├── Salary & payment frequency                                          │
│         │   ├── Skills & certifications                                             │
│         │   └── Availability schedule                                               │
│         └── Set active/inactive                                                     │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: DAILY OPERATIONS (Event Management Cycle)                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  1. CUSTOMER ACQUISITION                                                            │
│     ├── Phone call / Walk-in / Website inquiry                                      │
│     │                                                                               │
│     └── Add New Customer                                                            │
│         ├── Name, Phone (required)                                                  │
│         ├── Email, Address                                                          │
│         ├── Type (individual/corporate)                                             │
│         ├── Company & GST (if corporate)                                            │
│         ├── Dietary preferences                                                     │
│         └── Notes                                                                   │
│              │                                                                      │
│              ▼                                                                      │
│  2. EVENT INQUIRY → BOOKING                                                         │
│     ├── Create Event Record                                                         │
│     │   ├── Select customer                                                         │
│     │   ├── Event name & type (wedding/corporate/etc.)                              │
│     │   ├── Event date & time                                                       │
│     │   ├── Duration                                                                │
│     │   ├── Venue details                                                           │
│     │   ├── Guest count                                                             │
│     │   └── Status = "inquiry"                                                      │
│     │                                                                               │
│     ├── Menu Planning                                                               │
│     │   ├── Select menu package OR custom items                                     │
│     │   ├── Customize per-guest items                                               │
│     │   ├── Add special dietary requirements                                        │
│     │   └── Calculate price per plate                                               │
│     │                                                                               │
│     ├── Cost Calculation                                                            │
│     │   ├── Subtotal = guest_count × price_per_plate                                │
│     │   ├── Apply discount (if any)                                                 │
│     │   ├── Calculate tax (GST)                                                     │
│     │   └── Final amount                                                            │
│     │                                                                               │
│     └── Send Quote to Customer                                                      │
│         ├── Generate quote PDF                                                      │
│         ├── Email/SMS to customer                                                   │
│         └── Update status = "quoted"                                                │
│              │                                                                      │
│              ▼                                                                      │
│  3. EVENT CONFIRMATION                                                              │
│     ├── Customer accepts quote                                                      │
│     │                                                                               │
│     ├── Update Event Status = "confirmed"                                           │
│     │                                                                               │
│     ├── Collect Advance Payment (typically 50%)                                     │
│     │   ├── Create invoice record                                                   │
│     │   ├── Generate invoice PDF                                                    │
│     │   ├── Record payment                                                          │
│     │   └── Update payment_status = "partial"                                       │
│     │                                                                               │
│     └── Assign Resources                                                            │
│         ├── Assign manager to event                                                 │
│         ├── Schedule staff assignments                                              │
│         └── Reserve inventory items                                                 │
│              │                                                                      │
│              ▼                                                                      │
│  4. EVENT PREPARATION                                                               │
│     ├── Staff Assignments                                                           │
│     │   ├── View staff availability                                                 │
│     │   ├── Select staff for event                                                  │
│     │   ├── Define role at event (Chef, Server, etc.)                               │
│     │   ├── Set task assignments                                                    │
│     │   ├── Set start/end times                                                     │
│     │   └── Check for conflicts                                                     │
│     │                                                                               │
│     ├── Inventory Preparation                                                       │
│     │   ├── Auto-calculate ingredient requirements                                  │
│     │   ├── Check current stock levels                                              │
│     │   ├── Generate purchase orders (if short)                                     │
│     │   └── Create inventory transactions (consumption)                             │
│     │                                                                               │
│     ├── Event Timeline                                                              │
│     │   ├── Create timeline entries                                                 │
│     │   │   ├── Setup (3 hours before)                                              │
│     │   │   ├── Preparation (2 hours before)                                        │
│     │   │   ├── Service (event time)                                                │
│     │   │   └── Cleanup (after event)                                               │
│     │   └── Assign staff to each timeline                                           │
│     │                                                                               │
│     └── Final Invoice                                                               │
│         ├── Create final invoice                                                    │
│         ├── Include advance adjustment                                              │
│         ├── Calculate balance due                                                   │
│         └── Send to customer                                                        │
│              │                                                                      │
│              ▼                                                                      │
│  5. EVENT EXECUTION                                                                 │
│     ├── Day of Event                                                                │
│     │   ├── Manager marks status = "in_progress"                                    │
│     │   ├── Staff check-in via dashboard                                            │
│     │   └── Timeline updates (setup → service → cleanup)                            │
│     │                                                                               │
│     ├── Real-time Updates                                                           │
│     │   ├── Staff update task status                                                │
│     │   ├── Manager monitors progress                                               │
│     │   └── Handle issues/changes                                                   │
│     │                                                                               │
│     └── Post-Event                                                                  │
│         ├── Manager marks status = "completed"                                      │
│         ├── Staff checkout                                                          │
│         └── Final inventory deduction                                               │
│              │                                                                      │
│              ▼                                                                      │
│  6. POST-EVENT (Billing & Follow-up)                                                │
│     ├── Final Payment Collection                                                    │
│     │   ├── Send payment reminder                                                   │
│     │   ├── Record payment                                                          │
│     │   ├── Generate receipt                                                        │
│     │   └── Update payment_status = "paid"                                          │
│     │                                                                               │
│     ├── Customer Update                                                             │
│     │   ├── Update total_events count                                               │
│     │   ├── Update total_revenue                                                    │
│     │   └── Update last_event_date                                                  │
│     │                                                                               │
│     └── Feedback & Review                                                           │
│         ├── (Optional) Add notes about event                                        │
│         └── Update customer preferences                                             │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: INVENTORY MANAGEMENT (Ongoing)                                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  1. MONITORING                                                                      │
│     ├── System checks stock levels daily                                            │
│     ├── Compares against min_threshold                                              │
│     └── Generates low stock alerts                                                  │
│              │                                                                      │
│              ▼                                                                      │
│  2. LOW STOCK ALERTS                                                                │
│     ├── Dashboard notification                                                      │
│     ├── Email to managers                                                           │
│     └── Alert in notifications panel                                                │
│              │                                                                      │
│              ▼                                                                      │
│  3. REPLENISHMENT                                                                   │
│     ├── Create Purchase Order                                                       │
│     │   ├── Select supplier                                                         │
│     │   ├── Select items to purchase                                                │
│     │   ├── Set quantities                                                          │
│     │   └── Calculate costs                                                         │
│     │                                                                               │
│     ├── Record Receipt                                                              │
│     │   └── Create "purchase" transaction                                           │
│     │       ├── Update inventory quantity                                           │
│     │       ├── Record unit cost                                                    │
│     │       └── Calculate total cost                                                │
│     │                                                                               │
│     └── Stock Adjustment (if needed)                                                │
│         ├── Wastage recording                                                       │
│         ├── Spoilage recording                                                      │
│         └── Manual adjustments                                                      │
│                                                                                     │
│  4. AUTO CONSUMPTION (Linked to Events)                                             │
│     ├── When event is completed:                                                    │
│     │   └── Calculate ingredient usage from menu items                              │
│     │       ├── Recipe: Butter Chicken needs 200g chicken per plate                 │
│     │       ├── Event: 100 guests ordered Butter Chicken                            │
│     │       └── Deduct: 20kg chicken from inventory                                 │
│     └── Create "consumption" transaction                                            │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 5: BILLING & FINANCE (Ongoing)                                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  1. INVOICE LIFECYCLE                                                               │
│     ├── Draft → Sent → Paid / Overdue → Cancelled / Refunded                        │
│     │                                                                               │
│     └── Status Changes:                                                             │
│         ├── Draft: Created, not yet sent                                            │
│         ├── Sent: Emailed to customer                                               │
│         ├── Partial: Some payment received                                          │
│         ├── Paid: Full payment received                                             │
│         ├── Overdue: Past due date                                                  │
│         ├── Cancelled: Voided                                                       │
│         └── Refunded: Money returned                                                │
│              │                                                                      │
│              ▼                                                                      │
│  2. PAYMENT METHODS                                                                 │
│     ├── Cash                                                                        │
│     ├── Bank Transfer / UPI                                                         │
│     ├── Card (debit/credit)                                                         │
│     ├── Cheque                                                                      │
│     ├── Online (Stripe/Razorpay)                                                    │
│     └── Other                                                                       │
│              │                                                                      │
│              ▼                                                                      │
│  3. PARTIAL PAYMENTS                                                                │
│     ├── Record multiple payments against single invoice                             │
│     ├── Track amount_paid vs total_amount                                           │
│     ├── Calculate amount_due                                                        │
│     └── Send balance reminders                                                      │
│              │                                                                      │
│              ▼                                                                      │
│  4. OVERDUE MANAGEMENT                                                              │
│     ├── Daily check for overdue invoices                                            │
│     ├── Dashboard alerts                                                            │
│     ├── Send reminder emails                                                        │
│     └── Escalation tracking                                                         │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 6: SUBSCRIPTION & BILLING (SaaS Revenue)                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  1. SUBSCRIPTION PLANS                                                              │
│     ├── FREE (14-day trial)                                                         │
│     │   └── Max 5 events/month, 3 staff, basic features                             │
│     │                                                                               │
│     ├── PRO (₹999/month or ₹9990/year)                                              │
│     │   └── Max 50 events/month, 20 staff, all features                             │
│     │                                                                               │
│     ├── BUSINESS (₹2999/month or ₹29990/year)                                       │
│     │   └── Unlimited events, 100 staff, priority support                           │
│     │                                                                               │
│     └── ENTERPRISE (Custom pricing)                                                 │
│         └── Custom limits, dedicated support                                        │
│              │                                                                      │
│              ▼                                                                      │
│  2. SUBSCRIPTION LIFECYCLE                                                          │
│     ├── Trial (14 days)                                                             │
│     │   └── Countdown shown in dashboard                                            │
│     │                                                                               │
│     ├── Active                                                                      │
│     │   └── Regular monthly/yearly billing                                          │
│     │                                                                               │
│     ├── Past Due                                                                    │
│     │   └── Payment failed, grace period                                            │
│     │                                                                               │
│     ├── Cancelled                                                                   │
│     │   └── User cancelled, access until period end                                 │
│     │                                                                               │
│     └── Suspended                                                                   │
│         └── Non-payment or violation, no access                                     │
│              │                                                                      │
│              ▼                                                                      │
│  3. BILLING PROCESS                                                                 │
│     ├── Monthly/Yearly invoice generated                                            │
│     ├── Email notification                                                          │
│     ├── Payment processing (Stripe/Razorpay)                                        │
│     ├── Webhook confirmation                                                        │
│     └── PDF invoice generated                                                       │
│              │                                                                      │
│              ▼                                                                      │
│  4. UPGRADE/DOWNGRADE                                                               │
│     ├── User selects new plan                                                       │
│     ├── Prorated calculation                                                        │
│     ├── Payment or refund processing                                                │
│     └── Immediate feature access                                                    │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 7: REPORTING & ANALYTICS                                                      │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  1. DASHBOARD METRICS                                                               │
│     ├── Real-time stats:                                                            │
│     │   ├── Total events (this month)                                               │
│     │   ├── Monthly revenue                                                         │
│     │   ├── Upcoming events count                                                   │
│     │   ├── Pending payments total                                                  │
│     │   └── Low stock alerts                                                        │
│     │                                                                               │
│     └── Charts:                                                                     │
│         ├── Monthly revenue trend (12 months)                                       │
│         ├── Event type distribution                                                 │
│         └── Customer acquisition                                                    │
│              │                                                                      │
│              ▼                                                                      │
│  2. DETAILED REPORTS                                                                │
│     ├── Revenue Report                                                              │
│     │   ├── By date range                                                           │
│     │   ├── By customer                                                             │
│     │   ├── By event type                                                           │
│     │   └── Export to CSV/PDF                                                       │
│     │                                                                               │
│     ├── Event Report                                                                │
│     │   ├── Upcoming events list                                                    │
│     │   ├── Completed events                                                        │
│     │   ├── Cancelled events                                                        │
│     │   └── Staff assignments                                                       │
│     │                                                                               │
│     ├── Inventory Report                                                            │
│     │   ├── Stock levels                                                            │
│     │   ├── Transaction history                                                     │
│     │   ├── Consumption by event                                                    │
│     │   └── Purchase analysis                                                       │
│     │                                                                               │
│     └── Staff Report                                                                │
│         ├── Workload by staff                                                       │
│         ├── Event assignments                                                       │
│         ├── Availability calendar                                                   │
│         └── Performance tracking                                                    │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 8: SUPER ADMIN OPERATIONS (Platform Management)                               │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  1. PLATFORM MONITORING                                                             │
│     ├── Dashboard showing:                                                          │
│     │   ├── Total tenants                                                           │
│     │   ├── Active subscriptions                                                    │
│     │   ├── Monthly recurring revenue (MRR)                                         │
│     │   ├── Churn rate                                                              │
│     │   └── Recent signups                                                          │
│     │                                                                               │
│     └── Health checks:                                                              │
│         ├── API response times                                                      │
│         ├── Database performance                                                    │
│         └── Error rates                                                             │
│                                                                                     │
│              ▼                                                                      │
│  2. TENANT MANAGEMENT                                                               │
│     ├── View all tenants list                                                       │
│     ├── Filter by: active, suspended, plan type                                     │
│     ├── View tenant details:                                                        │
│     │   ├── Business info, owner details                                            │
│     │   ├── Subscription status                                                     │
│     │   ├── Usage stats (events, staff)                                             │
│     │   └── Billing history                                                         │
│     │                                                                               │
│     ├── Actions:                                                                    │
│     │   ├── Suspend/Unsuspend tenant                                                │
│     │   ├── Change plan manually                                                    │
│     │   ├── Extend trial                                                            │
│     │   ├── Impersonate (login as tenant admin)                                     │
│     │   └── Delete tenant (with confirmation)                                       │
│     │                                                                               │
│     └── Bulk operations:                                                            │
│         └── Email all tenants                                                       │
│              │                                                                      │
│              ▼                                                                      │
│  3. SUBSCRIPTION PLAN MANAGEMENT                                                    │
│     ├── Create new plans                                                            │
│     ├── Edit existing plans                                                         │
│     ├── Set pricing (monthly/yearly)                                                │
│     ├── Configure limits (events, staff)                                            │
│     ├── Define features list                                                        │
│     └── Activate/Deactivate plans                                                   │
│              │                                                                      │
│              ▼                                                                      │
│  4. BILLING & REVENUE                                                               │
│     ├── View all subscription invoices                                              │
│     ├── Filter by status (paid, pending, failed)                                    │
│     ├── Retry failed payments                                                       │
│     ├── Issue refunds                                                               │
│     └── Generate revenue reports                                                    │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Module-by-Module Workflows

### 4.1 Authentication & Security Flow

```
USER ACTIONS                    SYSTEM PROCESSING
────────────────────────────────────────────────────────────────

1. REGISTRATION
   Enter details                    Validate input
   Submit                           Check email uniqueness
                                    Generate tenant_id
                                    Hash password (bcrypt)
                                    Create tenant record
                                    Create user record
                                    Generate JWT tokens
                                    Send welcome email
                                    Return tokens + user data

2. LOGIN
   Enter credentials                Validate credentials
   Submit                           Verify password hash
                                    Generate access token (1d expiry)
                                    Generate refresh token (7d expiry)
                                    Store refresh token in DB
                                    Update last_login
                                    Return tokens + user data

3. API ACCESS (Every Request)
   Send request with                Verify token signature
   Bearer token                     Check token expiry
                                    Extract user_id, tenant_id
                                    Verify user exists & active
                                    Check tenant active & not suspended
                                    Check role permissions
                                    Add tenant_id to query filters
                                    Process request
                                    Return response

4. TOKEN REFRESH (When 401)
   Send refresh token               Verify refresh token
   to /auth/refresh                 Check against DB record
                                    Generate new access token
                                    Return new token

5. LOGOUT
   Call /auth/logout                Invalidate refresh token
                                    Clear client cookies
                                    Return success
```

### 4.2 Tenant Isolation Mechanism

```
EVERY DATABASE QUERY AUTOMATICALLY INCLUDES tenant_id FILTER:

Example: Getting events

Manager requests: GET /events?page=1

1. Auth middleware extracts tenant_id from JWT
   token = { user_id: 15, tenant_id: 7, role: 'manager', ... }

2. Tenant isolation middleware attaches tenant_id to request
   req.tenantId = 7

3. Controller calls: Event.findAll({ tenant_id: 7, page: 1 })

4. Generated SQL:
   SELECT * FROM events
   WHERE tenant_id = 7          <-- CRITICAL ISOLATION
   ORDER BY event_date DESC
   LIMIT 20 OFFSET 0

Result: Manager ONLY sees events for their tenant (Tenant 7)
        Events from other tenants are completely invisible

┌─────────────────────────────────────────────────────────────┐
│  SECURITY GUARANTEE                                          │
│  • No tenant can access another tenant's data               │
│  • All tables have tenant_id column                         │
│  • Foreign keys cascade delete with tenant                  │
│  • Super_admin has tenant_id = NULL (sees all)              │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Event State Machine

```
                    ┌──────────────┐
                    │   INQUIRY    │ ←── New event created
                    └──────┬───────┘
                           │ Quote sent
                           ▼
                    ┌──────────────┐
                    │   QUOTED     │ ←── Quote generated, waiting
                    └──────┬───────┘
                           │ Customer accepts
                           ▼
                    ┌──────────────┐
         ┌─────────│  CONFIRMED   │ ←── Contract confirmed
         │         └──────┬───────┘
         │ Cancel          │ Advance paid
         │                 ▼
         │         ┌──────────────┐
         │         │ IN_PROGRESS  │ ←── Event day, staff working
         │         └──────┬───────┘
         │                │ Event complete
         │                ▼
         │         ┌──────────────┐
         └────────►│  COMPLETED   │ ←── Final payment, done
                   └──────┬───────┘
                          │
              ┌───────────┴───────────┐
              │                         │
              ▼                         ▼
       ┌──────────────┐         ┌──────────────┐
       │  CANCELLED   │         │   REFUNDED   │
       └──────────────┘         └──────────────┘

STATE TRANSITIONS:
• inquiry → quoted: When quote is generated
• quoted → confirmed: When customer accepts and advance paid
• quoted → cancelled: If customer declines
• confirmed → in_progress: On event date
• in_progress → completed: When event finished
• any → cancelled: If event cancelled (before completion)
```

### 4.4 Invoice & Payment Flow

```
EVENT CONFIRMATION
        │
        ▼
┌─────────────────────┐
│ Create Invoice #001 │
│ - Subtotal: ₹75,000 │
│ - Tax (18%): ₹13,500│
│ - Total: ₹88,500    │
│ - Status: DRAFT     │
└─────────┬───────────┘
          │ Generate PDF
          ▼
┌─────────────────────┐
│ Status: SENT        │
│ Email to customer   │
└─────────┬───────────┘
          │
          ├─────────────────────┐
          │                     │
          ▼                     ▼
┌─────────────────┐    ┌─────────────────┐
│ Record Payment  │    │  OVERDUE        │
│ Amount: ₹44,250 │    │  (Auto after    │
│ Method: Bank    │    │   due date)     │
│ Status: Partial │    │                 │
└────────┬────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│ Record Payment  │
│ Amount: ₹44,250 │
│ Balance: PAID   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Status: PAID    │
│ PDF Receipt     │
└─────────────────┘

PAYMENT METHODS SUPPORTED:
• Cash → Manual entry by manager
• Bank Transfer/UPI → Record UTR number
• Card → Via Stripe/Razorpay
• Cheque → Record cheque number, date
• Online → Automatic via payment gateway
```

---

## 5. Data Flow & Integration

### 5.1 Webhook Flow (Stripe/Razorpay)

```
CUSTOMER                        PAYMENT GATEWAY                    OUR SYSTEM
────────────────────────────────────────────────────────────────────────────────

Clicks "Pay Now"
        │
        ▼
    ┌─────────┐
    │ Stripe  │────┐
    │ Checkout│    │
    └─────────┘    │
                   │
              Payment
              Success
                   │
                   ▼
            ┌────────────┐
            │  Webhook   │─────────────────────────────┐
            │  Triggered │                             │
            └────────────┘                             │
                                                       │
                                                       ▼
                                            ┌────────────────────-─┐
                                            │ POST /webhooks/stripe│
                                            │ Signature verified   │
                                            └──────────┬───────────┘
                                                       │
                                                       ▼
                                            ┌─────────────────────┐
                                            │ Extract event data  │
                                            │ - customer_id       │
                                            │ - subscription_id   │
                                            │ - invoice_id        │
                                            │ - amount            │
                                            └──────────┬──────────┘
                                                       │
                                                       ▼
                                            ┌────────────────────-─┐
                                            │ Update tenant:       │
                                            │ subscription_status  │
                                            │ subscription_end_date│
                                            └──────────┬───────────┘
                                                       │
                                                       ▼
                                            ┌────────────────────-─┐
                                            │ Create subscription  │
                                            │ invoice record       │
                                            │ Mark as PAID         │
                                            └──────────┬───────────┘
                                                       │
                                                       ▼
                                            ┌─────────────────────┐
                                            │ Log activity        │
                                            │ Send confirmation   │
                                            │ email to customer   │
                                            └─────────────────────┘
```

### 5.2 Email Notification Flow

```
TRIGGER EVENTS                              EMAIL SENT
────────────────────────────────────────────────────────────────

User Registration                    → Welcome email with login details
Password Reset Request               → Reset link (expires in 1 hour)
Quote Sent to Customer               → Quote PDF attached
Invoice Generated                    → Invoice PDF with payment link
Payment Received                     → Payment receipt PDF
Low Stock Alert                      → Alert to managers
Subscription Expiring (3 days)       → Renewal reminder
Subscription Payment Failed          → Payment failure + retry link
New Staff Added                      → Welcome email with credentials
Event Reminder (1 day before)        → Event details to assigned staff
```

---

## 6. Business Logic & Rules

### 6.1 Subscription Limit Enforcement

```
SCENARIO: Tenant on FREE plan (max 5 events/month)

┌──────────────────────────────────────────────────────────────┐
│ Current Usage: 4 events this month                           │
└──────────────────────────────────────────────────────────────┘
            │
            ▼
User tries to create 5th event
            │
            ▼
┌──────────────────────────────────────────────────────────────┐
│ checkSubscriptionLimits('events')                            │
│                                                              │
│ 1. Get tenant's current plan limits                          │
│ 2. Count current month's events: 4                           │
│ 3. Check: 4 < 5 (limit) → ALLOWED                            │
│                                                              │
│ Create event successfully                                    │
└──────────────────────────────────────────────────────────────┘
            │
            ▼
User tries to create 6th event
            │
            ▼
┌──────────────────────────────────────────────────────────────┐
│ checkSubscriptionLimits('events')                            │
│                                                              │
│ 1. Count current month's events: 5                           │
│ 2. Check: 5 >= 5 (limit) → BLOCKED                           │
│                                                              │
│ Response:                                                    │
│ {                                                            │
│   "success": false,                                          │
│   "message": "Event limit reached...",                       │
│   "code": "EVENT_LIMIT_REACHED",                             │
│   "upgrade_url": "/subscription"                             │
│ }                                                            │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Inventory Auto-Deduction Rules

```
EVENT COMPLETION TRIGGERS INVENTORY UPDATE:

┌─────────────────────────────────────────────────────────────────┐
│ Event: Wedding Reception                                        │
│ Guests: 500                                                     │
│ Menu: Butter Chicken (200 guests), Paneer Tikka (300 guests)    │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│ RECIPE DEFINITIONS (stored in menu_items.ingredients):          │
│                                                                 │
│ Butter Chicken per plate:                                       │
│   - Chicken: 200g                                               │
│   - Butter: 20g                                                 │
│   - Cream: 30ml                                                 │
│   - Spices: 10g                                                 │
│                                                                 │
│ Paneer Tikka per plate:                                         │
│   - Paneer: 150g                                                │
│   - Yogurt: 50g                                                 │
│   - Spices: 15g                                                 │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│ CALCULATION:                                                    │
│                                                                 │
│ Butter Chicken (200 plates):                                    │
│   - Chicken needed: 200 × 200g = 40,000g = 40kg                 │
│   - Butter needed: 200 × 20g = 4,000g = 4kg                     │
│   - Cream needed: 200 × 30ml = 6,000ml = 6L                     │
│   - Spices needed: 200 × 10g = 2,000g = 2kg                     │
│                                                                 │
│ Paneer Tikka (300 plates):                                      │
│   - Paneer needed: 300 × 150g = 45,000g = 45kg                  │
│   - Yogurt needed: 300 × 50g = 15,000g = 15kg                   │
│   - Spices needed: 300 × 15g = 4,500g = 4.5kg                   │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│ AUTO-CREATE INVENTORY TRANSACTIONS:                             │
│                                                                 │
│ 1. Chicken: -40kg (consumption)                                 │
│ 2. Butter: -4kg (consumption)                                   │
│ 3. Cream: -6L (consumption)                                     │
│ 4. Spices: -6.5kg (consumption - combined)                      │
│ 5. Paneer: -45kg (consumption)                                  │
│ 6. Yogurt: -15kg (consumption)                                  │
│                                                                 │
│ Each transaction:                                               │
│   - type: 'consumption'                                         │
│   - reference_type: 'event'                                     │
│   - reference_id: <event_id>                                    │
│   - performed_by: <system/manager_id>                           │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Staff Conflict Detection

```
SCENARIO: Assign Chef Vikram to Event A and Event B

┌─────────────────────────────────────────────────────────────────┐
│ EVENT A: Wedding Reception                                      │
│ Date: 2024-06-15                                                │
│ Staff: Vikram (Chef)                                            │
│ Time: 14:00 - 23:00 (9 hours)                                   │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│ TRYING TO ASSIGN SAME STAFF TO EVENT B:                         │
│                                                                 │
│ Event B: Corporate Lunch                                        │
│ Date: 2024-06-15 (same day)                                     │
│ Requested Time: 18:00 - 21:00 (3 hours)                         │
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│ checkConflicts(staff_id=5, start='18:00', end='21:00')          │
│                                                                 │
│ Query existing assignments:                                     │
│   - Found: Event A (14:00-23:00)                                │
│                                                                 │
│ Conflict Detection Logic:                                       │
│   - New: 18:00-21:00                                            │
│   - Existing: 14:00-23:00                                       │
│   - Overlap: 18:00-21:00 (3 hours overlap)                      │
│                                                                 │
│ RESULT: CONFLICT DETECTED                                       │
│                                                                 │
│ Response:                                                       │
│ {                                                               │
│   "success": false,                                             │
│   "message": "Staff has scheduling conflict",                   │
│   "conflicts": [{                                               │
│     "event_name": "Wedding Reception",                          │
│     "time": "14:00 - 23:00"                                     │
│   }]                                                            │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

### 6.4 Revenue Recognition

```
REVENUE CALCULATION LOGIC:

For every completed event with payment_status = 'paid':

┌─────────────────────────────────────────────────────────────────┐
│ Revenue Attribution:                                            │
│                                                                 │
│ 1. Event Date: 2024-06-15                                       │
│ 2. Payment Date: 2024-06-10 (advance) + 2024-06-20 (balance)    │
│ 3. Final Amount: ₹88,500                                        │
│                                                                 │
│ Monthly Revenue Report (June 2024):                             │
│   - Includes: ₹88,500 (full amount in June)                     │
│                                                                 │
│ Key Metrics Updated:                                            │
│   - customers.total_revenue += 88500                            │
│   - customers.total_events += 1                                 │
│   - tenants (total revenue tracking)                            │
│   - dashboard monthly revenue chart                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference: File Locations

| Component | Path |
|-----------|------|
| Database Schema | `/database/schema.sql` |
| ER Diagram | `/database/ER_DIAGRAM.md` |
| API Documentation | `/backend/API_DOCUMENTATION.md` |
| Backend Models | `/backend/models/*.js` |
| Backend Controllers | `/backend/controllers/*.js` |
| API Routes | `/backend/routes/index.js` |
| Frontend Pages | `/frontend/app/**/*.js` |

---

## Default Credentials (Development)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@caterflow.com` | `SuperAdmin123!` |
| Sample Tenant 1 | `owner@royalcatering.com` | `Admin123!` |
| Sample Tenant 2 | `owner@urbanevents.com` | `Admin123!` |

---

*Generated for CaterFlow Catering Management SaaS Platform*
