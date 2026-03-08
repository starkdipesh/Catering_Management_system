# CaterFlow API Documentation

## Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Public Endpoints (No Auth Required)
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

### Webhook Endpoints
- `POST /webhooks/stripe`
- `POST /webhooks/razorpay/verify`

---

## Authentication API

### Register New Tenant
```http
POST /auth/register
```

**Request Body:**
```json
{
  "business_name": "Royal Catering",
  "owner_name": "John Doe",
  "email": "john@royalcatering.com",
  "phone": "+91-98765-43210",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tenant registered successfully",
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@royalcatering.com",
  "password": "SecurePass123!"
}
```

### Refresh Token
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "<refresh_token>"
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

### Logout
```http
POST /auth/logout
Authorization: Bearer <token>
```

### Change Password
```http
POST /auth/change-password
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpass",
  "newPassword": "newpass123"
}
```

---

## Users API

### List Users
```http
GET /users?page=1&limit=20&role=staff&is_active=true
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `role` - Filter by role (optional)
- `is_active` - Filter by status (optional)

### Get User by ID
```http
GET /users/:id
Authorization: Bearer <token>
```

### Create User
```http
POST /users
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "staff@example.com",
  "password": "TempPass123!",
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+91-98765-43210",
  "role": "staff"
}
```

### Update User
```http
PUT /users/:id
Authorization: Bearer <token>
```

### Delete User
```http
DELETE /users/:id
Authorization: Bearer <token>
```

### Reset User Password
```http
POST /users/:id/reset-password
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "new_password": "NewPass123!"
}
```

---

## Customers API

### List Customers
```http
GET /customers?page=1&limit=20&search=john&type=corporate
Authorization: Bearer <token>
```

### Search Customers
```http
GET /customers/search?q=john
Authorization: Bearer <token>
```

### Get Customer by ID
```http
GET /customers/:id
Authorization: Bearer <token>
```

### Create Customer
```http
POST /customers
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "first_name": "Rahul",
  "last_name": "Sharma",
  "email": "rahul@example.com",
  "phone": "+91-98765-43210",
  "customer_type": "individual",
  "address_line1": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "postal_code": "400001",
  "notes": "VIP customer"
}
```

### Update Customer
```http
PUT /customers/:id
Authorization: Bearer <token>
```

### Delete Customer
```http
DELETE /customers/:id
Authorization: Bearer <token>
```

### Get Customer Event History
```http
GET /customers/:id/events
Authorization: Bearer <token>
```

---

## Events API

### List Events
```http
GET /events?page=1&limit=20&status=confirmed&start_date=2024-01-01&end_date=2024-12-31
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`, `limit` - Pagination
- `status` - Filter by status (inquiry, quoted, confirmed, in_progress, completed, cancelled)
- `customer_id` - Filter by customer
- `start_date`, `end_date` - Date range filter

### Get Event by ID
```http
GET /events/:id
Authorization: Bearer <token>
```

### Create Event
```http
POST /events
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "customer_id": 1,
  "event_name": "Wedding Reception",
  "event_type": "wedding",
  "event_date": "2024-06-15",
  "event_time": "19:00:00",
  "duration_hours": 6,
  "venue_name": "Grand Ballroom Hotel",
  "venue_address": "123 Celebration Ave",
  "city": "Mumbai",
  "guest_count": 500,
  "menu_package_id": 1,
  "dietary_requirements": "Vegetarian options required",
  "price_per_plate": 1500,
  "notes": "Client prefers North Indian cuisine"
}
```

### Update Event
```http
PUT /events/:id
Authorization: Bearer <token>
```

### Delete Event
```http
DELETE /events/:id
Authorization: Bearer <token>
```

### Update Event Status
```http
PATCH /events/:id/status
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "confirmed"
}
```

### Get Calendar Events
```http
GET /events/calendar?start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer <token>
```

### Get Event Statistics
```http
GET /events/stats
Authorization: Bearer <token>
```

---

## Menu API

### Categories

#### List Categories
```http
GET /menu/categories
Authorization: Bearer <token>
```

#### Create Category
```http
POST /menu/categories
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Starters",
  "description": "Appetizers and starters",
  "display_order": 1
}
```

#### Update Category
```http
PUT /menu/categories/:id
Authorization: Bearer <token>
```

#### Delete Category
```http
DELETE /menu/categories/:id
Authorization: Bearer <token>
```

### Menu Items

#### List Items
```http
GET /menu/items?category_id=1&is_active=true
Authorization: Bearer <token>
```

#### Get Item by ID
```http
GET /menu/items/:id
Authorization: Bearer <token>
```

#### Create Item
```http
POST /menu/items
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "category_id": 1,
  "name": "Paneer Tikka",
  "description": "Grilled cottage cheese with spices",
  "price_per_plate": 120,
  "ingredients": "Paneer, yogurt, spices",
  "is_vegetarian": true,
  "is_vegan": false,
  "is_gluten_free": true
}
```

#### Update Item
```http
PUT /menu/items/:id
Authorization: Bearer <token>
```

#### Delete Item
```http
DELETE /menu/items/:id
Authorization: Bearer <token>
```

### Menu Packages

#### List Packages
```http
GET /menu/packages
Authorization: Bearer <token>
```

#### Get Package by ID
```http
GET /menu/packages/:id
Authorization: Bearer <token>
```

#### Create Package
```http
POST /menu/packages
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Wedding Special",
  "description": "Complete wedding menu package",
  "package_type": "standard",
  "base_price_per_plate": 1500,
  "min_guests": 100,
  "items": [
    { "menu_item_id": 1, "quantity": 1 },
    { "menu_item_id": 2, "quantity": 1 }
  ]
}
```

#### Update Package
```http
PUT /menu/packages/:id
Authorization: Bearer <token>
```

#### Delete Package
```http
DELETE /menu/packages/:id
Authorization: Bearer <token>
```

---

## Inventory API

### Categories

#### List Categories
```http
GET /inventory/categories
Authorization: Bearer <token>
```

#### Create Category
```http
POST /inventory/categories
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Spices",
  "description": "All cooking spices"
}
```

#### Update Category
```http
PUT /inventory/categories/:id
Authorization: Bearer <token>
```

#### Delete Category
```http
DELETE /inventory/categories/:id
Authorization: Bearer <token>
```

### Inventory Items

#### List Items
```http
GET /inventory/items?category_id=1&low_stock=true
Authorization: Bearer <token>
```

#### Get Low Stock Items
```http
GET /inventory/items/low-stock
Authorization: Bearer <token>
```

#### Get Item by ID
```http
GET /inventory/items/:id
Authorization: Bearer <token>
```

#### Create Item
```http
POST /inventory/items
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "category_id": 1,
  "supplier_id": 1,
  "name": "Turmeric Powder",
  "unit": "kg",
  "quantity": 50,
  "min_threshold": 10,
  "cost_per_unit": 250,
  "storage_location": "Shelf A1"
}
```

#### Update Item
```http
PUT /inventory/items/:id
Authorization: Bearer <token>
```

#### Delete Item
```http
DELETE /inventory/items/:id
Authorization: Bearer <token>
```

### Transactions

#### List Transactions
```http
GET /inventory/transactions?item_id=1&type=purchase
Authorization: Bearer <token>
```

#### Create Transaction
```http
POST /inventory/transactions
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "inventory_item_id": 1,
  "transaction_type": "purchase",
  "quantity": 20,
  "unit_cost": 250,
  "notes": "Purchased from Spice Traders"
}
```

### Stock Value

#### Get Total Stock Value
```http
GET /inventory/stock-value
Authorization: Bearer <token>
```

### Suppliers

#### List Suppliers
```http
GET /inventory/suppliers
Authorization: Bearer <token>
```

#### Create Supplier
```http
POST /inventory/suppliers
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Spice Traders Ltd",
  "contact_person": "Rajesh Kumar",
  "phone": "+91-98765-43210",
  "email": "rajesh@spicetraders.com",
  "address": "123 Market Street",
  "gst_number": "GST123456"
}
```

#### Update Supplier
```http
PUT /inventory/suppliers/:id
Authorization: Bearer <token>
```

#### Delete Supplier
```http
DELETE /inventory/suppliers/:id
Authorization: Bearer <token>
```

---

## Invoices API

### List Invoices
```http
GET /invoices?page=1&limit=20&status=overdue&customer_id=1
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - draft, sent, paid, overdue, cancelled, refunded
- `customer_id` - Filter by customer
- `overdue` - true/false to filter overdue invoices
- `start_date`, `end_date` - Date range

