const express = require('express');
const { authenticate, superAdminOnly, tenantAdminOrHigher, managerOrHigher } = require('../middleware/auth');
const { tenantIsolation, checkSubscriptionLimits } = require('../middleware/tenant');
const { paginationValidation, idParamValidation } = require('../middleware/validation');

const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const customerController = require('../controllers/customerController');
const eventController = require('../controllers/eventController');
const menuController = require('../controllers/menuController');
const inventoryController = require('../controllers/inventoryController');
const invoiceController = require('../controllers/invoiceController');
const dashboardController = require('../controllers/dashboardController');
const superAdminController = require('../controllers/superAdminController');
const staffController = require('../controllers/staffController');
const subscriptionController = require('../controllers/subscriptionController');

const router = express.Router();

// ==================== AUTH ROUTES (Public) ====================

router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authController.refreshToken);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);

// ==================== AUTH ROUTES (Protected) ====================

router.get('/auth/me', authenticate, authController.me);
router.post('/auth/logout', authenticate, authController.logout);
router.post('/auth/change-password', authenticate, authController.changePassword);

// ==================== USER ROUTES ====================

router.get('/users', authenticate, tenantIsolation, managerOrHigher, paginationValidation, userController.getAll);
router.get('/users/:id', authenticate, tenantIsolation, idParamValidation, userController.getById);
router.post('/users', authenticate, tenantIsolation, tenantAdminOrHigher, userController.create);
router.put('/users/:id', authenticate, tenantIsolation, tenantAdminOrHigher, userController.update);
router.delete('/users/:id', authenticate, tenantIsolation, tenantAdminOrHigher, userController.delete);
router.post('/users/:id/reset-password', authenticate, tenantIsolation, tenantAdminOrHigher, userController.resetPassword);

// Profile routes
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);

// ==================== CUSTOMER ROUTES ====================

router.get('/customers', authenticate, tenantIsolation, paginationValidation, customerController.getAll);
router.get('/customers/search', authenticate, tenantIsolation, customerController.search);
router.get('/customers/:id', authenticate, tenantIsolation, idParamValidation, customerController.getById);
router.post('/customers', authenticate, tenantIsolation, customerController.create);
router.put('/customers/:id', authenticate, tenantIsolation, idParamValidation, customerController.update);
router.delete('/customers/:id', authenticate, tenantIsolation, idParamValidation, customerController.delete);
router.get('/customers/:id/events', authenticate, tenantIsolation, idParamValidation, customerController.getEventHistory);

// ==================== EVENT ROUTES ====================

router.get('/events', authenticate, tenantIsolation, paginationValidation, eventController.getAll);
router.get('/events/calendar', authenticate, tenantIsolation, eventController.getByDateRange);
router.get('/events/stats', authenticate, tenantIsolation, eventController.getStats);
router.get('/events/:id', authenticate, tenantIsolation, idParamValidation, eventController.getById);
router.post('/events', authenticate, tenantIsolation, checkSubscriptionLimits('events'), eventController.create);
router.put('/events/:id', authenticate, tenantIsolation, idParamValidation, eventController.update);
router.delete('/events/:id', authenticate, tenantIsolation, idParamValidation, eventController.delete);
router.patch('/events/:id/status', authenticate, tenantIsolation, idParamValidation, eventController.updateStatus);

// ==================== MENU ROUTES ====================

// Categories
router.get('/menu/categories', authenticate, tenantIsolation, menuController.getCategories);
router.post('/menu/categories', authenticate, tenantIsolation, tenantAdminOrHigher, menuController.createCategory);
router.put('/menu/categories/:id', authenticate, tenantIsolation, tenantAdminOrHigher, menuController.updateCategory);
router.delete('/menu/categories/:id', authenticate, tenantIsolation, tenantAdminOrHigher, menuController.deleteCategory);

