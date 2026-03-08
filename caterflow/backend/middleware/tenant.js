const Tenant = require('../models/Tenant');

/**
 * Middleware to ensure tenant isolation
 * Adds tenant filtering to database queries
 */
const tenantIsolation = async (req, res, next) => {
  try {
    // Super admins can access all tenants
    if (req.user && req.user.role === 'super_admin') {
      // Check if a tenant_id query param is provided for super admin to filter
      if (req.query.tenant_id) {
        req.tenantFilter = req.query.tenant_id;
      }
      return next();
    }

    // Regular users must have a tenant
    if (!req.user || !req.user.tenantId) {
      return res.status(403).json({
        success: false,
        message: 'Tenant access required. Please contact support.',
      });
    }

    // Check if tenant is active
    const tenant = await Tenant.findById(req.user.tenantId);
    
    if (!tenant) {
      return res.status(403).json({
        success: false,
        message: 'Tenant not found.',
      });
    }

    if (!tenant.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    if (tenant.is_suspended) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Reason: ' + (tenant.suspension_reason || 'No reason provided'),
      });
    }

    // Check subscription status for write operations
    const isWriteOperation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
    
    if (isWriteOperation && tenant.subscription_status === 'cancelled') {
      return res.status(403).json({
        success: false,
        message: 'Your subscription has been cancelled. Please renew to continue.',
        code: 'SUBSCRIPTION_CANCELLED',
      });
    }

    // Set tenant filter for queries
    req.tenantId = req.user.tenantId;
    req.tenantFilter = req.user.tenantId;
    
    // Attach tenant info to request
    req.tenant = {
      id: tenant.id,
      tenantId: tenant.tenant_id,
      name: tenant.business_name,
      planId: tenant.subscription_plan_id,
      planName: tenant.plan_name,
      subscriptionStatus: tenant.subscription_status,
    };

    next();
  } catch (error) {
    console.error('Tenant isolation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking tenant access.',
    });
  }
};

/**
 * Middleware to check subscription limits
 */
const checkSubscriptionLimits = (resourceType) => {
  return async (req, res, next) => {
    try {
      // Super admins bypass limits
      if (req.user.role === 'super_admin') {
        return next();
      }

      if (resourceType === 'events') {
        const check = await Tenant.checkEventLimit(req.tenantId);
        if (!check.allowed) {
          return res.status(403).json({
            success: false,
            message: `Event limit reached. Current plan allows ${check.limit} events per month.`,
            code: 'EVENT_LIMIT_REACHED',
            current: check.current,
            limit: check.limit,
            upgradeUrl: '/billing/upgrade',
          });
        }
      }

      if (resourceType === 'staff') {
        const check = await Tenant.checkStaffLimit(req.tenantId);
        if (!check.allowed) {
          return res.status(403).json({
            success: false,
            message: `Staff limit reached. Current plan allows ${check.limit} staff members.`,
            code: 'STAFF_LIMIT_REACHED',
            current: check.current,
            limit: check.limit,
            upgradeUrl: '/billing/upgrade',
          });
        }
      }

      next();
    } catch (error) {
      console.error('Subscription limit check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking subscription limits.',
      });
    }
  };
};

/**
 * Middleware to validate tenant access to specific resource
 */
const validateResourceAccess = (model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      // Super admins bypass validation
      if (req.user.role === 'super_admin' && !req.query.tenant_id) {
        return next();
      }

      const resourceId = req.params[paramName];
      const tenantId = req.tenantId || req.query.tenant_id;

      if (!resourceId || !tenantId) {
        return next();
      }

      // Check if resource belongs to tenant
      const sql = `SELECT id FROM ${model} WHERE id = ? AND tenant_id = ?`;
      const db = require('../config/database');
      const rows = await db.query(sql, [resourceId, tenantId]);

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found or access denied.',
        });
      }

      next();
    } catch (error) {
      console.error('Resource access validation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error validating resource access.',
      });
    }
  };
};

module.exports = {
  tenantIsolation,
  checkSubscriptionLimits,
  validateResourceAccess,
};