### Get Invoice by ID
```http
GET /invoices/:id
Authorization: Bearer <token>
```

### Create Invoice
```http
POST /invoices
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "event_id": 1,
  "invoice_date": "2024-06-01",
  "due_date": "2024-06-15",
  "notes": "50% advance received",
  "items": [
    {
      "description": "Wedding Catering - 500 guests",
      "quantity": 500,
      "unit_price": 1500
    }
  ],
  "discount_amount": 0,
  "tax_rate": 18
}
```

### Update Invoice
```http
PUT /invoices/:id
Authorization: Bearer <token>
```

### Delete Invoice
```http
DELETE /invoices/:id
Authorization: Bearer <token>
```

### Download PDF
```http
GET /invoices/:id/pdf
Authorization: Bearer <token>
```

### Get Invoice Statistics
```http
GET /invoices/stats
Authorization: Bearer <token>
```

---

## Payments API

### List Payments
```http
GET /payments?invoice_id=1&customer_id=1&status=completed
Authorization: Bearer <token>
```

### Create Payment
```http
POST /payments
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "invoice_id": 1,
  "customer_id": 1,
  "event_id": 1,
  "amount": 150000,
  "payment_method": "bank_transfer",
  "payment_date": "2024-06-10",
  "reference_number": "UTR123456",
  "notes": "50% advance payment"
}
```

