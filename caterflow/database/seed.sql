-- CaterFlow - Seed Data
-- Run this after creating the schema

USE caterflow;

-- ============================================
-- SUBSCRIPTION PLANS
-- ============================================

INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, max_events_per_month, max_staff, features) VALUES
('Free', 'Perfect for small catering businesses just starting out', 0, 0, 5, 3, '["basic_dashboard", "customer_management", "event_management", "basic_menu", "email_support"]'),
('Pro', 'For growing catering businesses with more events', 49, 490, NULL, 20, '["unlimited_events", "staff_management", "inventory_system", "basic_reports", "invoice_generation", "priority_email_support"]'),
('Business', 'Advanced features for established catering companies', 99, 990, NULL, NULL, '["unlimited_events", "unlimited_staff", "advanced_analytics", "inventory_alerts", "custom_branding", "api_access", "priority_phone_support", "dedicated_account_manager"]');

-- ============================================
-- SUPER ADMIN
-- ============================================

-- Password: SuperAdmin123! (bcrypt hashed)
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, email_verified) VALUES
('admin@caterflow.com', '$2b$10$YourHashedPasswordHere', 'Super', 'Admin', 'super_admin', TRUE, TRUE);

-- ============================================
-- SAMPLE TENANTS
-- ============================================

INSERT INTO tenants (tenant_id, business_name, owner_name, email, phone, address, subscription_plan_id, subscription_status, subscription_start_date, billing_cycle, is_active, is_trial) VALUES
('royal-wedding-catering', 'Royal Wedding Catering', 'Rajesh Sharma', 'rajesh@royalcatering.com', '+91-98765-43210', '123 Wedding Lane, Mumbai, Maharashtra 400001', 3, 'active', '2024-01-01', 'yearly', TRUE, FALSE),
('urban-events-catering', 'Urban Events Catering', 'Priya Patel', 'priya@urbanevents.com', '+91-98765-43211', '456 Event Plaza, Delhi, 110001', 2, 'active', '2024-02-15', 'monthly', TRUE, FALSE),
('food-fiesta-catering', 'Food Fiesta Catering', 'Amit Kumar', 'amit@foodfiesta.com', '+91-98765-43212', '789 Food Street, Bangalore, 560001', 1, 'active', '2024-03-01', 'monthly', TRUE, FALSE);

-- ============================================
-- TENANT ADMIN USERS
-- ============================================

-- Password: Admin123! (bcrypt hashed)
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active, email_verified) VALUES
(1, 'rajesh@royalcatering.com', '$2b$10$YourHashedPasswordHere', 'Rajesh', 'Sharma', '+91-98765-43210', 'tenant_admin', TRUE, TRUE),
(2, 'priya@urbanevents.com', '$2b$10$YourHashedPasswordHere', 'Priya', 'Patel', '+91-98765-43211', 'tenant_admin', TRUE, TRUE),
(3, 'amit@foodfiesta.com', '$2b$10$YourHashedPasswordHere', 'Amit', 'Kumar', '+91-98765-43212', 'tenant_admin', TRUE, TRUE);

-- ============================================
-- MANAGER USERS
-- ============================================

INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active) VALUES
(1, 'manager1@royalcatering.com', '$2b$10$YourHashedPasswordHere', 'Vikram', 'Singh', '+91-98765-43213', 'manager', TRUE),
(2, 'manager1@urbanevents.com', '$2b$10$YourHashedPasswordHere', 'Neha', 'Gupta', '+91-98765-43214', 'manager', TRUE),
(3, 'manager1@foodfiesta.com', '$2b$10$YourHashedPasswordHere', 'Rahul', 'Mehta', '+91-98765-43215', 'manager', TRUE);

-- ============================================
-- STAFF USERS
-- ============================================

INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active) VALUES
(1, 'chef1@royalcatering.com', '$2b$10$YourHashedPasswordHere', 'Sanjay', 'Kumar', '+91-98765-43216', 'staff', TRUE),
(1, 'server1@royalcatering.com', '$2b$10$YourHashedPasswordHere', 'Anita', 'Devi', '+91-98765-43217', 'staff', TRUE),
(2, 'chef1@urbanevents.com', '$2b$10$YourHashedPasswordHere', 'Ramesh', 'Yadav', '+91-98765-43218', 'staff', TRUE),
(2, 'helper1@urbanevents.com', '$2b$10$YourHashedPasswordHere', 'Sunita', 'Sharma', '+91-98765-43219', 'staff', TRUE),
(3, 'chef1@foodfiesta.com', '$2b$10$YourHashedPasswordHere', 'Deepak', 'Patel', '+91-98765-43220', 'staff', TRUE);

