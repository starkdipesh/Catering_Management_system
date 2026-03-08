const db = require('../config/database');

class InventoryCategory {
  static async findById(id, tenantId) {
    const sql = 'SELECT * FROM inventory_categories WHERE id = ? AND tenant_id = ?';
    const rows = await db.query(sql, [id, tenantId]);
    return rows[0] || null;
  }

  static async findAll(tenantId) {
    const sql = 'SELECT * FROM inventory_categories WHERE tenant_id = ? AND is_active = TRUE ORDER BY name';
    return await db.query(sql, [tenantId]);
  }

  static async create(data) {
    const { tenant_id, name, description } = data;
    const sql = 'INSERT INTO inventory_categories (tenant_id, name, description) VALUES (?, ?, ?)';
    const result = await db.query(sql, [tenant_id, name, description]);
    return result.insertId;
  }

  static async update(id, tenantId, data) {
    const { name, description, is_active } = data;
    const sql = 'UPDATE inventory_categories SET name = ?, description = ?, is_active = ? WHERE id = ? AND tenant_id = ?';
    const result = await db.query(sql, [name, description, is_active, id, tenantId]);
    return result.affectedRows > 0;
  }

  static async delete(id, tenantId) {
    const sql = 'UPDATE inventory_categories SET is_active = FALSE WHERE id = ? AND tenant_id = ?';
    const result = await db.query(sql, [id, tenantId]);
    return result.affectedRows > 0;
  }
}

class InventoryItem {
  static async findById(id, tenantId) {
    const sql = `
      SELECT ii.*, ic.name as category_name, s.name as supplier_name
      FROM inventory_items ii
      LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
      LEFT JOIN suppliers s ON ii.supplier_id = s.id
      WHERE ii.id = ? AND ii.tenant_id = ?
    `;
    const rows = await db.query(sql, [id, tenantId]);
    return rows[0] || null;
  }

