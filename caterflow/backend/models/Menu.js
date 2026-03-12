const db = require('../config/database');

class MenuCategory {
  static async findById(id, tenantId) {
    const sql = 'SELECT * FROM menu_categories WHERE id = ? AND tenant_id = ?';
    const rows = await db.query(sql, [id, tenantId]);
    return rows[0] || null;
  }

  static async findAll(tenantId) {
    if (tenantId) {
      const sql = 'SELECT * FROM menu_categories WHERE tenant_id = ? AND is_active = TRUE ORDER BY display_order, name';
      return await db.query(sql, [tenantId]);
    } else {
      const sql = 'SELECT * FROM menu_categories WHERE is_active = TRUE ORDER BY display_order, name';
      return await db.query(sql);
    }
  }

  static async create(data) {
    const { tenant_id, name, description, display_order = 0 } = data;
    const sql = 'INSERT INTO menu_categories (tenant_id, name, description, display_order) VALUES (?, ?, ?, ?)';
    const result = await db.query(sql, [tenant_id, name, description, display_order]);
    return result.insertId;
  }

  static async update(id, tenantId, data) {
    const { name, description, display_order, is_active } = data;
    const sql = 'UPDATE menu_categories SET name = ?, description = ?, display_order = ?, is_active = ? WHERE id = ? AND tenant_id = ?';
    const result = await db.query(sql, [name, description, display_order, is_active, id, tenantId]);
    return result.affectedRows > 0;
  }

  static async delete(id, tenantId) {
    const sql = 'UPDATE menu_categories SET is_active = FALSE WHERE id = ? AND tenant_id = ?';
    const result = await db.query(sql, [id, tenantId]);
    return result.affectedRows > 0;
  }
}

class MenuItem {
  static async findById(id, tenantId) {
    const sql = `
      SELECT mi.*, mc.name as category_name
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mi.category_id = mc.id
      WHERE mi.id = ? AND mi.tenant_id = ?
    `;
    const rows = await db.query(sql, [id, tenantId]);
    return rows[0] || null;
  }

