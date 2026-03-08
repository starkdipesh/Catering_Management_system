const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// Auth validations
const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

const registerValidation = [
  body('business_name').trim().notEmpty().withMessage('Business name is required'),
  body('owner_name').trim().notEmpty().withMessage('Owner name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  handleValidationErrors,
];

const createUserValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required'),
  body('role').isIn(['tenant_admin', 'manager', 'staff']).withMessage('Invalid role'),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  handleValidationErrors,
];

// Customer validations
const customerValidation = [
  body('first_name').trim().notEmpty().withMessage('First name is required'),
  body('last_name').trim().notEmpty().withMessage('Last name is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('customer_type').optional().isIn(['individual', 'corporate']).withMessage('Invalid customer type'),
  handleValidationErrors,
];

// Event validations
const eventValidation = [
  body('customer_id').isInt().withMessage('Valid customer ID is required'),
  body('event_name').trim().notEmpty().withMessage('Event name is required'),
  body('event_type').optional().isIn(['wedding', 'birthday', 'corporate', 'private_party', 'festival', 'other']),
  body('event_date').isDate().withMessage('Valid event date is required'),
  body('guest_count').isInt({ min: 1 }).withMessage('Guest count must be at least 1'),
  body('venue_name').optional().trim(),
  body('city').optional().trim(),
  handleValidationErrors,
];

// Menu validations
const menuItemValidation = [
  body('category_id').isInt().withMessage('Category is required'),
  body('name').trim().notEmpty().withMessage('Item name is required'),
  body('price_per_plate').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  handleValidationErrors,
];

const menuCategoryValidation = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  handleValidationErrors,
];

// Inventory validations
const inventoryItemValidation = [
  body('name').trim().notEmpty().withMessage('Item name is required'),
  body('unit').trim().notEmpty().withMessage('Unit is required'),
  body('quantity').optional().isFloat({ min: 0 }),
  body('min_threshold').optional().isFloat({ min: 0 }),
  handleValidationErrors,
];

const inventoryTransactionValidation = [
  body('inventory_item_id').isInt().withMessage('Inventory item is required'),
  body('transaction_type').isIn(['purchase', 'consumption', 'adjustment', 'wastage', 'return', 'transfer']),
  body('quantity').isFloat().withMessage('Valid quantity is required'),
  handleValidationErrors,
];

// Invoice validations
const invoiceValidation = [
  body('event_id').isInt().withMessage('Event is required'),
  body('customer_id').isInt().withMessage('Customer is required'),
  body('invoice_date').isDate().withMessage('Invoice date is required'),
  body('due_date').optional().isDate(),
  body('subtotal').isFloat({ min: 0 }).withMessage('Subtotal is required'),
  body('total_amount').isFloat({ min: 0 }).withMessage('Total amount is required'),
  body('items').optional().isArray(),
  handleValidationErrors,
];

const paymentValidation = [
  body('customer_id').isInt().withMessage('Customer is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
  body('payment_method').isIn(['cash', 'card', 'bank_transfer', 'upi', 'cheque', 'online', 'other']),
  body('payment_date').isDate().withMessage('Payment date is required'),
  handleValidationErrors,
];

// Common pagination validation
const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];

// ID parameter validation
const idParamValidation = [
  param('id').isInt().withMessage('Invalid ID format'),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  loginValidation,
  registerValidation,
  createUserValidation,
  customerValidation,
  eventValidation,
  menuItemValidation,
  menuCategoryValidation,
  inventoryItemValidation,
  inventoryTransactionValidation,
  invoiceValidation,
  paymentValidation,
  paginationValidation,
  idParamValidation,
};
