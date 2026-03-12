const db = require('../config/database');

class Event {
  static async findById(id, tenantId) {
    const sql = `
      SELECT e.*, 
        c.first_name as customer_first_name, c.last_name as customer_last_name, c.phone as customer_phone, c.email as customer_email,
        mp.name as menu_package_name,
        CONCAT(u.first_name, ' ', u.last_name) as assigned_manager_name
      FROM events e
      LEFT JOIN customers c ON e.customer_id = c.id
      LEFT JOIN menu_packages mp ON e.menu_package_id = mp.id
      LEFT JOIN users u ON e.assigned_manager_id = u.id
      WHERE e.id = ? AND e.tenant_id = ?
    `;
    const rows = await db.query(sql, [id, tenantId]);
    return rows[0] || null;
  }

  static async findAll(tenantId, options = {}) {
    const { 
      status, 
      eventType, 
      customerId, 
      startDate, 
      endDate, 
      search,
      limit = 50, 
      offset = 0,
      upcoming = false,
      sortBy = 'event_date',
      sortOrder = 'ASC'
    } = options;
    
    let sql = `
      SELECT e.*, 
        c.first_name as customer_first_name, c.last_name as customer_last_name,
        CONCAT(u.first_name, ' ', u.last_name) as assigned_manager_name
      FROM events e
      LEFT JOIN customers c ON e.customer_id = c.id
      LEFT JOIN users u ON e.assigned_manager_id = u.id
    `;
    const params = [];
    
    if (tenantId) {
      sql += ` WHERE e.tenant_id = ?`;
      params.push(tenantId);
    } else {
      sql += ` WHERE 1=1`;
    }
    
    if (status) {
      sql += ` AND e.status = ?`;
      params.push(status);
    }
    
    if (eventType) {
      sql += ` AND e.event_type = ?`;
      params.push(eventType);
    }
    
    if (customerId) {
      sql += ` AND e.customer_id = ?`;
      params.push(customerId);
    }
    
    if (startDate) {
      sql += ` AND e.event_date >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ` AND e.event_date <= ?`;
      params.push(endDate);
    }
    
    if (upcoming) {
      sql += ` AND e.event_date >= CURDATE()`;
    }
    
    if (search) {
      sql += ` AND (e.event_name LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    const allowedSortFields = ['event_date', 'created_at', 'event_name', 'status'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'event_date';
    const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    
    sql += ` ORDER BY e.${sortField} ${order} LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    
    return await db.query(sql, params);
  }

  static async count(tenantId, options = {}) {
    const { status, eventType, startDate, endDate, upcoming } = options;
    
    let sql = 'SELECT COUNT(*) as total FROM events';
    const params = [];
    
    if (tenantId) {
      sql += ' WHERE tenant_id = ?';
      params.push(tenantId);
    } else {
      sql += ' WHERE 1=1';
    }
    
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }
    
    if (eventType) {
      sql += ` AND event_type = ?`;
      params.push(eventType);
    }
    
    if (startDate) {
      sql += ` AND event_date >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ` AND event_date <= ?`;
      params.push(endDate);
    }
    
    if (upcoming) {
      sql += ` AND event_date >= CURDATE()`;
    }
    
    const rows = await db.query(sql, params);
    return rows[0].total;
  }

  static async create(data) {
    const {
      tenant_id,
      customer_id,
      event_name,
      event_type,
      event_date,
      event_time,
      duration_hours,
      venue_name,
      venue_address,
      city,
      guest_count,
      expected_guest_count,
      menu_package_id,
      menu_customizations,
      dietary_requirements,
      price_per_plate,
      total_amount,
      discount_amount = 0,
      tax_amount = 0,
      final_amount,
      status = 'inquiry',
      payment_status = 'pending',
      assigned_manager_id,
      notes,
      special_requests,
    } = data;

    const sql = `
      INSERT INTO events (tenant_id, customer_id, event_name, event_type, event_date, event_time,
        duration_hours, venue_name, venue_address, city, guest_count, expected_guest_count,
        menu_package_id, menu_customizations, dietary_requirements, price_per_plate, total_amount,
        discount_amount, tax_amount, final_amount, status, payment_status, assigned_manager_id, notes, special_requests)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await db.query(sql, [
      tenant_id, customer_id, event_name, event_type, event_date, event_time,
      duration_hours, venue_name, venue_address, city, guest_count, expected_guest_count,
      menu_package_id, menu_customizations, dietary_requirements, price_per_plate, total_amount,
      discount_amount, tax_amount, final_amount, status, payment_status, assigned_manager_id, notes, special_requests,
    ]);
    
    return result.insertId;
  }

  static async update(id, tenantId, data) {
    const allowedFields = [
      'customer_id', 'event_name', 'event_type', 'event_date', 'event_time',
      'duration_hours', 'venue_name', 'venue_address', 'city', 'guest_count', 'expected_guest_count',
      'menu_package_id', 'menu_customizations', 'dietary_requirements', 'price_per_plate', 'total_amount',
      'discount_amount', 'tax_amount', 'final_amount', 'status', 'payment_status', 'assigned_manager_id', 'notes', 'special_requests'
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
    const sql = `UPDATE events SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`;
    
    const result = await db.query(sql, params);
    return result.affectedRows > 0;
  }

  static async delete(id, tenantId) {
    const sql = 'DELETE FROM events WHERE id = ? AND tenant_id = ?';
    const result = await db.query(sql, [id, tenantId]);
    return result.affectedRows > 0;
  }

  static async getByDateRange(tenantId, startDate, endDate) {
    const sql = `
      SELECT e.*, c.first_name, c.last_name, c.phone
      FROM events e
      LEFT JOIN customers c ON e.customer_id = c.id
      WHERE e.tenant_id = ? AND e.event_date BETWEEN ? AND ?
      ORDER BY e.event_date, e.event_time
    `;
    return await db.query(sql, [tenantId, startDate, endDate]);
  }

  static async getStats(tenantId, options = {}) {
    const { startDate, endDate } = options;
    
    let sql = `
      SELECT 
        COUNT(*) as total_events,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_events,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_events,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_events,
        SUM(CASE WHEN event_date >= CURDATE() THEN 1 ELSE 0 END) as upcoming_events,
        COALESCE(SUM(final_amount), 0) as total_revenue,
        COALESCE(SUM(guest_count), 0) as total_guests
      FROM events
      WHERE tenant_id = ?
    `;
    const params = [tenantId];
    
    if (startDate) {
      sql += ` AND event_date >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ` AND event_date <= ?`;
      params.push(endDate);
    }
    
    const rows = await db.query(sql, params);
    return rows[0];
  }

  static async getEventTypesDistribution(tenantId) {
    const sql = `
      SELECT event_type, COUNT(*) as count
      FROM events
      WHERE tenant_id = ? AND event_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY event_type
    `;
    return await db.query(sql, [tenantId]);
  }

  static async getMonthlyRevenue(tenantId, months = 12) {
    const sql = `
      SELECT 
        DATE_FORMAT(event_date, '%Y-%m') as month,
        COUNT(*) as event_count,
        COALESCE(SUM(final_amount), 0) as revenue
      FROM events
      WHERE tenant_id = ? 
        AND status = 'completed'
        AND event_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
      GROUP BY DATE_FORMAT(event_date, '%Y-%m')
      ORDER BY month ASC
    `;
    return await db.query(sql, [tenantId, months]);
  }
}

module.exports = Event;
