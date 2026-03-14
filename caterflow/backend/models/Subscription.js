const db = require('../config/database');

class SubscriptionPlan {
  static async findById(id) {
    const sql = 'SELECT * FROM subscription_plans WHERE id = ? AND is_active = TRUE';
    const rows = await db.query(sql, [id]);
    return rows[0] || null;
  }

  static async findAll() {
    const sql = 'SELECT * FROM subscription_plans WHERE is_active = TRUE ORDER BY price_monthly';
    return await db.query(sql);
  }

  static async create(data) {
    const {
      name,
      description,
      price_monthly,
      price_yearly,
      max_events_per_month,
      max_staff,
      features,
    } = data;

    const sql = `
      INSERT INTO subscription_plans (name, description, price_monthly, price_yearly,
        max_events_per_month, max_staff, features)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await db.query(sql, [
      name, 
      description || null, 
      price_monthly, 
      price_yearly || 0,
      max_events_per_month || null, 
      max_staff || null, 
      JSON.stringify(features || []),
    ]);
    
    return result.insertId;
  }

  static async update(id, data) {
    const allowedFields = [
      'name', 'description', 'price_monthly', 'price_yearly',
      'max_events_per_month', 'max_staff', 'features', 'is_active'
    ];
    
    const updates = [];
    const params = [];
    
    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        params.push(key === 'features' ? JSON.stringify(value) : value);
      }
    }
    
    if (updates.length === 0) return false;
    
    params.push(id);
    const sql = `UPDATE subscription_plans SET ${updates.join(', ')} WHERE id = ?`;
    
    const result = await db.query(sql, params);
    return result.affectedRows > 0;
  }
}

class SubscriptionInvoice {
  static async findById(id) {
    const sql = `
      SELECT si.*, t.business_name, t.tenant_id
      FROM subscription_invoices si
      JOIN tenants t ON si.tenant_id = t.id
      WHERE si.id = ?
    `;
    const rows = await db.query(sql, [id]);
    return rows[0] || null;
  }

  static async findAll(options = {}) {
    const { tenantId, status, limit = 50, offset = 0 } = options;
    
    let sql = `
      SELECT si.*, t.business_name, t.tenant_id
      FROM subscription_invoices si
      JOIN tenants t ON si.tenant_id = t.id
      WHERE 1=1
    `;
    const params = [];
    
    if (tenantId) {
      sql += ` AND si.tenant_id = ?`;
      params.push(tenantId);
    }
    
    if (status) {
      sql += ` AND si.status = ?`;
      params.push(status);
    }
    
    sql += ` ORDER BY si.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    return await db.query(sql, params);
  }

  static async create(data) {
    const {
      tenant_id,
      billing_period_start,
      billing_period_end,
      plan_id,
      plan_name,
      plan_price,
      amount,
      tax_amount = 0,
      total_amount,
    } = data;

    // Generate invoice number
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    const countSql = `SELECT COUNT(*) as count FROM subscription_invoices WHERE YEAR(created_at) = ?`;
    const countRows = await db.query(countSql, [year]);
    const count = countRows[0].count + 1;
    
    const invoice_number = `SUB-${year}${month}-${String(count).padStart(4, '0')}`;

    const sql = `
      INSERT INTO subscription_invoices (tenant_id, invoice_number, billing_period_start, billing_period_end,
        plan_id, plan_name, plan_price, amount, tax_amount, total_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
    `;
    
    const result = await db.query(sql, [
      tenant_id, invoice_number, billing_period_start, billing_period_end,
      plan_id, plan_name, plan_price, amount, tax_amount, total_amount,
    ]);
    
    return result.insertId;
  }

  static async updateStatus(id, status, stripeInvoiceId = null) {
    let sql, params;
    
    if (stripeInvoiceId) {
      sql = 'UPDATE subscription_invoices SET status = ?, stripe_invoice_id = ? WHERE id = ?';
      params = [status, stripeInvoiceId, id];
    } else {
      sql = 'UPDATE subscription_invoices SET status = ? WHERE id = ?';
      params = [status, id];
    }
    
    if (status === 'paid') {
      sql = 'UPDATE subscription_invoices SET status = ?, paid_at = NOW(), stripe_invoice_id = ? WHERE id = ?';
      params = [status, stripeInvoiceId || null, id];
    }
    
    const result = await db.query(sql, params);
    return result.affectedRows > 0;
  }

  static async getPlatformStats() {
    const sql = `
      SELECT 
        COUNT(DISTINCT t.id) as total_tenants,
        COUNT(DISTINCT CASE WHEN t.subscription_status = 'active' THEN t.id END) as active_subscriptions,
        COUNT(DISTINCT CASE WHEN t.subscription_status = 'trial' THEN t.id END) as trial_subscriptions,
        COALESCE(SUM(CASE WHEN si.status = 'paid' THEN si.total_amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN si.status = 'paid' AND MONTH(si.paid_at) = MONTH(CURDATE()) THEN si.total_amount ELSE 0 END), 0) as monthly_revenue
      FROM tenants t
      LEFT JOIN subscription_invoices si ON t.id = si.tenant_id
      WHERE t.is_active = TRUE
    `;
    const rows = await db.query(sql);
    return rows[0];
  }
}

module.exports = {
  SubscriptionPlan,
  SubscriptionInvoice,
};