-- ============================================
-- STAFF DETAILS
-- ============================================

INSERT INTO staff_details (user_id, tenant_id, employee_code, designation, department, joining_date, salary, skills) VALUES
(5, 1, 'RC001', 'Head Chef', 'kitchen', '2023-01-15', 50000, '["Indian Cuisine", "Chinese Cuisine", "Plating", "Menu Planning"]'),
(6, 1, 'RC002', 'Senior Server', 'service', '2023-03-01', 25000, '["Customer Service", "Table Setting", "Event Coordination"]'),
(7, 2, 'UE001', 'Executive Chef', 'kitchen', '2023-06-01', 45000, '["Continental", "Italian", "Desserts", "Catering"]'),
(8, 2, 'UE002', 'Kitchen Helper', 'kitchen', '2023-08-15', 18000, '["Prep Work", "Cleaning", "Inventory"]'),
(9, 3, 'FF001', 'Chef', 'kitchen', '2024-01-01', 35000, '["North Indian", "Snacks", "Chaat"]');

-- ============================================
-- CUSTOMERS
-- ============================================

INSERT INTO customers (tenant_id, first_name, last_name, email, phone, address_line1, city, customer_type, company_name, notes) VALUES
(1, 'Suresh', 'Kumar', 'suresh@example.com', '+91-99999-11111', '45 Park Street', 'Mumbai', 'individual', NULL, 'VIP customer, prefers North Indian cuisine'),
(1, 'Meera', 'Patel', 'meera@example.com', '+91-99999-22222', '78 Marine Drive', 'Mumbai', 'individual', NULL, 'Wedding events, budget conscious'),
(2, 'TechCorp', 'India', 'events@techcorp.com', '+91-99999-33333', 'IT Park, Sector 62', 'Delhi', 'corporate', 'TechCorp India Pvt Ltd', 'Corporate events, quarterly celebrations'),
(2, 'Priya', 'Sharma', 'priya.s@example.com', '+91-99999-44444', '12 Connaught Place', 'Delhi', 'individual', NULL, 'Birthday parties, prefers continental'),
(3, 'Rohan', 'Gupta', 'rohan@example.com', '+91-99999-55555', '89 MG Road', 'Bangalore', 'individual', NULL, 'Small family events'),
(3, 'Global', 'Solutions', 'contact@globalsol.com', '+91-99999-66666', 'Electronic City', 'Bangalore', 'corporate', 'Global Solutions Ltd', 'Monthly team lunches');

-- ============================================
-- MENU CATEGORIES
-- ============================================

INSERT INTO menu_categories (tenant_id, name, description, display_order) VALUES
(1, 'Starters', 'Appetizers and small bites', 1),
(1, 'Main Course', 'Primary dishes and curries', 2),
(1, 'Desserts', 'Sweet treats and desserts', 3),
(1, 'Beverages', 'Drinks and refreshments', 4),
(2, 'Starters', 'Appetizers and small bites', 1),
(2, 'Main Course', 'Primary dishes and curries', 2),
(2, 'Desserts', 'Sweet treats and desserts', 3),
(2, 'Beverages', 'Drinks and refreshments', 4),
(3, 'Starters', 'Appetizers and small bites', 1),
(3, 'Main Course', 'Primary dishes and curries', 2),
(3, 'Desserts', 'Sweet treats and desserts', 3);

-- ============================================
-- MENU ITEMS
-- ============================================

INSERT INTO menu_items (tenant_id, category_id, name, description, price_per_plate, ingredients, is_vegetarian, is_active) VALUES
(1, 1, 'Paneer Tikka', 'Marinated cottage cheese grilled to perfection', 180, 'Paneer, Yogurt, Spices', TRUE, TRUE),
(1, 1, 'Chicken Seekh Kebab', 'Minced chicken with spices, grilled on skewers', 220, 'Chicken, Spices, Herbs', FALSE, TRUE),
(1, 2, 'Butter Chicken', 'Creamy tomato-based curry with tender chicken', 280, 'Chicken, Tomato, Cream, Spices', FALSE, TRUE),
(1, 2, 'Dal Makhani', 'Creamy black lentils slow-cooked overnight', 150, 'Black Lentils, Cream, Butter, Spices', TRUE, TRUE),
(1, 3, 'Gulab Jamun', 'Deep-fried milk solids soaked in sugar syrup', 80, 'Milk Powder, Sugar, Cardamom', TRUE, TRUE),
(1, 4, 'Mango Lassi', 'Refreshing yogurt-based mango drink', 60, 'Yogurt, Mango, Sugar', TRUE, TRUE),

