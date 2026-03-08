const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');

/**
 * Generate JWT access token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id,
    },
    config.JWT.SECRET,
    { expiresIn: config.JWT.EXPIRES_IN }
  );
};

/**
 * Generate JWT refresh token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      type: 'refresh',
    },
    config.JWT.REFRESH_SECRET,
    { expiresIn: config.JWT.REFRESH_EXPIRES_IN }
  );
};

/**
 * Generate random token for password reset
 */
const generateRandomToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Format currency
 */
const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Format date
 */
const formatDate = (date, format = 'short') => {
  const d = new Date(date);
  if (format === 'short') {
    return d.toLocaleDateString('en-IN');
  }
  if (format === 'long') {
    return d.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  if (format === 'iso') {
    return d.toISOString().split('T')[0];
  }
  return d.toLocaleDateString('en-IN');
};

/**
 * Generate unique ID
 */
const generateUniqueId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}${timestamp}${random}`.toUpperCase();
};

/**
 * Sanitize user object for response
 */
const sanitizeUser = (user) => {
  const { password_hash, ...sanitized } = user;
  return sanitized;
};

/**
 * Parse pagination params
 */
const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
};

/**
 * Parse sorting params
 */
const parseSorting = (query, allowedFields = []) => {
  const sortBy = allowedFields.includes(query.sort_by) ? query.sort_by : 'created_at';
  const sortOrder = ['asc', 'desc'].includes(query.sort_order?.toLowerCase()) 
    ? query.sort_order.toLowerCase() 
    : 'desc';
  
  return { sortBy, sortOrder };
};

/**
 * Build search query
 */
const buildSearchQuery = (searchTerm, fields) => {
  if (!searchTerm) return null;
  
  const term = `%${searchTerm}%`;
  const conditions = fields.map(() => '?');
  
  return {
    sql: `(${fields.join(' LIKE ? OR ')} LIKE ?)`,
    params: fields.map(() => term),
  };
};

/**
 * Calculate event totals
 */
const calculateEventTotals = (data) => {
  const {
    guest_count = 0,
    price_per_plate = 0,
    discount_amount = 0,
    tax_rate = 18,
  } = data;

  const total_amount = guest_count * price_per_plate;
  const tax_amount = (total_amount - discount_amount) * (tax_rate / 100);
  const final_amount = total_amount - discount_amount + tax_amount;

  return {
    total_amount,
    tax_amount,
    final_amount,
  };
};

/**
 * Calculate invoice totals
 */
const calculateInvoiceTotals = (items, discount_amount = 0, tax_rate = 18) => {
  const subtotal = items.reduce((sum, item) => sum + (item.total_price || 0), 0);
  const tax_amount = (subtotal - discount_amount) * (tax_rate / 100);
  const total_amount = subtotal - discount_amount + tax_amount;

  return {
    subtotal,
    tax_amount,
    total_amount,
  };
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Indian format)
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
};

/**
 * Slugify string
 */
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

/**
 * Deep clone object
 */
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Group array by key
 */
const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    result[group] = result[group] || [];
    result[group].push(item);
    return result;
  }, {});
};

/**
 * Convert array to CSV
 */
const toCSV = (data, headers) => {
  const csvHeaders = headers.map(h => h.label).join(',');
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = header.key.split('.').reduce((obj, k) => obj?.[k], row);
      // Escape quotes and wrap in quotes if contains comma
      const str = String(value ?? '').replace(/"/g, '""');
      return str.includes(',') ? `"${str}"` : str;
    }).join(',');
  });
  return [csvHeaders, ...csvRows].join('\n');
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateRandomToken,
  formatCurrency,
  formatDate,
  generateUniqueId,
  sanitizeUser,
  parsePagination,
  parseSorting,
  buildSearchQuery,
  calculateEventTotals,
  calculateInvoiceTotals,
  isValidEmail,
  isValidPhone,
  slugify,
  deepClone,
  groupBy,
  toCSV,
};