### Get Payment Statistics
```http
GET /payments/stats?start_date=2024-01-01&end_date=2024-12-31
Authorization: Bearer <token>
```

---

## Staff API

### List Staff
```http
GET /staff?page=1&limit=20&department=kitchen&is_full_time=true
Authorization: Bearer <token>
```

### Get Staff by ID
```http
GET /staff/:id
Authorization: Bearer <token>
```

### Create Staff
```http
POST /staff
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "email": "chef@example.com",
  "password": "TempPass123!",
  "first_name": "Vikram",
  "last_name": "Singh",
  "phone": "+91-98765-43210",
  "employee_code": "EMP001",
  "designation": "Head Chef",
  "department": "kitchen",
  "joining_date": "2024-01-15",
  "salary": 50000,
  "skills": ["Indian Cuisine", "Chinese", "Tandoor"]
}
```

### Update Staff
```http
PUT /staff/:id
Authorization: Bearer <token>
```

### Delete Staff
```http
DELETE /staff/:id
Authorization: Bearer <token>
```

### Get Staff Assignments
```http
GET /staff/:id/assignments?start_date=2024-01-01&status=confirmed
Authorization: Bearer <token>
```

### Get Staff Availability
```http
GET /staff/:id/availability?date=2024-06-15
Authorization: Bearer <token>
```

### Assign Staff to Event
```http
POST /staff/assign
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "staff_id": 1,
  "event_id": 1,
  "role_at_event": "Head Chef",
  "assigned_tasks": "Menu preparation, Quality control",
  "start_time": "2024-06-15T14:00:00",
  "end_time": "2024-06-15T23:00:00"
}
```

### Update Assignment
```http
PUT /staff/assignments/:assignmentId
Authorization: Bearer <token>
```

### Remove Assignment
```http
DELETE /staff/assignments/:assignmentId
Authorization: Bearer <token>
```

### Get Event Staff
```http
GET /events/:eventId/staff
Authorization: Bearer <token>
```

---

## Dashboard API

