const db = require('../config/database');

class Invoice {
  static async findById(id, tenantId) {
    const sql = `
      SELECT i.*, 
        c.first_name as customer_first_name, c.last_name as customer_last_name,
        e.event_name, e.event_date, e.guest_count,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE invoice_id = i.id AND status = 'completed') as amount_paid
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN events e ON i.event_id = e.id
      WHERE i.id = ? AND i.tenant_id = ?
    `;
    const rows = await db.query(sql, [id, tenantId]);
    return rows[0] || null;
  }

  static async findAll(tenantId, options = {}) {
    const { 
      status, 
      customerId, 
      eventId,
      startDate, 
      endDate,
      overdue,
      search,
      limit = 50, 
      offset = 0 
    } = options;
    
    let sql = `
      SELECT i.*, 
        c.first_name as customer_first_name, c.last_name as customer_last_name,
        e.event_name, e.event_date
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN events e ON i.event_id = e.id
      WHERE i.tenant_id = ?
    `;
    const params = [tenantId];
    
    if (status) {
      sql += ` AND i.status = ?`;
      params.push(status);
    }
    
    if (customerId) {
      sql += ` AND i.customer_id = ?`;
      params.push(customerId);
    }
    
    if (eventId) {
      sql += ` AND i.event_id = ?`;
      params.push(eventId);
    }
    
    if (startDate) {
      sql += ` AND i.invoice_date >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ` AND i.invoice_date <= ?`;
      params.push(endDate);
    }
    
    if (overdue) {
      sql += ` AND i.status IN ('sent', 'draft') AND i.due_date < CURDATE()`;
    }
    
    if (search) {
      sql += ` AND (i.invoice_number LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    sql += ` ORDER BY i.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    return await db.query(sql, params);
  }

  static async count(tenantId, options = {}) {
    const { status, overdue } = options;
    
    let sql = 'SELECT COUNT(*) as total FROM invoices WHERE tenant_id = ?';
    const params = [tenantId];
    
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }
    
    if (overdue) {
      sql += ` AND status IN ('sent', 'draft') AND due_date < CURDATE()`;
    }
    
    const rows = await db.query(sql, params);
    return rows[0].total;
  }

  static async generateInvoiceNumber(tenantId) {
    const prefix = 'INV';
    const year = new Date().getFullYear();
    
    const sql = `
      SELECT COUNT(*) as count 
      FROM invoices 
      WHERE tenant_id = ? AND YEAR(created_at) = ?
    `;
    const rows = await db.query(sql, [tenantId, year]);
    const count = rows[0].count + 1;
    
    return `${prefix}-${year}-${String(count).padStart(4, '0')}`;
  }

  static async create(data) {
    const {
      tenant_id,
      event_id,
      customer_id,
      invoice_date,
      due_date,
      subtotal,
      discount_amount = 0,
      tax_rate = 18,
      tax_amount,
      total_amount,
      amount_paid = 0,
      notes,
      terms_and_conditions,
      items,
    } = data;

    const invoice_number = await this.generateInvoiceNumber(tenant_id);
    const amount_due = total_amount - amount_paid;

    return await db.withTransaction(async (connection) => {
      // Create invoice
      const [invoiceResult] = await connection.execute(
        `INSERT INTO invoices (tenant_id, event_id, customer_id, invoice_number, invoice_date, due_date,
          subtotal, discount_amount, tax_rate, tax_amount, total_amount, amount_paid, amount_due, notes, terms_and_conditions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [tenant_id, event_id, customer_id, invoice_number, invoice_date, due_date,
          subtotal, discount_amount, tax_rate, tax_amount, total_amount, amount_paid, amount_due, notes, terms_and_conditions]
      );
      
      const invoiceId = invoiceResult.insertId;
      
      // Add invoice items
      if (items && items.length > 0) {
        const itemValues = items.map(item => [
          invoiceId, item.description, item.quantity, item.unit_price, item.total_price
        ]);
        await connection.query(
          'INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price) VALUES ?',
          [itemValues]
        );
      }
      
      return invoiceId;
    });
  }

