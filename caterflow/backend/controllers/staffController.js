const Staff = require('../models/Staff');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const { parsePagination } = require('../utils/helpers');

class StaffController {
  /**
   * Get all staff members
   */
  async getAll(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { department, is_full_time, is_active, page, limit } = req.query;
      const pagination = parsePagination({ page, limit });

      const options = {
        department,
        isFullTime: is_full_time !== undefined ? is_full_time === 'true' : undefined,
        isActive: is_active !== undefined ? is_active === 'true' : true,
        limit: pagination.limit,
        offset: pagination.offset,
      };

      const staff = await Staff.findAllByTenant(tenantId, options);

      res.json({
        success: true,
        data: staff,
        meta: {
          page: pagination.page,
          limit: pagination.limit,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get staff member by ID
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const staff = await Staff.findDetailsByUserId(id, tenantId);

      if (!staff) {
        return res.status(404).json({
          success: false,
          message: 'Staff member not found',
        });
      }

      // Get workload stats
      const stats = await Staff.getWorkloadStats(id, tenantId);

      res.json({
        success: true,
        data: {
          ...staff,
          workloadStats: stats,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new staff member
   */
  async create(req, res, next) {
    try {
      const tenantId = req.tenantId;

      // Check staff limit for the tenant
      const limitCheck = await Tenant.checkStaffLimit(tenantId);
      if (!limitCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: `Staff limit reached. Current plan allows ${limitCheck.limit} staff members.`,
          code: 'STAFF_LIMIT_REACHED',
        });
      }

      const {
        email,
        password,
        first_name,
        last_name,
        phone,
        employee_code,
        designation,
        department,
        joining_date,
        salary,
        skills,
        is_full_time,
      } = req.body;

      // Check if email already exists
      const existingUser = await User.findByEmail(email, tenantId);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'A user with this email already exists',
        });
      }

      // Create user first
      const userId = await User.create({
        tenant_id: tenantId,
        email,
        password: password || 'TempPass123!',
        first_name,
        last_name,
        phone,
        role: 'staff',
        is_active: true,
      });

      // Create staff details
      await Staff.createDetails({
        user_id: userId,
        tenant_id: tenantId,
        employee_code,
        designation,
        department,
        joining_date,
        salary,
        skills,
        is_full_time,
      });

      const staff = await Staff.findDetailsByUserId(userId, tenantId);

      res.status(201).json({
        success: true,
        message: 'Staff member created successfully',
        data: staff,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update staff member
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const staff = await Staff.findDetailsByUserId(id, tenantId);
      if (!staff) {
        return res.status(404).json({
          success: false,
          message: 'Staff member not found',
        });
      }

      const {
        first_name,
        last_name,
        phone,
        is_active,
        employee_code,
        designation,
        department,
        joining_date,
        salary,
        skills,
        is_full_time,
      } = req.body;

      // Update user details
      await User.update(id, {
        first_name,
        last_name,
        phone,
        is_active,
      });

      // Update staff details
      await Staff.updateDetails(id, tenantId, {
        employee_code,
        designation,
        department,
        joining_date,
        salary,
        skills,
        is_full_time,
      });

      const updatedStaff = await Staff.findDetailsByUserId(id, tenantId);

      res.json({
        success: true,
        message: 'Staff member updated successfully',
        data: updatedStaff,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete staff member
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const staff = await Staff.findDetailsByUserId(id, tenantId);
      if (!staff) {
        return res.status(404).json({
          success: false,
          message: 'Staff member not found',
        });
      }

      // Delete staff details first
      await Staff.deleteDetails(id, tenantId);
      
      // Soft delete user
      await User.delete(id);

      res.json({
        success: true,
        message: 'Staff member removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get staff assignments
   */
  async getAssignments(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      const { start_date, end_date, status } = req.query;

      const assignments = await Staff.getStaffAssignments(id, tenantId, {
        start_date,
        end_date,
        status,
      });

      res.json({
        success: true,
        data: assignments,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get staff availability for a date
   */
  async getAvailability(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Date parameter is required',
        });
      }

      const availability = await Staff.getAvailability(id, tenantId, date);

      res.json({
        success: true,
        data: availability,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign staff to event
   */
  async assignToEvent(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { staff_id, event_id, role_at_event, assigned_tasks, start_time, end_time, notes } = req.body;

      // Check for conflicts
      const conflicts = await Staff.checkConflicts(staff_id, tenantId, start_time, end_time);
      if (conflicts.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Staff member has a scheduling conflict',
          conflicts,
        });
      }

      const assignmentId = await Staff.createAssignment({
        tenant_id: tenantId,
        staff_id,
        event_id,
        role_at_event,
        assigned_tasks,
        start_time,
        end_time,
        notes,
      });

      const assignment = await Staff.getEventAssignments(event_id, tenantId);
      const created = assignment.find(a => a.id === assignmentId);

      res.status(201).json({
        success: true,
        message: 'Staff assigned to event successfully',
        data: created,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update staff assignment
   */
  async updateAssignment(req, res, next) {
    try {
      const { assignmentId } = req.params;
      const tenantId = req.tenantId;
      const { role_at_event, assigned_tasks, start_time, end_time, status, notes } = req.body;

      // If time changed, check for conflicts
      if (start_time && end_time) {
        const assignment = await Staff.getEventAssignments(0, tenantId);
        const current = assignment.find(a => a.id === parseInt(assignmentId));
        
        if (current) {
          const conflicts = await Staff.checkConflicts(
            current.staff_id, 
            tenantId, 
            start_time, 
            end_time,
            assignmentId
          );
          
          if (conflicts.length > 0) {
            return res.status(409).json({
              success: false,
              message: 'Staff member has a scheduling conflict',
              conflicts,
            });
          }
        }
      }

      await Staff.updateAssignment(assignmentId, tenantId, {
        role_at_event,
        assigned_tasks,
        start_time,
        end_time,
        status,
        notes,
      });

      res.json({
        success: true,
        message: 'Assignment updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove staff from event
   */
  async removeAssignment(req, res, next) {
    try {
      const { assignmentId } = req.params;
      const tenantId = req.tenantId;

      await Staff.deleteAssignment(assignmentId, tenantId);

      res.json({
        success: true,
        message: 'Staff removed from event successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get event assignments
   */
  async getEventStaff(req, res, next) {
    try {
      const { eventId } = req.params;
      const tenantId = req.tenantId;

      const assignments = await Staff.getEventAssignments(eventId, tenantId);

      res.json({
        success: true,
        data: assignments,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StaffController();