  static async findAll(tenantId, options = {}) {
    const { categoryId, isActive, isVegetarian, search, limit = 50, offset = 0 } = options;
    
    let sql = `
      SELECT mi.*, mc.name as category_name
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mi.category_id = mc.id
    `;
    const params = [];
    
    if (tenantId) {
      sql += ` WHERE mi.tenant_id = ?`;
      params.push(tenantId);
    } else {
      sql += ` WHERE 1=1`;
    }
    
    if (categoryId) {
      sql += ` AND mi.category_id = ?`;
      params.push(categoryId);
    }
    
    if (isActive !== undefined && isActive !== null) {
      sql += ` AND mi.is_active = ?`;
      params.push(isActive);
    }
    
    if (isVegetarian !== undefined && isVegetarian !== null) {
      sql += ` AND mi.is_vegetarian = ?`;
      params.push(isVegetarian);
    }
    
    if (search) {
      sql += ` AND (mi.name LIKE ? OR mi.description LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }
    
    sql += ` ORDER BY mi.name LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    
    return await db.query(sql, params);
  }

  static async create(data) {
    const {
      tenant_id,
      category_id,
      name,
      description,
      price_per_plate,
      min_quantity = 1,
      ingredients,
      allergens,
      dietary_info,
      image_url,
      is_vegetarian = false,
      is_vegan = false,
      is_gluten_free = false,
      is_spicy = false,
      is_featured = false,
    } = data;

    const sql = `
      INSERT INTO menu_items (tenant_id, category_id, name, description, price_per_plate, min_quantity,
        ingredients, allergens, dietary_info, image_url, is_vegetarian, is_vegan, is_gluten_free, is_spicy, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await db.query(sql, [
      tenant_id, category_id, name, description, price_per_plate, min_quantity,
      ingredients, allergens, JSON.stringify(dietary_info), image_url,
      is_vegetarian, is_vegan, is_gluten_free, is_spicy, is_featured,
    ]);
    
    return result.insertId;
  }

  static async update(id, tenantId, data) {
    const allowedFields = [
      'category_id', 'name', 'description', 'price_per_plate', 'min_quantity',
      'ingredients', 'allergens', 'dietary_info', 'image_url',
      'is_vegetarian', 'is_vegan', 'is_gluten_free', 'is_spicy', 'is_active', 'is_featured'
    ];
    
    const updates = [];
    const params = [];
    
    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        params.push(key === 'dietary_info' ? JSON.stringify(value) : value);
      }
    }
    
    if (updates.length === 0) return false;
    
    params.push(id, tenantId);
    const sql = `UPDATE menu_items SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`;
    
    const result = await db.query(sql, params);
    return result.affectedRows > 0;
  }

  static async delete(id, tenantId) {
    const sql = 'UPDATE menu_items SET is_active = FALSE WHERE id = ? AND tenant_id = ?';
    const result = await db.query(sql, [id, tenantId]);
    return result.affectedRows > 0;
  }
}

class MenuPackage {
  static async findById(id, tenantId) {
    const sql = `
      SELECT mp.*, 
        GROUP_CONCAT(DISTINCT mi.id) as item_ids,
        GROUP_CONCAT(DISTINCT mi.name) as item_names
      FROM menu_packages mp
      LEFT JOIN menu_package_items mpi ON mp.id = mpi.package_id
      LEFT JOIN menu_items mi ON mpi.menu_item_id = mi.id
      WHERE mp.id = ? AND mp.tenant_id = ?
      GROUP BY mp.id
    `;
    const rows = await db.query(sql, [id, tenantId]);
    return rows[0] || null;
  }

  static async findAll(tenantId, options = {}) {
    const { isActive, limit = 50, offset = 0 } = options;
    
    let sql = `
      SELECT mp.*, 
        COUNT(DISTINCT mpi.menu_item_id) as item_count
      FROM menu_packages mp
      LEFT JOIN menu_package_items mpi ON mp.id = mpi.package_id
      WHERE mp.tenant_id = ?
    `;
    const params = [tenantId];
    
    if (isActive !== undefined) {
      sql += ` AND mp.is_active = ?`;
      params.push(isActive);
    }
    
    sql += ` GROUP BY mp.id ORDER BY mp.name LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    return await db.query(sql, params);
  }

  static async create(data) {
    const { tenant_id, name, description, package_type, base_price_per_plate, min_guests, items } = data;
    
    return await db.withTransaction(async (connection) => {
      // Create package
      const [packageResult] = await connection.execute(
        'INSERT INTO menu_packages (tenant_id, name, description, package_type, base_price_per_plate, min_guests) VALUES (?, ?, ?, ?, ?, ?)',
        [tenant_id, name, description, package_type, base_price_per_plate, min_guests]
      );
      
      const packageId = packageResult.insertId;
      
      // Add items if provided
      if (items && items.length > 0) {
        const itemValues = items.map(item => [packageId, item.menu_item_id, item.quantity || 1]);
        await connection.query(
          'INSERT INTO menu_package_items (package_id, menu_item_id, quantity) VALUES ?',
          [itemValues]
        );
      }
      
      return packageId;
    });
  }

  static async update(id, tenantId, data) {
    const { name, description, base_price_per_plate, min_guests, is_active, items } = data;
    
    return await db.withTransaction(async (connection) => {
      // Update package
      await connection.execute(
        'UPDATE menu_packages SET name = ?, description = ?, base_price_per_plate = ?, min_guests = ?, is_active = ? WHERE id = ? AND tenant_id = ?',
        [name, description, base_price_per_plate, min_guests, is_active, id, tenantId]
      );
      
      // Update items if provided
      if (items) {
        await connection.execute('DELETE FROM menu_package_items WHERE package_id = ?', [id]);
        
        if (items.length > 0) {
          const itemValues = items.map(item => [id, item.menu_item_id, item.quantity || 1]);
          await connection.query(
            'INSERT INTO menu_package_items (package_id, menu_item_id, quantity) VALUES ?',
            [itemValues]
          );
        }
      }
      
      return true;
    });
  }

  static async delete(id, tenantId) {
    const sql = 'UPDATE menu_packages SET is_active = FALSE WHERE id = ? AND tenant_id = ?';
    const result = await db.query(sql, [id, tenantId]);
    return result.affectedRows > 0;
  }

  static async getItems(packageId, tenantId) {
    const sql = `
      SELECT mi.*, mpi.quantity
      FROM menu_items mi
      JOIN menu_package_items mpi ON mi.id = mpi.menu_item_id
      WHERE mpi.package_id = ? AND mi.tenant_id = ?
    `;
    return await db.query(sql, [packageId, tenantId]);
  }
}

module.exports = {
  MenuCategory,
  MenuItem,
  MenuPackage,
};