// Items
router.get('/menu/items', authenticate, tenantIsolation, menuController.getItems);
router.get('/menu/items/:id', authenticate, tenantIsolation, menuController.getItemById);
router.post('/menu/items', authenticate, tenantIsolation, tenantAdminOrHigher, menuController.createItem);
router.put('/menu/items/:id', authenticate, tenantIsolation, tenantAdminOrHigher, menuController.updateItem);
router.delete('/menu/items/:id', authenticate, tenantIsolation, tenantAdminOrHigher, menuController.deleteItem);

// Packages
router.get('/menu/packages', authenticate, tenantIsolation, menuController.getPackages);
router.get('/menu/packages/:id', authenticate, tenantIsolation, menuController.getPackageById);
router.post('/menu/packages', authenticate, tenantIsolation, tenantAdminOrHigher, menuController.createPackage);
router.put('/menu/packages/:id', authenticate, tenantIsolation, tenantAdminOrHigher, menuController.updatePackage);
router.delete('/menu/packages/:id', authenticate, tenantIsolation, tenantAdminOrHigher, menuController.deletePackage);

// ==================== INVENTORY ROUTES ====================

// Categories
router.get('/inventory/categories', authenticate, tenantIsolation, inventoryController.getCategories);
router.post('/inventory/categories', authenticate, tenantIsolation, managerOrHigher, inventoryController.createCategory);
router.put('/inventory/categories/:id', authenticate, tenantIsolation, managerOrHigher, inventoryController.updateCategory);
router.delete('/inventory/categories/:id', authenticate, tenantIsolation, managerOrHigher, inventoryController.deleteCategory);

// Items
router.get('/inventory/items', authenticate, tenantIsolation, inventoryController.getItems);
router.get('/inventory/items/low-stock', authenticate, tenantIsolation, inventoryController.getLowStock);
router.get('/inventory/items/:id', authenticate, tenantIsolation, inventoryController.getItemById);
router.post('/inventory/items', authenticate, tenantIsolation, managerOrHigher, inventoryController.createItem);
router.put('/inventory/items/:id', authenticate, tenantIsolation, managerOrHigher, inventoryController.updateItem);
router.delete('/inventory/items/:id', authenticate, tenantIsolation, managerOrHigher, inventoryController.deleteItem);

// Stock value
router.get('/inventory/stock-value', authenticate, tenantIsolation, inventoryController.getStockValue);

// Transactions
router.get('/inventory/transactions', authenticate, tenantIsolation, inventoryController.getTransactions);
router.post('/inventory/transactions', authenticate, tenantIsolation, managerOrHigher, inventoryController.createTransaction);

// Suppliers
router.get('/inventory/suppliers', authenticate, tenantIsolation, inventoryController.getSuppliers);
router.post('/inventory/suppliers', authenticate, tenantIsolation, managerOrHigher, inventoryController.createSupplier);
router.put('/inventory/suppliers/:id', authenticate, tenantIsolation, managerOrHigher, inventoryController.updateSupplier);
router.delete('/inventory/suppliers/:id', authenticate, tenantIsolation, managerOrHigher, inventoryController.deleteSupplier);

// ==================== INVOICE ROUTES ====================

router.get('/invoices', authenticate, tenantIsolation, paginationValidation, invoiceController.getAll);
router.get('/invoices/stats', authenticate, tenantIsolation, invoiceController.getStats);
router.get('/invoices/:id', authenticate, tenantIsolation, idParamValidation, invoiceController.getById);
router.get('/invoices/:id/pdf', authenticate, tenantIsolation, idParamValidation, invoiceController.downloadPDF);
router.post('/invoices', authenticate, tenantIsolation, managerOrHigher, invoiceController.create);
router.put('/invoices/:id', authenticate, tenantIsolation, idParamValidation, invoiceController.update);
router.delete('/invoices/:id', authenticate, tenantIsolation, idParamValidation, invoiceController.delete);