  static async findAll(tenantId, options = {}) {
    const { categoryId, supplierId, lowStock, search, limit = 50, offset = 0 } = options;
    
    let sql = `
      SELECT ii.*, ic.name as category_name, s.name as supplier_name,
        CASE 
          WHEN ii.quantity <= ii.min_threshold THEN 'low'
          WHEN ii.quantity <= (ii.min_threshold * 1.5) THEN 'medium'
          ELSE 'good'
        END as stock_status
      FROM inventory_items ii
      LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
      LEFT JOIN suppliers s ON ii.supplier_id = s.id
      WHERE ii.tenant_id = ? AND ii.is_active = TRUE
    `;
    const params = [tenantId];
    
    if (categoryId) {
      sql += ` AND ii.category_id = ?`;
      params.push(categoryId);
    }
    
    if (supplierId) {
      sql += ` AND ii.supplier_id = ?`;
      params.push(supplierId);
    }
    
    if (lowStock) {
      sql += ` AND ii.quantity <= ii.min_threshold`;
    }
    
    if (search) {
      sql += ` AND (ii.name LIKE ? OR ii.description LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }
    
    sql += ` ORDER BY ii.name LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    return await db.query(sql, params);
  }

  static async count(tenantId, options = {}) {
    const { categoryId, lowStock } = options;
    
    let sql = 'SELECT COUNT(*) as total FROM inventory_items WHERE tenant_id = ? AND is_active = TRUE';
    const params = [tenantId];
    
    if (categoryId) {
      sql += ` AND category_id = ?`;
      params.push(categoryId);
    }
    
    if (lowStock) {
      sql += ` AND quantity <= min_threshold`;
    }
    
    const rows = await db.query(sql, params);
    return rows[0].total;
  }

  static async create(data) {
    const {
      tenant_id,
      category_id,
      supplier_id,
      name,
      description,
      unit,
      quantity = 0,
      min_threshold = 0,
      max_threshold,
      reorder_point,
      cost_per_unit,
      storage_location,
    } = data;

    const sql = `
      INSERT INTO inventory_items (tenant_id, category_id, supplier_id, name, description, unit,
        quantity, min_threshold, max_threshold, reorder_point, cost_per_unit, storage_location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await db.query(sql, [
      tenant_id, category_id, supplier_id, name, description, unit,
      quantity, min_threshold, max_threshold, reorder_point, cost_per_unit, storage_location,
    ]);
    
    return result.insertId;
  }

  static async update(id, tenantId, data) {
    const allowedFields = [
      'category_id', 'supplier_id', 'name', 'description', 'unit',
      'quantity', 'min_threshold', 'max_threshold', 'reorder_point',
      'cost_per_unit', 'storage_location', 'is_active'
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
    const sql = `UPDATE inventory_items SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`;
    
    const result = await db.query(sql, params);
    return result.affectedRows > 0;
  }

  static async updateQuantity(id, tenantId, quantity) {
    const sql = 'UPDATE inventory_items SET quantity = ? WHERE id = ? AND tenant_id = ?';
    const result = await db.query(sql, [quantity, id, tenantId]);
    return result.affectedRows > 0;
  }

  static async delete(id, tenantId) {
    const sql = 'UPDATE inventory_items SET is_active = FALSE WHERE id = ? AND tenant_id = ?';
    const result = await db.query(sql, [id, tenantId]);
    return result.affectedRows > 0;
  }

  static async getLowStockItems(tenantId) {
    const sql = `
      SELECT ii.*, ic.name as category_name, s.name as supplier_name
      FROM inventory_items ii
      LEFT JOIN inventory_categories ic ON ii.category_id = ic.id
      LEFT JOIN suppliers s ON ii.supplier_id = s.id
      WHERE ii.tenant_id = ? AND ii.is_active = TRUE AND ii.quantity <= ii.min_threshold
      ORDER BY (ii.quantity / ii.min_threshold) ASC
    `;
    return await db.query(sql, [tenantId]);
  }
}

class InventoryTransaction {
  static async findById(id, tenantId) {
    const sql = `
      SELECT it.*, ii.name as item_name, u.first_name, u.last_name
      FROM inventory_transactions it
      JOIN inventory_items ii ON it.inventory_item_id = ii.id
      JOIN users u ON it.performed_by = u.id
      WHERE it.id = ? AND it.tenant_id = ?
    `;
    const rows = await db.query(sql, [id, tenantId]);
    return rows[0] || null;
  }

  static async findAll(tenantId, options = {}) {
    const { itemId, transactionType, startDate, endDate, limit = 50, offset = 0 } = options;
    
    let sql = `
      SELECT it.*, ii.name as item_name, u.first_name, u.last_name
      FROM inventory_transactions it
      JOIN inventory_items ii ON it.inventory_item_id = ii.id
      JOIN users u ON it.performed_by = u.id
      WHERE it.tenant_id = ?
    `;
    const params = [tenantId];
    
    if (itemId) {
      sql += ` AND it.inventory_item_id = ?`;
      params.push(itemId);
    }
    
    if (transactionType) {
      sql += ` AND it.transaction_type = ?`;
      params.push(transactionType);
    }
    
    if (startDate) {
      sql += ` AND DATE(it.created_at) >= ?`;
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ` AND DATE(it.created_at) <= ?`;
      params.push(endDate);
    }
    
    sql += ` ORDER BY it.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    return await db.query(sql, params);
  }

  static async create(data) {
    const {
      tenant_id,
      inventory_item_id,
      transaction_type,
      quantity,
      unit_cost,
      total_cost,
      reference_type,
      reference_id,
      notes,
      performed_by,
    } = data;

    const sql = `
      INSERT INTO inventory_transactions (tenant_id, inventory_item_id, transaction_type, quantity,
        unit_cost, total_cost, reference_type, reference_id, notes, performed_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await db.query(sql, [
      tenant_id, inventory_item_id, transaction_type, quantity,
      unit_cost, total_cost, reference_type, reference_id, notes, performed_by,
    ]);
    
    return result.insertId;
  }

  static async getStockValue(tenantId) {
    const sql = `
      SELECT 
        SUM(quantity * cost_per_unit) as total_value,
        COUNT(*) as total_items
      FROM inventory_items
      WHERE tenant_id = ? AND is_active = TRUE
    `;
    const rows = await db.query(sql, [tenantId]);
    return rows[0];
  }
}

class Supplier {
  static async findById(id, tenantId) {
    const sql = 'SELECT * FROM suppliers WHERE id = ? AND tenant_id = ?';
    const rows = await db.query(sql, [id, tenantId]);
    return rows[0] || null;
  }

  static async findAll(tenantId, options = {}) {
    const { isActive, limit = 50, offset = 0 } = options;
    
    let sql = 'SELECT * FROM suppliers WHERE tenant_id = ?';
    const params = [tenantId];
    
    if (isActive !== undefined) {
      sql += ` AND is_active = ?`;
      params.push(isActive);
    }
    
    sql += ` ORDER BY name LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    return await db.query(sql, params);
  }

  static async create(data) {
    const { tenant_id, name, contact_person, phone, email, address, gst_number, categories } = data;
    const sql = `
      INSERT INTO suppliers (tenant_id, name, contact_person, phone, email, address, gst_number, categories)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await db.query(sql, [tenant_id, name, contact_person, phone, email, address, gst_number, JSON.stringify(categories)]);
    return result.insertId;
  }

  static async update(id, tenantId, data) {
    const allowedFields = ['name', 'contact_person', 'phone', 'email', 'address', 'gst_number', 'categories', 'is_active'];
    
    const updates = [];
    const params = [];
    
    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        params.push(key === 'categories' ? JSON.stringify(value) : value);
      }
    }
    
    if (updates.length === 0) return false;
    
    params.push(id, tenantId);
    const sql = `UPDATE suppliers SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`;
    
    const result = await db.query(sql, params);
    return result.affectedRows > 0;
  }

  static async delete(id, tenantId) {
    const sql = 'UPDATE suppliers SET is_active = FALSE WHERE id = ? AND tenant_id = ?';
    const result = await db.query(sql, [id, tenantId]);
    return result.affectedRows > 0;
  }
}

module.exports = {
  InventoryCategory,
  InventoryItem,
  InventoryTransaction,
  Supplier,
};
