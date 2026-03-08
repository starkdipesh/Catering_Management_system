-- CaterFlow - Catering Management SaaS Platform
-- Multi-tenant Database Schema
-- MySQL 8.0+

-- ============================================
-- 1. TENANTS & SUBSCRIPTIONS
-- ============================================

CREATE TABLE subscription_plans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
    max_events_per_month INT DEFAULT NULL,
    max_staff INT DEFAULT NULL,
    features JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE tenants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(50) NOT NULL UNIQUE,
    business_name VARCHAR(200) NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    logo_url VARCHAR(500),
    website VARCHAR(255),
    
    -- Subscription fields
    subscription_plan_id INT,
    subscription_status ENUM('trial', 'active', 'past_due', 'cancelled', 'suspended') DEFAULT 'trial',
    subscription_start_date DATE,
    subscription_end_date DATE,
    billing_cycle ENUM('monthly', 'yearly') DEFAULT 'monthly',
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    
    -- Trial settings
    is_trial BOOLEAN DEFAULT TRUE,
    trial_ends_at TIMESTAMP,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_suspended BOOLEAN DEFAULT FALSE,
    suspension_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL
);

CREATE TABLE tenant_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_tenant_setting (tenant_id, setting_key)
);

-- ============================================
-- 2. USERS & AUTHENTICATION
-- ============================================

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    
    -- Role: super_admin, tenant_admin, manager, staff
    role ENUM('super_admin', 'tenant_admin', 'manager', 'staff') NOT NULL DEFAULT 'staff',
    
    -- For super_admin, tenant_id is NULL
    -- For tenant users, tenant_id is required
    
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP,
    last_login_at TIMESTAMP,
    last_login_ip VARCHAR(45),
    
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_email_per_tenant (tenant_id, email)
);

CREATE TABLE refresh_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 3. CUSTOMERS
-- ============================================

CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India',
    
    -- Customer info
    customer_type ENUM('individual', 'corporate') DEFAULT 'individual',
    company_name VARCHAR(200),
    gst_number VARCHAR(50),
    
    -- Notes and preferences
    notes TEXT,
    dietary_preferences TEXT,
    
    -- Stats
    total_events INT DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    last_event_date DATE,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- ============================================
-- 4. MENU MANAGEMENT
-- ============================================

CREATE TABLE menu_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_category_name (tenant_id, name)
);

CREATE TABLE menu_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    category_id INT NOT NULL,
    
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Pricing
    price_per_plate DECIMAL(10,2) NOT NULL,
    min_quantity INT DEFAULT 1,
    
    -- Ingredients and recipes
    ingredients TEXT,
    allergens TEXT,
    dietary_info JSON, -- vegan, vegetarian, gluten_free, etc.
    
    -- Images
    image_url VARCHAR(500),
    
    -- Status
    is_vegetarian BOOLEAN DEFAULT FALSE,
    is_vegan BOOLEAN DEFAULT FALSE,
    is_gluten_free BOOLEAN DEFAULT FALSE,
    is_spicy BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE
);

