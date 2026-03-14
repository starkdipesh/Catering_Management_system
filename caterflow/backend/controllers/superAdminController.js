const Tenant = require('../models/Tenant');
const User = require('../models/User');
const { SubscriptionPlan, SubscriptionInvoice } = require('../models/Subscription');
const Event = require('../models/Event');
const { Payment } = require('../models/Invoice');
const { parsePagination } = require('../utils/helpers');

class SuperAdminController {
  /**
   * Get platform overview statistics
   */
  async getPlatformStats(req, res, next) {
    try {
      const stats = await SubscriptionInvoice.getPlatformStats();
      
      // Get additional stats
      const db = require('../config/database');
      
      // Get signups over last 30 days
      const signupsSql = `
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM tenants
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;
      const signups = await db.query(signupsSql);
      
      // Get plan distribution
      const plansSql = `
        SELECT sp.name, COUNT(t.id) as count
        FROM subscription_plans sp
        LEFT JOIN tenants t ON sp.id = t.subscription_plan_id AND t.is_active = TRUE
        WHERE sp.is_active = TRUE
        GROUP BY sp.id, sp.name
      `;
      const planDistribution = await db.query(plansSql);

      res.json({
        success: true,
        data: {
          ...stats,
          recentSignups: signups,
          planDistribution,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all tenants with filtering
   */
  async getTenants(req, res, next) {
    try {
      const { status, is_active, search, page, limit } = req.query;
      const pagination = parsePagination({ page, limit });

      const options = {
        status,
        isActive: is_active !== undefined ? is_active === 'true' : undefined,
        limit: pagination.limit,
        offset: pagination.offset,
      };

      const tenants = await Tenant.findAll(options);

      res.json({
        success: true,
        data: tenants,
        meta: {
          page: pagination.page,
          limit: pagination.limit,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single tenant details
   */
  async getTenantById(req, res, next) {
    try {
      const { id } = req.params;
      
      const tenant = await Tenant.findById(id);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found',
        });
      }

      // Get tenant stats
      const stats = await Tenant.getStats(id);
      
      // Get tenant users
      const users = await User.findByTenant(id, { limit: 100 });

      res.json({
        success: true,
        data: {
          ...tenant,
          stats,
          users,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update tenant status
   */
  async updateTenant(req, res, next) {
    try {
      const { id } = req.params;
      const { is_active, is_suspended, suspension_reason } = req.body;

      const tenant = await Tenant.findById(id);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found',
        });
      }

      const updated = await Tenant.update(id, {
        is_active,
        is_suspended,
        suspension_reason,
      });

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'Failed to update tenant',
        });
      }

      res.json({
        success: true,
        message: 'Tenant updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete tenant (soft delete)
   */
  async deleteTenant(req, res, next) {
    try {
      const { id } = req.params;

      const tenant = await Tenant.findById(id);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found',
        });
      }

      const updated = await Tenant.update(id, {
        is_active: false,
        is_suspended: true,
        suspension_reason: 'Deleted by super admin',
      });

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'Failed to delete tenant',
        });
      }

      res.json({
        success: true,
        message: 'Tenant deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all subscription plans
   */
  async getPlans(req, res, next) {
    try {
      const plans = await SubscriptionPlan.findAll();
      
      res.json({
        success: true,
        data: plans,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single subscription plan
   */
  async getPlan(req, res, next) {
    try {
      const { id } = req.params;
      
      const plan = await SubscriptionPlan.findById(id);
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Plan not found',
        });
      }

      res.json({
        success: true,
        data: plan,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create subscription plan
   */
  async createPlan(req, res, next) {
    try {
      const {
        name,
        description,
        price_monthly,
        price_yearly,
        max_events_per_month,
        max_staff,
        features,
      } = req.body;

      const planId = await SubscriptionPlan.create({
        name,
        description,
        price_monthly,
        price_yearly,
        max_events_per_month,
        max_staff,
        features,
      });

      const plan = await SubscriptionPlan.findById(planId);

      res.status(201).json({
        success: true,
        message: 'Plan created successfully',
        data: plan,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update subscription plan
   */
  async updatePlan(req, res, next) {
    try {
      const { id } = req.params;
      
      const plan = await SubscriptionPlan.findById(id);
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Plan not found',
        });
      }

      const updated = await SubscriptionPlan.update(id, req.body);

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'Failed to update plan',
        });
      }

      const updatedPlan = await SubscriptionPlan.findById(id);

      res.json({
        success: true,
        message: 'Plan updated successfully',
        data: updatedPlan,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all subscription invoices
   */
  async getSubscriptionInvoices(req, res, next) {
    try {
      const { tenant_id, status, page, limit } = req.query;
      const pagination = parsePagination({ page, limit });

      const options = {
        tenantId: tenant_id,
        status,
        limit: pagination.limit,
        offset: pagination.offset,
      };

      const invoices = await SubscriptionInvoice.findAll(options);

      res.json({
        success: true,
        data: invoices,
        meta: {
          page: pagination.page,
          limit: pagination.limit,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Impersonate tenant (login as tenant)
   */
  async impersonate(req, res, next) {
    try {
      const { tenant_id } = req.body;

      const tenant = await Tenant.findById(tenant_id);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found',
        });
      }

      // Get tenant admin user
      const adminUser = await User.findByTenant(tenant_id, { role: 'tenant_admin', limit: 1 });
      
      if (adminUser.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No admin user found for this tenant',
        });
      }

      const user = adminUser[0];
      const { generateAccessToken, generateRefreshToken } = require('../utils/helpers');

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      res.json({
        success: true,
        message: 'Impersonation successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            tenantId: tenant.id,
            tenantName: tenant.business_name,
            tenantCode: tenant.tenant_id,
          },
          tokens: {
            accessToken,
            refreshToken,
          },
          impersonation: true,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SuperAdminController();
