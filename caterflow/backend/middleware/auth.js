const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token format.',
      });
    }

    const decoded = jwt.verify(token, config.JWT.SECRET);
    
    // Get user details
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      tenantId: user.tenant_id,
      tenantName: user.tenant_name,
      tenantCode: user.tenant_code,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
        code: 'TOKEN_EXPIRED',
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.JWT.SECRET);
    const user = await User.findById(decoded.userId);
    
    if (user && user.is_active) {
      req.user = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        tenantId: user.tenant_id,
        tenantName: user.tenant_name,
        tenantCode: user.tenant_code,
      };
    }
    
    next();
  } catch (error) {
    next();
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.',
        requiredRoles: roles,
        currentRole: req.user.role,
      });
    }

    next();
  };
};

// Super Admin only
const superAdminOnly = authorize('super_admin');

// Tenant Admin or higher
const tenantAdminOrHigher = authorize('super_admin', 'tenant_admin');

// Manager or higher
const managerOrHigher = authorize('super_admin', 'tenant_admin', 'manager');

// All authenticated users
const anyAuthenticated = authorize('super_admin', 'tenant_admin', 'manager', 'staff');

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  superAdminOnly,
  tenantAdminOrHigher,
  managerOrHigher,
  anyAuthenticated,
};