(2, 5, 'Spring Rolls', 'Crispy vegetable rolls with sweet chili sauce', 120, 'Vegetables, Wrapper, Sweet Chili', TRUE, TRUE),
(2, 5, 'Fish Fingers', 'Battered fish strips with tartar sauce', 200, 'Fish, Breadcrumbs, Tartar Sauce', FALSE, TRUE),
(2, 6, 'Chicken Biryani', 'Fragrant rice with spiced chicken', 250, 'Rice, Chicken, Spices, Saffron', FALSE, TRUE),
(2, 6, 'Vegetable Biryani', 'Aromatic rice with mixed vegetables', 180, 'Rice, Mixed Vegetables, Spices', TRUE, TRUE),
(2, 7, 'Chocolate Mousse', 'Rich and creamy chocolate dessert', 150, 'Chocolate, Cream, Sugar', TRUE, TRUE),
(2, 8, 'Fresh Lime Soda', 'Refreshing lime-based beverage', 50, 'Lime, Soda, Sugar', TRUE, TRUE),

(3, 9, 'Samosa', 'Crispy pastry filled with spiced potatoes', 40, 'Flour, Potatoes, Peas, Spices', TRUE, TRUE),
(3, 9, 'Aloo Tikki', 'Spiced potato patties with chutneys', 60, 'Potatoes, Spices, Chutney', TRUE, TRUE),
(3, 10, 'Chole Bhature', 'Spiced chickpeas with fried bread', 120, 'Chickpeas, Flour, Spices', TRUE, TRUE),
(3, 10, 'Rajma Chawal', 'Red kidney beans curry with rice', 100, 'Kidney Beans, Rice, Spices', TRUE, TRUE),
(3, 11, 'Rasmalai', 'Soft cheese patties in saffron milk', 90, 'Milk, Saffron, Sugar, Cardamom', TRUE, TRUE);

-- ============================================
-- MENU PACKAGES
-- ============================================

INSERT INTO menu_packages (tenant_id, name, description, package_type, base_price_per_plate, min_guests) VALUES
(1, 'Royal Wedding Package', 'Complete wedding menu with starters, mains, and desserts', 'standard', 650, 100),
(1, 'Corporate Lunch Package', 'Professional lunch menu for business events', 'standard', 450, 20),
(2, 'Birthday Celebration', 'Fun menu perfect for birthday parties', 'standard', 350, 30),
(2, 'Corporate Gala Dinner', 'Premium menu for corporate events', 'standard', 800, 50),
(3, 'Basic Party Menu', 'Economical menu for small gatherings', 'standard', 250, 15);

-- ============================================
-- INVENTORY CATEGORIES
-- ============================================

INSERT INTO inventory_categories (tenant_id, name) VALUES
(1, 'Dairy Products'),
(1, 'Meat & Poultry'),
(1, 'Vegetables'),
(1, 'Spices'),
(1, 'Beverages'),
(2, 'Dairy Products'),
(2, 'Meat & Poultry'),
(2, 'Vegetables'),
(2, 'Spices'),
(2, 'Beverages'),
(3, 'Dairy Products'),
(3, 'Vegetables'),
(3, 'Spices');

-- ============================================
-- SUPPLIERS
-- ============================================

INSERT INTO suppliers (tenant_id, name, contact_person, phone, email, address, categories) VALUES
(1, 'Fresh Dairy Suppliers', 'Mr. Sharma', '+91-98765-99999', 'orders@freshdairy.com', 'Dairy Market, Mumbai', '["Dairy Products"]'),
(1, 'Premium Meats', 'Mr. Khan', '+91-98765-88888', 'orders@premiummeats.com', 'Meat Market, Mumbai', '["Meat & Poultry"]'),
(2, 'Delhi Fresh Foods', 'Ms. Gupta', '+91-98765-77777', 'orders@delhifresh.com', 'Azadpur Mandi, Delhi', '["Vegetables", "Dairy Products"]'),
(3, 'Bangalore Ingredients', 'Mr. Reddy', '+91-98765-66666', 'orders@bangingredients.com', 'KR Market, Bangalore', '["Vegetables", "Spices"]');

-- ============================================
-- INVENTORY ITEMS
-- ============================================

