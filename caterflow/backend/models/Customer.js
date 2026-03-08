const db = require('../config/database');

class Customer {
  static async findById(id, tenantId) {
    const sql = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM events WHERE customer_id = c.id) as total_events,
        (SELECT MAX(event_date) FROM events WHERE customer_id = c.id) as last_event_date
      FROM customers c
      WHERE c.id = ? AND c.tenant_id = ?
    `;
    const rows = await db.query(sql, [id, tenantId]);
    return rows[0] || null;
  }

  static async findAll(tenantId, options = {}) {
    const { search, customerType, isActive, limit = 50, offset = 0, sortBy = 'created_at', sortOrder = 'DESC' } = options;
    
    let sql = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM events WHERE customer_id = c.id) as total_events,
        (SELECT COALESCE(SUM(final_amount), 0) FROM events WHERE customer_id = c.id AND status = 'completed') as total_revenue
      FROM customers c
      WHERE c.tenant_id = ?
    `;
    const params = [tenantId];
    
    if (search) {
      sql += ` AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (customerType) {
      sql += ` AND c.customer_type = ?`;
      params.push(customerType);
    }
    
    if (isActive !== undefined) {
      sql += ` AND c.is_active = ?`;
      params.push(isActive);
    }
    
    const allowedSortFields = ['first_name', 'last_name', 'created_at', 'total_events', 'total_revenue'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    sql += ` ORDER BY c.${sortField} ${order} LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    return await db.query(sql, params);
  }

  static async count(tenantId, options = {}) {
    const { search, customerType, isActive } = options;
    
    let sql = 'SELECT COUNT(*) as total FROM customers WHERE tenant_id = ?';
    const params = [tenantId];
    
    if (search) {
      sql += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (customerType) {
      sql += ` AND customer_type = ?`;
      params.push(customerType);
    }
    
    if (isActive !== undefined) {
      sql += ` AND is_active = ?`;
      params.push(isActive);
    }
    
    const rows = await db.query(sql, params);
    return rows[0].total;
  }

  static async create(data) {
    const {
      tenant_id,
      first_name,
      last_name,
      email,
      phone,
      alternate_phone,
      address_line1,
      address_line2,
      city,
      state,
      postal_code,
      country = 'India',
      customer_type = 'individual',
      company_name,
      gst_number,
      notes,
      dietary_preferences,
    } = data;

    const sql = `
      INSERT INTO customers (tenant_id, first_name, last_name, email, phone, alternate_phone,
        address_line1, address_line2, city, state, postal_code, country,
        customer_type, company_name, gst_number, notes, dietary_preferences)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await db.query(sql, [
      tenant_id, first_name, last_name, email, phone, alternate_phone,
      address_line1, address_line2, city, state, postal_code, country,
      customer_type, company_name, gst_number, notes, dietary_preferences,
    ]);
    
    return result.insertId;
  }

  static async update(id, tenantId, data) {
    const allowedFields = [
      'first_name', 'last_name', 'email', 'phone', 'alternate_phone',
      'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country',
      'customer_type', 'company_name', 'gst_number', 'notes', 'dietary_preferences', 'is_active'
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
    
    params.push(id, tenantId);
    const sql = `UPDATE customers SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`;
    
    const result = await db.query(sql, params);
    return result.affectedRows > 0;
  }

  static async delete(id, tenantId) {
    const sql = 'UPDATE customers SET is_active = FALSE WHERE id = ? AND tenant_id = ?';
    const result = await db.query(sql, [id, tenantId]);
    return result.affectedRows > 0;
  }

  static async getEventHistory(id, tenantId) {
    const sql = `
      SELECT e.*, 
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE event_id = e.id AND status = 'completed') as amount_paid
      FROM events e
      WHERE e.customer_id = ? AND e.tenant_id = ?
      ORDER BY e.event_date DESC
    `;
    return await db.query(sql, [id, tenantId]);
  }

  static async updateStats(customerId, tenantId) {
    const sql = `
      UPDATE customers 
      SET total_events = (SELECT COUNT(*) FROM events WHERE customer_id = ?),
          total_revenue = (SELECT COALESCE(SUM(final_amount), 0) FROM events WHERE customer_id = ? AND status = 'completed'),
          last_event_date = (SELECT MAX(event_date) FROM events WHERE customer_id = ?)
      WHERE id = ? AND tenant_id = ?
    `;
    await db.query(sql, [customerId, customerId, customerId, customerId, tenantId]);
  }
}

module.exports = Customer;