CREATE TABLE menu_packages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    
    name VARCHAR(200) NOT NULL,
    description TEXT,
    package_type ENUM('standard', 'custom') DEFAULT 'standard',
    
    -- Pricing
    base_price_per_plate DECIMAL(10,2) NOT NULL,
    min_guests INT DEFAULT 10,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE menu_package_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    package_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    quantity INT DEFAULT 1,
    FOREIGN KEY (package_id) REFERENCES menu_packages(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

-- ============================================
-- 5. EVENTS MANAGEMENT
-- ============================================

CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    customer_id INT NOT NULL,
    
    event_name VARCHAR(200) NOT NULL,
    event_type ENUM('wedding', 'birthday', 'corporate', 'private_party', 'festival', 'other') DEFAULT 'other',
    
    -- Event details
    event_date DATE NOT NULL,
    event_time TIME,
    duration_hours INT,
    
    -- Location
    venue_name VARCHAR(200),
    venue_address TEXT,
    city VARCHAR(100),
    
    -- Guest details
    guest_count INT NOT NULL,
    expected_guest_count INT,
    
    -- Menu
    menu_package_id INT,
    menu_customizations TEXT,
    dietary_requirements TEXT,
    
    -- Pricing
    price_per_plate DECIMAL(10,2),
    total_amount DECIMAL(12,2),
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    final_amount DECIMAL(12,2),
    
    -- Status
    status ENUM('inquiry', 'quoted', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'inquiry',
    payment_status ENUM('pending', 'partial', 'paid', 'refunded') DEFAULT 'pending',
    
    -- Assignment
    assigned_manager_id INT,
    notes TEXT,
    special_requests TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_package_id) REFERENCES menu_packages(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_manager_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE event_menu_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    quantity INT NOT NULL,
    custom_price DECIMAL(10,2),
    notes TEXT,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

CREATE TABLE event_timeline (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    timeline_type ENUM('setup', 'preparation', 'service', 'cleanup', 'other') DEFAULT 'other',
    title VARCHAR(200) NOT NULL,
    description TEXT,
    scheduled_time TIME NOT NULL,
    duration_minutes INT,
    assigned_staff_id INT,
    status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_staff_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- 6. STAFF MANAGEMENT
-- ============================================

CREATE TABLE staff_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    tenant_id INT NOT NULL,
    
    -- Staff specific info
    employee_code VARCHAR(50),
    designation VARCHAR(100),
    department ENUM('kitchen', 'service', 'management', 'logistics', 'other') DEFAULT 'other',
    
    -- Employment
    joining_date DATE,
    salary DECIMAL(10,2),
    payment_frequency ENUM('daily', 'weekly', 'monthly') DEFAULT 'monthly',
    
    -- Documents
    id_proof_type VARCHAR(50),
    id_proof_number VARCHAR(100),
    id_proof_url VARCHAR(500),
    
    -- Skills
    skills JSON,
    certifications JSON,
    
    -- Availability
    is_full_time BOOLEAN DEFAULT TRUE,
    available_days JSON, -- ["monday", "tuesday", ...]
    unavailable_dates JSON,
    
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_employee_code (tenant_id, employee_code)
);

CREATE TABLE staff_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_id INT NOT NULL,
    staff_id INT NOT NULL,
    tenant_id INT NOT NULL,
    
    role_at_event VARCHAR(100),
    assigned_tasks TEXT,
    
    start_time DATETIME,
    end_time DATETIME,
    
    status ENUM('assigned', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'assigned',
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- ============================================
-- 7. INVENTORY MANAGEMENT
-- ============================================

CREATE TABLE suppliers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    
    name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    gst_number VARCHAR(50),
    
    -- Supplier categories
    categories JSON,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE TABLE inventory_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_inventory_category (tenant_id, name)
);

CREATE TABLE inventory_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    category_id INT,
    supplier_id INT,
    
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Unit management
    unit VARCHAR(50) NOT NULL, -- kg, liter, pieces, grams, etc.
    quantity DECIMAL(10,3) DEFAULT 0,
    
    -- Stock levels
    min_threshold DECIMAL(10,3) DEFAULT 0,
    max_threshold DECIMAL(10,3),
    reorder_point DECIMAL(10,3),
    
    -- Pricing
    cost_per_unit DECIMAL(10,2),
    
    -- Location
    storage_location VARCHAR(100),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES inventory_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

CREATE TABLE inventory_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    inventory_item_id INT NOT NULL,
    
    transaction_type ENUM('purchase', 'consumption', 'adjustment', 'wastage', 'return', 'transfer') NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(12,2),
    
    -- Reference
    reference_type ENUM('event', 'purchase_order', 'manual', 'system') DEFAULT 'manual',
    reference_id INT,
    
    -- Details
    notes TEXT,
    performed_by INT NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 8. INVOICING & PAYMENTS
-- ============================================

CREATE TABLE invoices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    event_id INT NOT NULL,
    customer_id INT NOT NULL,
    
    -- Invoice details
    invoice_number VARCHAR(50) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    
    -- Amounts
    subtotal DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    
    -- Status
    status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded') DEFAULT 'draft',
    
    -- Payment tracking
    amount_paid DECIMAL(12,2) DEFAULT 0,
    amount_due DECIMAL(12,2),
    
    -- PDF
    pdf_url VARCHAR(500),
    
    notes TEXT,
    terms_and_conditions TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_invoice_number (tenant_id, invoice_number)
);

CREATE TABLE invoice_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_id INT NOT NULL,
    
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    invoice_id INT,
    customer_id INT NOT NULL,
    event_id INT,
    
    -- Payment details
    amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('cash', 'card', 'bank_transfer', 'upi', 'cheque', 'online', 'other') DEFAULT 'cash',
    payment_date DATE NOT NULL,
    
    -- Reference
    reference_number VARCHAR(100),
    transaction_id VARCHAR(255),
    
    -- Online payment
    payment_gateway VARCHAR(50),
    gateway_transaction_id VARCHAR(255),
    gateway_response JSON,
    
    -- Status
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    
    notes TEXT,
    received_by INT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
    FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- 9. SUBSCRIPTION BILLING
-- ============================================

CREATE TABLE subscription_invoices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT NOT NULL,
    
    invoice_number VARCHAR(50) NOT NULL,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    
    plan_id INT NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    plan_price DECIMAL(10,2) NOT NULL,
    
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    status ENUM('draft', 'pending', 'paid', 'failed', 'refunded') DEFAULT 'draft',
    
    stripe_invoice_id VARCHAR(255),
    pdf_url VARCHAR(500),
    
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE
);

-- ============================================
-- 10. AUDIT & ACTIVITY LOG
-- ============================================

CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tenant_id INT,
    user_id INT,
    
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    
    old_values JSON,
    new_values JSON,
    
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Tenant isolation indexes
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_events_tenant ON events(tenant_id);
CREATE INDEX idx_events_customer ON events(customer_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_status ON events(status);

-- Menu indexes
CREATE INDEX idx_menu_items_tenant ON menu_items(tenant_id);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_packages_tenant ON menu_packages(tenant_id);

-- Staff indexes
CREATE INDEX idx_staff_details_tenant ON staff_details(tenant_id);
CREATE INDEX idx_staff_assignments_event ON staff_assignments(event_id);
CREATE INDEX idx_staff_assignments_staff ON staff_assignments(staff_id);

-- Inventory indexes
CREATE INDEX idx_inventory_tenant ON inventory_items(tenant_id);
CREATE INDEX idx_inventory_category ON inventory_items(category_id);
CREATE INDEX idx_inventory_transactions_item ON inventory_transactions(inventory_item_id);

-- Invoice & Payment indexes
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_invoices_event ON invoices(event_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);

-- Audit log indexes
CREATE INDEX idx_activity_logs_tenant ON activity_logs(tenant_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);
