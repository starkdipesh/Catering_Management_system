const User = require('../models/User');
const Tenant = require('../models/Tenant');
const { parsePagination } = require('../utils/helpers');

class UserController {
  /**
   * Get all users for tenant
   */
  async getAll(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { role, is_active, search, page, limit } = req.query;
      const pagination = parsePagination({ page, limit });

      const options = {
        role,
        isActive: is_active !== undefined ? is_active === 'true' : undefined,
        limit: pagination.limit,
        offset: pagination.offset,
      };

      const users = await User.findByTenant(tenantId, options);

      res.json({
        success: true,
        data: users,
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
   * Get user by ID
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      
      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Check if user belongs to same tenant (or is super admin)
      if (req.user.role !== 'super_admin' && user.tenant_id !== req.tenantId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new user
   */
  async create(req, res, next) {
    try {
      const tenantId = req.tenantId;
      
      // Check staff limit for the tenant
      if (req.body.role === 'staff' || req.body.role === 'manager') {
        const limitCheck = await Tenant.checkStaffLimit(tenantId);
        if (!limitCheck.allowed) {
          return res.status(403).json({
            success: false,
            message: `Staff limit reached. Current plan allows ${limitCheck.limit} staff members.`,
            code: 'STAFF_LIMIT_REACHED',
          });
        }
      }

      const {
        email,
        password,
        first_name,
        last_name,
        phone,
        role,
      } = req.body;

      // Check if email already exists
      const existingUser = await User.findByEmail(email, tenantId);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'A user with this email already exists',
        });
      }

      const userId = await User.create({
        tenant_id: tenantId,
        email,
        password: password || 'TempPass123!', // Generate temp password if not provided
        first_name,
        last_name,
        phone,
        role: role || 'staff',
        is_active: true,
      });

      const user = await User.findById(userId);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Check permissions
      if (req.user.role !== 'super_admin' && user.tenant_id !== tenantId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Don't allow changing role of the last tenant admin
      if (req.body.role && user.role === 'tenant_admin' && req.body.role !== 'tenant_admin') {
        const adminCount = await User.count(tenantId, { role: 'tenant_admin', isActive: true });
        if (adminCount <= 1) {
          return res.status(400).json({
            success: false,
            message: 'Cannot change role of the last tenant admin',
          });
        }
      }

      const updated = await User.update(id, req.body);

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'No changes made',
        });
      }

      const updatedUser = await User.findById(id);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user (soft delete)
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      if (user.tenant_id !== tenantId && req.user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Don't allow deleting the last tenant admin
      if (user.role === 'tenant_admin') {
        const adminCount = await User.count(tenantId, { role: 'tenant_admin', isActive: true });
        if (adminCount <= 1) {
          return res.status(400).json({
            success: false,
            message: 'Cannot delete the last tenant admin',
          });
        }
      }

      const deleted = await User.delete(id);

      if (!deleted) {
        return res.status(400).json({
          success: false,
          message: 'Failed to delete user',
        });
      }

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req, res, next) {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user profile
   */
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { first_name, last_name, phone, avatar_url } = req.body;

      const updated = await User.update(userId, {
        first_name,
        last_name,
        phone,
        avatar_url,
      });

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'No changes made',
        });
      }

      const user = await User.findById(userId);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset user password (admin only)
   */
  async resetPassword(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      const { new_password } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      if (user.tenant_id !== tenantId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      await User.updatePassword(id, new_password || 'TempPass123!');

      res.json({
        success: true,
        message: 'Password reset successfully',
        temporaryPassword: !new_password ? 'TempPass123!' : undefined,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