  static async update(id, tenantId, data) {
    const allowedFields = [
      'invoice_date', 'due_date', 'subtotal', 'discount_amount', 'tax_rate',
      'tax_amount', 'total_amount', 'amount_paid', 'notes', 'terms_and_conditions', 'status'
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
    
    // Recalculate amount_due if amount_paid was updated
    if (data.amount_paid !== undefined && data.total_amount !== undefined) {
      updates.push('amount_due = ?');
      params.push(data.total_amount - data.amount_paid);
    }
    
    params.push(id, tenantId);
    const sql = `UPDATE invoices SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`;
    
    const result = await db.query(sql, params);
    return result.affectedRows > 0;
  }

  static async updatePaymentStatus(id, tenantId) {
    const sql = `
      UPDATE invoices 
      SET 
        amount_paid = (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE invoice_id = ? AND status = 'completed'),
        amount_due = total_amount - (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE invoice_id = ? AND status = 'completed'),
        status = CASE 
          WHEN amount_paid >= total_amount THEN 'paid'
          WHEN amount_paid > 0 THEN 'sent'
          ELSE status
        END
      WHERE id = ? AND tenant_id = ?
    `;
    const result = await db.query(sql, [id, id, id, tenantId]);
    return result.affectedRows > 0;
  }

  static async delete(id, tenantId) {
    const sql = 'UPDATE invoices SET status = "cancelled" WHERE id = ? AND tenant_id = ?';
    const result = await db.query(sql, [id, tenantId]);
    return result.affectedRows > 0;
  }

  static async getItems(invoiceId, tenantId) {
    const sql = 'SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id';
    return await db.query(sql, [invoiceId]);
  }

  static async getStats(tenantId) {
    const sql = `
      SELECT 
        COUNT(*) as total_invoices,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_invoices,
        SUM(CASE WHEN status IN ('sent', 'draft') AND due_date < CURDATE() THEN 1 ELSE 0 END) as overdue_invoices,
        COALESCE(SUM(total_amount), 0) as total_invoice_amount,
        COALESCE(SUM(amount_paid), 0) as total_paid_amount,
        COALESCE(SUM(amount_due), 0) as total_outstanding
      FROM invoices
      WHERE tenant_id = ? AND status != 'cancelled'
    `;
    const rows = await db.query(sql, [tenantId]);
    return rows[0];
  }
}

class Payment {
  static async findById(id, tenantId) {
    const sql = `
      SELECT p.*, 
        c.first_name as customer_first_name, c.last_name as customer_last_name,
        i.invoice_number,
        e.event_name,
        CONCAT(u.first_name, ' ', u.last_name) as received_by_name
      FROM payments p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN events e ON p.event_id = e.id
      LEFT JOIN users u ON p.received_by = u.id
      WHERE p.id = ? AND p.tenant_id = ?
    `;
    const rows = await db.query(sql, [id, tenantId]);
    return rows[0] || null;
  }

  static async findAll(tenantId, options = {}) {
    const { 
      invoiceId, 
      customerId,
      eventId,
      paymentMethod,
      status,
      startDate,
      endDate,
      limit = 50, 
      offset = 0 
    } = options;
    
    let sql = `
      SELECT p.*, 
        c.first_name as customer_first_name, c.last_name as customer_last_name,
        i.invoice_number
      FROM payments p
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN invoices i ON p.invoice_id = i.id
      WHERE p.tenant_id = ?
    `;
    const params = [tenantId];
    
    if (invoiceId) {
      sql += ` AND p.invoice_id = ?`;
      params.push(invoiceId);
    }
    
    if (customerId) {
      sql += ` AND p.customer_id = ?`;
      params.push(customerId);
    }
    
    if (eventId) {
      sql += ` AND p.event_id = ?`;
      params.push(eventId);
    }
    
    if (paymentMethod) {
      sql += ` AND p.payment_method = ?`;
      params.push(paymentMethod);
    }
    
    if (status) {
      sql += ` AND p.status = ?`;
      params.push(status);
    }
    
    if (startDate) {
      sql += ` AND p.payment_date >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ` AND p.payment_date <= ?`;
      params.push(endDate);
    }
    
    sql += ` ORDER BY p.payment_date DESC, p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    return await db.query(sql, params);
  }

  static async create(data) {
    const {
      tenant_id,
      invoice_id,
      customer_id,
      event_id,
      amount,
      payment_method,
      payment_date,
      reference_number,
      transaction_id,
      payment_gateway,
      gateway_transaction_id,
      gateway_response,
      notes,
      received_by,
    } = data;

    const sql = `
      INSERT INTO payments (tenant_id, invoice_id, customer_id, event_id, amount, payment_method,
        payment_date, reference_number, transaction_id, payment_gateway, gateway_transaction_id,
        gateway_response, notes, received_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await db.query(sql, [
      tenant_id, invoice_id, customer_id, event_id, amount, payment_method,
      payment_date, reference_number, transaction_id, payment_gateway,
      gateway_transaction_id ? JSON.stringify(gateway_transaction_id) : null,
      gateway_response ? JSON.stringify(gateway_response) : null,
      notes, received_by,
    ]);
    
    return result.insertId;
  }

  static async updateStatus(id, tenantId, status) {
    const sql = 'UPDATE payments SET status = ? WHERE id = ? AND tenant_id = ?';
    const result = await db.query(sql, [status, id, tenantId]);
    return result.affectedRows > 0;
  }

  static async getStats(tenantId, options = {}) {
    const { startDate, endDate } = options;
    
    let sql = `
      SELECT 
        COUNT(*) as total_payments,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END), 0) as cash_amount,
        COALESCE(SUM(CASE WHEN payment_method = 'card' THEN amount ELSE 0 END), 0) as card_amount,
        COALESCE(SUM(CASE WHEN payment_method = 'bank_transfer' THEN amount ELSE 0 END), 0) as bank_transfer_amount,
        COALESCE(SUM(CASE WHEN payment_method = 'upi' THEN amount ELSE 0 END), 0) as upi_amount
      FROM payments
      WHERE tenant_id = ? AND status = 'completed'
    `;
    const params = [tenantId];
    
    if (startDate) {
      sql += ` AND payment_date >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ` AND payment_date <= ?`;
      params.push(endDate);
    }
    
    const rows = await db.query(sql, params);
    return rows[0];
  }
}

module.exports = {
  Invoice,
  Payment,
};