// Payments
router.get('/payments', authenticate, tenantIsolation, invoiceController.getPayments);
router.get('/payments/stats', authenticate, tenantIsolation, invoiceController.getPaymentStats);
router.post('/payments', authenticate, tenantIsolation, managerOrHigher, invoiceController.createPayment);

// ==================== DASHBOARD ROUTES ====================

router.get('/dashboard/stats', authenticate, tenantIsolation, dashboardController.getStats);
router.get('/dashboard/calendar', authenticate, tenantIsolation, dashboardController.getCalendarEvents);
router.get('/dashboard/notifications', authenticate, tenantIsolation, dashboardController.getNotifications);
router.get('/dashboard/activity', authenticate, tenantIsolation, dashboardController.getActivity);
router.get('/dashboard/revenue-analytics', authenticate, tenantIsolation, dashboardController.getRevenueAnalytics);

// ==================== SUBSCRIPTION ROUTES ====================

router.get('/subscription', authenticate, tenantIsolation, subscriptionController.getCurrentSubscription);
router.get('/subscription/plans', authenticate, subscriptionController.getPlans);
router.get('/subscription/usage', authenticate, tenantIsolation, subscriptionController.getUsage);
router.post('/subscription/upgrade', authenticate, tenantIsolation, tenantAdminOrHigher, subscriptionController.upgrade);
router.post('/subscription/cancel', authenticate, tenantIsolation, tenantAdminOrHigher, subscriptionController.cancel);

// ==================== STAFF ROUTES ====================

router.get('/staff', authenticate, tenantIsolation, managerOrHigher, staffController.getAll);
router.get('/staff/:id', authenticate, tenantIsolation, managerOrHigher, staffController.getById);
router.post('/staff', authenticate, tenantIsolation, tenantAdminOrHigher, checkSubscriptionLimits('staff'), staffController.create);
router.put('/staff/:id', authenticate, tenantIsolation, tenantAdminOrHigher, staffController.update);
router.delete('/staff/:id', authenticate, tenantIsolation, tenantAdminOrHigher, staffController.delete);
router.get('/staff/:id/assignments', authenticate, tenantIsolation, staffController.getAssignments);
router.get('/staff/:id/availability', authenticate, tenantIsolation, staffController.getAvailability);
router.post('/staff/assign', authenticate, tenantIsolation, managerOrHigher, staffController.assignToEvent);
router.put('/staff/assignments/:assignmentId', authenticate, tenantIsolation, managerOrHigher, staffController.updateAssignment);
router.delete('/staff/assignments/:assignmentId', authenticate, tenantIsolation, managerOrHigher, staffController.removeAssignment);
router.get('/events/:eventId/staff', authenticate, tenantIsolation, staffController.getEventStaff);

// ==================== SUPER ADMIN ROUTES ====================

router.get('/admin/stats', authenticate, superAdminOnly, superAdminController.getPlatformStats);
router.get('/admin/tenants', authenticate, superAdminOnly, superAdminController.getTenants);
router.get('/admin/tenants/:id', authenticate, superAdminOnly, superAdminController.getTenantById);
router.put('/admin/tenants/:id', authenticate, superAdminOnly, superAdminController.updateTenant);
router.delete('/admin/tenants/:id', authenticate, superAdminOnly, superAdminController.deleteTenant);

// Super Admin - Plans
router.get('/admin/plans', authenticate, superAdminOnly, superAdminController.getPlans);
router.post('/admin/plans', authenticate, superAdminOnly, superAdminController.createPlan);
router.put('/admin/plans/:id', authenticate, superAdminOnly, superAdminController.updatePlan);

// Super Admin - Billing
router.get('/admin/subscription-invoices', authenticate, superAdminOnly, superAdminController.getSubscriptionInvoices);

// Impersonation
router.post('/admin/impersonate', authenticate, superAdminOnly, superAdminController.impersonate);

// ==================== WEBHOOK ROUTES ====================

router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), subscriptionController.stripeWebhook);
router.post('/webhooks/razorpay/verify', subscriptionController.verifyRazorpayPayment);

module.exports = router;
