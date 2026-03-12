const bcrypt = require('bcrypt');
const db = require('../config/database');

class User {
  static async findByEmail(email, tenantId = null) {
    let sql = 'SELECT * FROM users WHERE email = ?';
    const params = [email];
    
    if (tenantId) {
      sql += ' AND (tenant_id = ? OR role = "super_admin")';
      params.push(tenantId);
    }
    
    const rows = await db.query(sql, params);
    return rows[0] || null;
  }

  static async findById(id) {
    const sql = `
      SELECT u.*, t.business_name as tenant_name, t.tenant_id as tenant_code
      FROM users u
      LEFT JOIN tenants t ON u.tenant_id = t.id
      WHERE u.id = ?
    `;
    const rows = await db.query(sql, [id]);
    return rows[0] || null;
  }

  static async findByTenant(tenantId, options = {}) {
    const { role, isActive, limit = 50, offset = 0 } = options;
    let sql = 'SELECT * FROM users';
    const params = [];
    
    if (tenantId) {
      sql += ' WHERE tenant_id = ?';
      params.push(tenantId);
    } else {
      sql += ' WHERE 1=1';
    }
    
    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }
    
    if (isActive !== undefined && isActive !== null) {
      sql += ' AND is_active = ?';
      params.push(isActive);
    }
    
    sql += ` ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    
    return await db.query(sql, params);
  }

  static async create(data) {
    const {
      tenant_id,
      email,
      password,
      first_name,
      last_name,
      phone,
      role = 'staff',
      is_active = true,
    } = data;

    const password_hash = await bcrypt.hash(password, 10);
    
    const sql = `
      INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const result = await db.query(sql, [
      tenant_id,
      email,
      password_hash,
      first_name,
      last_name,
      phone,
      role,
      is_active,
    ]);
    
    return result.insertId;
  }

  static async update(id, data) {
    const allowedFields = ['first_name', 'last_name', 'phone', 'role', 'is_active', 'avatar_url'];
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
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    
    const result = await db.query(sql, params);
    return result.affectedRows > 0;
  }

  static async updatePassword(id, newPassword) {
    const password_hash = await bcrypt.hash(newPassword, 10);
    const sql = 'UPDATE users SET password_hash = ? WHERE id = ?';
    const result = await db.query(sql, [password_hash, id]);
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const sql = 'UPDATE users SET is_active = FALSE WHERE id = ?';
    const result = await db.query(sql, [id]);
    return result.affectedRows > 0;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateLastLogin(id, ip) {
    const sql = 'UPDATE users SET last_login_at = NOW(), last_login_ip = ? WHERE id = ?';
    await db.query(sql, [ip, id]);
  }
}

module.exports = User;