INSERT INTO inventory_items (tenant_id, category_id, supplier_id, name, unit, quantity, min_threshold, cost_per_unit, storage_location) VALUES
(1, 1, 1, 'Fresh Milk', 'liters', 50, 20, 60, 'Cold Storage 1'),
(1, 1, 1, 'Cream', 'kg', 10, 5, 400, 'Cold Storage 1'),
(1, 1, 1, 'Paneer', 'kg', 25, 10, 350, 'Cold Storage 2'),
(1, 2, 2, 'Chicken Breast', 'kg', 40, 20, 280, 'Freezer 1'),
(1, 2, 2, 'Mutton', 'kg', 15, 8, 650, 'Freezer 1'),
(1, 3, NULL, 'Tomatoes', 'kg', 30, 15, 40, 'Dry Storage'),
(1, 3, NULL, 'Onions', 'kg', 50, 25, 30, 'Dry Storage'),
(1, 4, NULL, 'Turmeric Powder', 'kg', 5, 2, 200, 'Spice Rack'),
(1, 4, NULL, 'Garam Masala', 'kg', 3, 1, 450, 'Spice Rack');

-- ============================================
-- EVENTS
-- ============================================

INSERT INTO events (tenant_id, customer_id, event_name, event_type, event_date, event_time, venue_name, venue_address, city, guest_count, price_per_plate, total_amount, status, payment_status, assigned_manager_id, notes) VALUES
(1, 1, 'Kumar Family Wedding', 'wedding', '2024-12-15', '19:00:00', 'Grand Palace Hotel', '123 Palace Road', 'Mumbai', 500, 650, 325000, 'confirmed', 'partial', 4, 'Full wedding reception, need special vegetarian section'),
(1, 2, 'Patel Anniversary Celebration', 'birthday', '2024-11-20', '18:30:00', 'Seaview Banquet', 'Marine Drive', 'Mumbai', 100, 450, 45000, 'confirmed', 'paid', 4, 'Golden anniversary, needs special decorations'),
(2, 3, 'TechCorp Q4 Celebration', 'corporate', '2024-12-10', '18:00:00', 'TechCorp Auditorium', 'IT Park, Sector 62', 'Delhi', 200, 500, 100000, 'confirmed', 'pending', 5, 'Year-end party, need vegetarian options'),
(2, 4, 'Priya Birthday Party', 'birthday', '2024-11-25', '17:00:00', 'Her Residence', 'Connaught Place', 'Delhi', 50, 350, 17500, 'inquiry', 'pending', 5, 'Small family gathering'),
(3, 5, 'Gupta Family Function', 'private_party', '2024-11-30', '13:00:00', 'Community Hall', 'MG Road', 'Bangalore', 80, 250, 20000, 'confirmed', 'paid', 6, 'Sunday afternoon lunch event');

-- ============================================
-- STAFF ASSIGNMENTS
-- ============================================

INSERT INTO staff_assignments (event_id, staff_id, tenant_id, role_at_event, assigned_tasks, start_time, end_time, status) VALUES
(1, 5, 1, 'Head Chef', 'Menu planning and kitchen management', '2024-12-15 14:00:00', '2024-12-15 23:00:00', 'confirmed'),
(1, 6, 1, 'Senior Server', 'Guest service and table management', '2024-12-15 16:00:00', '2024-12-15 23:00:00', 'confirmed'),
(3, 7, 2, 'Executive Chef', 'Kitchen supervision and food quality', '2024-12-10 14:00:00', '2024-12-10 22:00:00', 'confirmed'),
(3, 8, 2, 'Kitchen Helper', 'Prep work and cleanup', '2024-12-10 13:00:00', '2024-12-10 23:00:00', 'confirmed');

-- ============================================
-- INVOICES
-- ============================================

INSERT INTO invoices (tenant_id, event_id, customer_id, invoice_number, invoice_date, due_date, subtotal, discount_amount, tax_rate, tax_amount, total_amount, amount_paid, amount_due, status) VALUES
(1, 1, 1, 'RC-2024-001', '2024-11-01', '2024-11-15', 325000, 5000, 18, 57600, 377600, 200000, 177600, 'sent'),
(1, 2, 2, 'RC-2024-002', '2024-10-20', '2024-11-05', 45000, 0, 18, 8100, 53100, 53100, 0, 'paid'),
(2, 3, 3, 'UE-2024-001', '2024-11-05', '2024-11-20', 100000, 10000, 18, 16200, 106200, 0, 106200, 'sent');

-- ============================================
-- PAYMENTS
-- ============================================

INSERT INTO payments (tenant_id, invoice_id, customer_id, event_id, amount, payment_method, payment_date, status, received_by) VALUES
(1, 2, 2, 2, 53100, 'bank_transfer', '2024-10-25', 'completed', 4),
(1, 1, 1, 1, 200000, 'upi', '2024-11-05', 'completed', 4);