### Get Dashboard Stats
```http
GET /dashboard/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalEvents": 150,
      "upcomingEvents": 12,
      "totalCustomers": 45,
      "monthlyRevenue": 250000
    },
    "upcomingEvents": [...],
    "lowStockAlerts": [...],
    "recentPayments": [...],
    "monthlyRevenue": [...],
    "eventTypes": [...]
  }
}
```

### Get Calendar Events
```http
GET /dashboard/calendar?start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer <token>
```

### Get Notifications
```http
GET /dashboard/notifications
Authorization: Bearer <token>
```

### Get Activity Log
```http
GET /dashboard/activity?limit=20
Authorization: Bearer <token>
```

### Get Revenue Analytics
```http
GET /dashboard/revenue-analytics?period=monthly&months=12
Authorization: Bearer <token>
```

---

## Subscription API

### Get Current Subscription
```http
GET /subscription
Authorization: Bearer <token>
```

### Get Available Plans
```http
GET /subscription/plans
Authorization: Bearer <token>
```

### Get Usage Statistics
```http
GET /subscription/usage
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "events": {
      "current": 15,
      "limit": 50,
      "remaining": 35
    },
    "staff": {
      "current": 8,
      "limit": 20,
      "remaining": 12
    }
  }
}
```

### Upgrade Subscription
```http
POST /subscription/upgrade
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "plan_id": 2,
  "billing_cycle": "monthly",
  "payment_method": "stripe"
}
```

### Cancel Subscription
```http
POST /subscription/cancel
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "reason": "Switching to different platform"
}
```

---

## Super Admin API

### Get Platform Stats
```http
GET /admin/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_tenants": 150,
    "active_subscriptions": 120,
    "monthly_revenue": 50000,
    "total_revenue": 500000
  }
}
```

### List All Tenants
```http
GET /admin/tenants?page=1&limit=20&is_active=true
Authorization: Bearer <token>
```

### Get Tenant Details
```http
GET /admin/tenants/:id
Authorization: Bearer <token>
```

### Update Tenant
```http
PUT /admin/tenants/:id
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "is_active": false,
  "is_suspended": true,
  "suspension_reason": "Payment overdue"
}
```

### Delete Tenant
```http
DELETE /admin/tenants/:id
Authorization: Bearer <token>
```

### List Subscription Plans
```http
GET /admin/plans
Authorization: Bearer <token>
```

### Create Plan
```http
POST /admin/plans
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Enterprise",
  "description": "For large catering businesses",
  "price_monthly": 4999,
  "price_yearly": 49990,
  "max_events_per_month": 200,
  "max_staff": 100,
  "features": ["Unlimited events", "Priority support"]
}
```

### Update Plan
```http
PUT /admin/plans/:id
Authorization: Bearer <token>
```

### Get Subscription Invoices
```http
GET /admin/subscription-invoices?tenant_id=1&status=paid
Authorization: Bearer <token>
```

### Impersonate Tenant
```http
POST /admin/impersonate
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "tenant_id": 1
}
```

---

## Webhooks

### Stripe Webhook
```http
POST /webhooks/stripe
Content-Type: application/json
Stripe-Signature: <signature>
```

Handles Stripe events:
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### Razorpay Payment Verification
```http
POST /webhooks/razorpay/verify
```

**Request Body:**
```json
{
  "razorpay_order_id": "order_...",
  "razorpay_payment_id": "pay_...",
  "razorpay_signature": "..."
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "errors": [
    { "field": "email", "message": "Email is required" }
  ]
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

### Error Codes
- `STAFF_LIMIT_REACHED` - Subscription staff limit reached
- `EVENT_LIMIT_REACHED` - Subscription event limit reached
- `UNAUTHORIZED` - Invalid or expired token
- `FORBIDDEN` - Insufficient role permissions

---

## Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

**Response Format:**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

## Rate Limiting

- General API: 100 requests per 15 minutes
- Authentication: 10 requests per 15 minutes
- Sensitive operations: 5 requests per 15 minutes

Rate limit headers included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699999999
```
