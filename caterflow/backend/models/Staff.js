const db = require('../config/database');

class Staff {
  /**
   * Create staff details
   */
  static async createDetails(data) {
    const sql = `
      INSERT INTO staff_details (
        user_id, tenant_id, employee_code, designation, department,
        joining_date, salary, payment_frequency, id_proof_type, id_proof_number,
        id_proof_url, skills, certifications, is_full_time, available_days,
        unavailable_dates, emergency_contact_name, emergency_contact_phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      data.user_id,
      data.tenant_id,
      data.employee_code,
      data.designation,
      data.department,
      data.joining_date,
      data.salary,
      data.payment_frequency || 'monthly',
      data.id_proof_type,
      data.id_proof_number,
      data.id_proof_url,
      JSON.stringify(data.skills || []),
      JSON.stringify(data.certifications || []),
      data.is_full_time !== undefined ? data.is_full_time : true,
      JSON.stringify(data.available_days || []),
      JSON.stringify(data.unavailable_dates || []),
      data.emergency_contact_name,
      data.emergency_contact_phone,
    ];

    const result = await db.query(sql, params);
    return result.insertId;
  }

  /**
   * Find staff details by user ID
   */
  static async findDetailsByUserId(userId, tenantId) {
    const sql = `
      SELECT 
        sd.*,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.is_active,
        u.role
      FROM staff_details sd
      JOIN users u ON sd.user_id = u.id
      WHERE sd.user_id = ? AND sd.tenant_id = ?
    `;
    
    const rows = await db.query(sql, [userId, tenantId]);
    return rows[0] || null;
  }

  /**
   * Get all staff for tenant
   */
  static async findAllByTenant(tenantId, options = {}) {
    const { 
      department, 
      is_full_time, 
      is_active = true, 
      limit = 50, 
      offset = 0 
    } = options;

    let sql = `
      SELECT 
        sd.*,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.is_active as user_active
      FROM staff_details sd
      JOIN users u ON sd.user_id = u.id
      WHERE sd.tenant_id = ?
    `;
    
    const params = [tenantId];

    if (is_active !== undefined) {
      sql += ' AND u.is_active = ?';
      params.push(is_active);
    }

    if (department) {
      sql += ' AND sd.department = ?';
      params.push(department);
    }

    if (is_full_time !== undefined) {
      sql += ' AND sd.is_full_time = ?';
      params.push(is_full_time);
    }

    sql += ' ORDER BY u.first_name, u.last_name LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    return await db.query(sql, params);
  }

  /**
   * Update staff details
   */
  static async updateDetails(userId, tenantId, data) {
    const allowedFields = [
      'employee_code', 'designation', 'department', 'joining_date',
      'salary', 'payment_frequency', 'id_proof_type', 'id_proof_number',
      'id_proof_url', 'skills', 'certifications', 'is_full_time',
      'available_days', 'unavailable_dates', 'emergency_contact_name',
      'emergency_contact_phone'
    ];

    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (field === 'skills' || field === 'certifications' || 
            field === 'available_days' || field === 'unavailable_dates') {
          updates.push(`${field} = ?`);
          values.push(JSON.stringify(data[field]));
        } else {
          updates.push(`${field} = ?`);
          values.push(data[field]);
        }
      }
    }

    if (updates.length === 0) return false;

    values.push(userId, tenantId);

    const sql = `UPDATE staff_details SET ${updates.join(', ')} WHERE user_id = ? AND tenant_id = ?`;
    const result = await db.query(sql, values);
    return result.affectedRows > 0;
  }

  /**
   * Delete staff details
   */
  static async deleteDetails(userId, tenantId) {
    const sql = 'DELETE FROM staff_details WHERE user_id = ? AND tenant_id = ?';
    const result = await db.query(sql, [userId, tenantId]);
    return result.affectedRows > 0;
  }

  // ==================== STAFF ASSIGNMENTS ====================

  /**
   * Assign staff to event
   */
  static async createAssignment(data) {
    const sql = `
      INSERT INTO staff_assignments (
        event_id, staff_id, tenant_id, role_at_event, assigned_tasks,
        start_time, end_time, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      data.event_id,
      data.staff_id,
      data.tenant_id,
      data.role_at_event,
      data.assigned_tasks,
      data.start_time,
      data.end_time,
      data.status || 'assigned',
      data.notes,
    ];

    const result = await db.query(sql, params);
    return result.insertId;
  }

