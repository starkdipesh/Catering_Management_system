const db = require('../config/database');
const crypto = require('crypto');

class Tenant {
  static generateTenantId(businessName) {
    return businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }

  static async findById(id) {
    const sql = `
      SELECT t.*, sp.name as plan_name, sp.price_monthly, sp.max_events_per_month, sp.max_staff
      FROM tenants t
      LEFT JOIN subscription_plans sp ON t.subscription_plan_id = sp.id
      WHERE t.id = ?
    `;
    const rows = await db.query(sql, [id]);
    return rows[0] || null;
  }

  static async findByTenantId(tenantId) {
    const sql = `
      SELECT t.*, sp.name as plan_name, sp.price_monthly, sp.max_events_per_month, sp.max_staff
      FROM tenants t
      LEFT JOIN subscription_plans sp ON t.subscription_plan_id = sp.id
      WHERE t.tenant_id = ?
    `;
    const rows = await db.query(sql, [tenantId]);
    return rows[0] || null;
  }

  static async findByEmail(email) {
    const sql = 'SELECT * FROM tenants WHERE email = ?';
    const rows = await db.query(sql, [email]);
    return rows[0] || null;
  }

  static async findAll(options = {}) {
    const { status, isActive, limit = 50, offset = 0 } = options;
    let sql = `
      SELECT t.*, sp.name as plan_name, 
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT e.id) as event_count
      FROM tenants t
      LEFT JOIN subscription_plans sp ON t.subscription_plan_id = sp.id
      LEFT JOIN users u ON t.id = u.tenant_id AND u.is_active = TRUE
      LEFT JOIN events e ON t.id = e.tenant_id
    `;
    const params = [];
    const conditions = [];
    
    if (status) {
      conditions.push('t.subscription_status = ?');
      params.push(status);
    }
    
    if (isActive !== undefined) {
      conditions.push('t.is_active = ?');
      params.push(isActive);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ` GROUP BY t.id ORDER BY t.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    
    return await db.query(sql, params);
  }

  static async create(data) {
    const {
      business_name,
      owner_name,
      email,
      phone,
      address,
      subscription_plan_id = 1,
    } = data;

    const tenant_id = this.generateTenantId(business_name);
    
    // Check if tenant_id already exists
    const existing = await this.findByTenantId(tenant_id);
    if (existing) {
      throw new Error('A tenant with this business name already exists');
    }

    const sql = `
      INSERT INTO tenants (tenant_id, business_name, owner_name, email, phone, address, 
        subscription_plan_id, subscription_status, subscription_start_date, trial_ends_at, is_trial)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'trial', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY), TRUE)
    `;
    
    const result = await db.query(sql, [
      tenant_id,
      business_name,
      owner_name,
      email,
      phone,
      address,
      subscription_plan_id,
    ]);
    
    return { id: result.insertId, tenant_id };
  }

  static async update(id, data) {
    const allowedFields = [
      'business_name', 'owner_name', 'email', 'phone', 'address', 
      'logo_url', 'website', 'is_active', 'is_suspended', 'suspension_reason'
    ];
    const updates = [];
    const params = [];
    
    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    }
    
    if (updates.length === 0) return false;
    
    params.push(id);
    const sql = `UPDATE tenants SET ${updates.join(', ')} WHERE id = ?`;
    
    const result = await db.query(sql, params);
    return result.affectedRows > 0;
  }

  static async updateSubscription(id, data) {
    const {
      subscription_plan_id,
      subscription_status,
      subscription_end_date,
      billing_cycle,
      stripe_customer_id,
      stripe_subscription_id,
      is_trial,
    } = data;

    const sql = `
      UPDATE tenants 
      SET subscription_plan_id = ?, subscription_status = ?, 
          subscription_end_date = ?, billing_cycle = ?,
          stripe_customer_id = ?, stripe_subscription_id = ?, is_trial = ?
      WHERE id = ?
    `;
    
    const result = await db.query(sql, [
      subscription_plan_id,
      subscription_status,
      subscription_end_date,
      billing_cycle,
      stripe_customer_id,
      stripe_subscription_id,
      is_trial,
      id,
    ]);
    
    return result.affectedRows > 0;
  }

  static async getStats(tenantId) {
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM customers WHERE tenant_id = ? AND is_active = TRUE) as total_customers,
        (SELECT COUNT(*) FROM events WHERE tenant_id = ?) as total_events,
        (SELECT COUNT(*) FROM events WHERE tenant_id = ? AND event_date >= CURDATE()) as upcoming_events,
        (SELECT COUNT(*) FROM events WHERE tenant_id = ? AND status = 'completed') as completed_events,
        (SELECT COUNT(*) FROM users WHERE tenant_id = ? AND is_active = TRUE) as total_staff,
        (SELECT COALESCE(SUM(final_amount), 0) FROM events WHERE tenant_id = ? AND status = 'completed') as total_revenue,
        (SELECT COALESCE(SUM(final_amount), 0) FROM events WHERE tenant_id = ? AND status = 'completed' AND MONTH(event_date) = MONTH(CURDATE())) as monthly_revenue
    `;
    
    const rows = await db.query(sql, [tenantId, tenantId, tenantId, tenantId, tenantId, tenantId, tenantId]);
    return rows[0];
  }

  static async getPlanLimits(tenantId) {
    const sql = `
      SELECT sp.max_events_per_month, sp.max_staff
      FROM tenants t
      JOIN subscription_plans sp ON t.subscription_plan_id = sp.id
      WHERE t.id = ?
    `;
    const rows = await db.query(sql, [tenantId]);
    return rows[0] || { max_events_per_month: 5, max_staff: 3 };
  }

  static async checkEventLimit(tenantId) {
    const limits = await this.getPlanLimits(tenantId);
    
    if (!limits.max_events_per_month) return { allowed: true }; // Unlimited
    
    const sql = `
      SELECT COUNT(*) as count 
      FROM events 
      WHERE tenant_id = ? AND MONTH(event_date) = MONTH(CURDATE()) AND YEAR(event_date) = YEAR(CURDATE())
    `;
    const rows = await db.query(sql, [tenantId]);
    const currentCount = rows[0].count;
    
    return {
      allowed: currentCount < limits.max_events_per_month,
      current: currentCount,
      limit: limits.max_events_per_month,
      remaining: Math.max(0, limits.max_events_per_month - currentCount),
    };
  }

  static async checkStaffLimit(tenantId) {
    const limits = await this.getPlanLimits(tenantId);
    
    if (!limits.max_staff) return { allowed: true }; // Unlimited
    
    const sql = `
      SELECT COUNT(*) as count 
      FROM users 
      WHERE tenant_id = ? AND role IN ('staff', 'manager') AND is_active = TRUE
    `;
    const rows = await db.query(sql, [tenantId]);
    const currentCount = rows[0].count;
    
    return {
      allowed: currentCount < limits.max_staff,
      current: currentCount,
      limit: limits.max_staff,
      remaining: Math.max(0, limits.max_staff - currentCount),
    };
  }
}

module.exports = Tenant;
