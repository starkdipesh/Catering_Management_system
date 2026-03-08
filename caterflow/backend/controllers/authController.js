const User = require('../models/User');
const Tenant = require('../models/Tenant');
const { generateAccessToken, generateRefreshToken, generateRandomToken, formatDate } = require('../utils/helpers');
const db = require('../config/database');

class AuthController {
  /**
   * Login user
   */
  async login(req, res, next) {
    try {
      const { email, password, tenantId } = req.body;

      // Find user by email
      const user = await User.findByEmail(email, tenantId);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Check if user is active
      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated. Please contact support.',
        });
      }

      // Verify password
      const isValidPassword = await User.verifyPassword(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Update last login
      await User.updateLastLogin(user.id, req.ip);

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Store refresh token
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
      
      await db.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [user.id, refreshToken, expiresAt]
      );

      // Get tenant info if applicable
      let tenant = null;
      if (user.tenant_id) {
        tenant = await Tenant.findById(user.tenant_id);
      }

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            fullName: `${user.first_name} ${user.last_name}`,
            role: user.role,
            tenantId: user.tenant_id,
            tenantName: tenant?.business_name,
            tenantCode: tenant?.tenant_id,
            avatarUrl: user.avatar_url,
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: '1d',
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register new tenant
   */
  async register(req, res, next) {
    try {
      const {
        business_name,
        owner_name,
        email,
        phone,
        password,
        address,
        plan_id = 1, // Default to Free plan
      } = req.body;

      // Check if email already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists',
        });
      }

      // Check if tenant already exists
      const existingTenant = await Tenant.findByEmail(email);
      if (existingTenant) {
        return res.status(409).json({
          success: false,
          message: 'A business with this email already exists',
        });
      }

      // Create tenant
      const tenant = await Tenant.create({
        business_name,
        owner_name,
        email,
        phone,
        address,
        subscription_plan_id: plan_id,
      });

      // Create tenant admin user
      const [firstName, ...lastNameParts] = owner_name.split(' ');
      const lastName = lastNameParts.join(' ') || '';

      const userId = await User.create({
        tenant_id: tenant.id,
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phone,
        role: 'tenant_admin',
        is_active: true,
      });

      // Get created user
      const user = await User.findById(userId);

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Store refresh token
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      await db.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [userId, refreshToken, expiresAt]
      );

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: {
            id: userId,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            fullName: `${user.first_name} ${user.last_name}`,
            role: user.role,
            tenantId: tenant.id,
            tenantName: business_name,
            tenantCode: tenant.tenant_id,
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: '1d',
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
      }

      // Verify refresh token in database
      const tokenRows = await db.query(
        'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
        [refreshToken]
      );

      if (tokenRows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token',
        });
      }

      const tokenData = tokenRows[0];
      const user = await User.findById(tokenData.user_id);

      if (!user || !user.is_active) {
        return res.status(401).json({
          success: false,
          message: 'User not found or inactive',
        });
      }

      // Generate new access token
      const accessToken = generateAccessToken(user);

      res.json({
        success: true,
        data: {
          accessToken,
          expiresIn: '1d',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   */
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const userId = req.user?.id;

      if (refreshToken) {
        // Delete specific refresh token
        await db.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
      } else if (userId) {
        // Delete all refresh tokens for user
        await db.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
      }

      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   */
  async me(req, res, next) {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      let tenant = null;
      if (user.tenant_id) {
        tenant = await Tenant.findById(user.tenant_id);
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            fullName: `${user.first_name} ${user.last_name}`,
            phone: user.phone,
            role: user.role,
            avatarUrl: user.avatar_url,
            tenantId: user.tenant_id,
            tenantName: tenant?.business_name,
            tenantCode: tenant?.tenant_id,
            isActive: user.is_active,
            emailVerified: user.email_verified,
            lastLoginAt: user.last_login_at,
            createdAt: user.created_at,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const user = await User.findByEmail(email);

      if (!user) {
        // Don't reveal if email exists
        return res.json({
          success: true,
          message: 'If an account exists with this email, you will receive a password reset link.',
        });
      }

      // Generate reset token
      const resetToken = generateRandomToken(32);
      const resetExpires = new Date();
      resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour

      // Store reset token
      await db.query(
        'UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?',
        [resetToken, resetExpires, user.id]
      );

      // TODO: Send email with reset link
      // For now, return the token in development
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      res.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.',
        ...(process.env.NODE_ENV === 'development' && {
          resetToken,
          resetUrl,
        }),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;

      // Find user with valid reset token
      const rows = await db.query(
        'SELECT * FROM users WHERE password_reset_token = ? AND password_reset_expires > NOW()',
        [token]
      );

      if (rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token',
        });
      }

      const user = rows[0];

      // Update password
      await User.updatePassword(user.id, newPassword);

      // Clear reset token
      await db.query(
        'UPDATE users SET password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
        [user.id]
      );

      res.json({
        success: true,
        message: 'Password reset successful',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Get user with password
      const rows = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
      const user = rows[0];

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Verify current password
      const isValidPassword = await User.verifyPassword(currentPassword, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      // Update password
      await User.updatePassword(userId, newPassword);

      // Clear all refresh tokens
      await db.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);

      res.json({
        success: true,
        message: 'Password changed successfully. Please login again.',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