  /**
   * Get staff assignments for an event
   */
  static async getEventAssignments(eventId, tenantId) {
    const sql = `
      SELECT 
        sa.*,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        sd.designation,
        sd.department
      FROM staff_assignments sa
      JOIN users u ON sa.staff_id = u.id
      LEFT JOIN staff_details sd ON sa.staff_id = sd.user_id
      WHERE sa.event_id = ? AND sa.tenant_id = ?
      ORDER BY sa.start_time
    `;
    
    return await db.query(sql, [eventId, tenantId]);
  }

  /**
   * Get assignments for a staff member
   */
  static async getStaffAssignments(staffId, tenantId, options = {}) {
    const { start_date, end_date, status } = options;
    
    let sql = `
      SELECT 
        sa.*,
        e.event_name,
        e.event_date,
        e.event_time,
        e.venue_name,
        e.guest_count,
        e.status as event_status
      FROM staff_assignments sa
      JOIN events e ON sa.event_id = e.id
      WHERE sa.staff_id = ? AND sa.tenant_id = ?
    `;
    
    const params = [staffId, tenantId];

    if (start_date) {
      sql += ' AND e.event_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND e.event_date <= ?';
      params.push(end_date);
    }

    if (status) {
      sql += ' AND sa.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY e.event_date DESC';

    return await db.query(sql, params);
  }

  /**
   * Update assignment
   */
  static async updateAssignment(assignmentId, tenantId, data) {
    const allowedFields = [
      'role_at_event', 'assigned_tasks', 'start_time', 
      'end_time', 'status', 'notes'
    ];

    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (updates.length === 0) return false;

    values.push(assignmentId, tenantId);

    const sql = `UPDATE staff_assignments SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`;
    const result = await db.query(sql, values);
    return result.affectedRows > 0;
  }

  /**
   * Remove assignment
   */
  static async deleteAssignment(assignmentId, tenantId) {
    const sql = 'DELETE FROM staff_assignments WHERE id = ? AND tenant_id = ?';
    const result = await db.query(sql, [assignmentId, tenantId]);
    return result.affectedRows > 0;
  }

  /**
   * Get staff availability
   */
  static async getAvailability(staffId, tenantId, date) {
    const sql = `
      SELECT 
        sa.*,
        e.event_name,
        e.event_time
      FROM staff_assignments sa
      JOIN events e ON sa.event_id = e.id
      WHERE sa.staff_id = ? 
        AND sa.tenant_id = ?
        AND e.event_date = ?
        AND sa.status NOT IN ('cancelled', 'completed')
    `;
    
    return await db.query(sql, [staffId, tenantId, date]);
  }

  /**
   * Get staff workload stats
   */
  static async getWorkloadStats(staffId, tenantId, days = 30) {
    const sql = `
      SELECT 
        COUNT(DISTINCT sa.id) as total_assignments,
        COUNT(DISTINCT CASE WHEN sa.status = 'completed' THEN sa.id END) as completed,
        COUNT(DISTINCT CASE WHEN sa.status IN ('assigned', 'confirmed') THEN sa.id END) as upcoming,
        SUM(TIMESTAMPDIFF(HOUR, sa.start_time, sa.end_time)) as total_hours
      FROM staff_assignments sa
      JOIN events e ON sa.event_id = e.id
      WHERE sa.staff_id = ? 
        AND sa.tenant_id = ?
        AND e.event_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `;
    
    const rows = await db.query(sql, [staffId, tenantId, days]);
    return rows[0];
  }

  /**
   * Check for scheduling conflicts
   */
  static async checkConflicts(staffId, tenantId, startTime, endTime, excludeAssignmentId = null) {
    let sql = `
      SELECT 
        sa.*,
        e.event_name,
        e.event_date
      FROM staff_assignments sa
      JOIN events e ON sa.event_id = e.id
      WHERE sa.staff_id = ? 
        AND sa.tenant_id = ?
        AND sa.status NOT IN ('cancelled', 'completed')
        AND (
          (sa.start_time <= ? AND sa.end_time > ?) OR
          (sa.start_time < ? AND sa.end_time >= ?) OR
          (sa.start_time >= ? AND sa.end_time <= ?)
        )
    `;
    
    const params = [
      staffId, tenantId,
      endTime, startTime,
      endTime, endTime,
      startTime, endTime
    ];

    if (excludeAssignmentId) {
      sql += ' AND sa.id != ?';
      params.push(excludeAssignmentId);
    }

    return await db.query(sql, params);
  }
}

module.exports = Staff;
