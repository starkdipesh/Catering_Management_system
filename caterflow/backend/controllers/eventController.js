const Event = require('../models/Event');
const Customer = require('../models/Customer');
const Tenant = require('../models/Tenant');
const { parsePagination, calculateEventTotals } = require('../utils/helpers');

class EventController {
  /**
   * Get all events
   */
  async getAll(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { 
        status, 
        event_type, 
        customer_id,
        start_date,
        end_date,
        upcoming,
        search,
        sort_by,
        sort_order
      } = req.query;
      const { page, limit, offset } = parsePagination(req.query);

      const options = {
        status,
        eventType: event_type,
        customerId: customer_id,
        startDate: start_date,
        endDate: end_date,
        upcoming: upcoming === 'true',
        search,
        limit,
        offset,
        sortBy: sort_by,
        sortOrder: sort_order,
      };

      const [events, total] = await Promise.all([
        Event.findAll(tenantId, options),
        Event.count(tenantId, options),
      ]);

      res.json({
        success: true,
        data: events,
        meta: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get event by ID
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const event = await Event.findById(id, tenantId);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
        });
      }

      res.json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new event
   */
  async create(req, res, next) {
    try {
      const tenantId = req.tenantId;
      
      // Check event limit for the tenant
      const limitCheck = await Tenant.checkEventLimit(tenantId);
      if (!limitCheck.allowed) {
        return res.status(403).json({
          success: false,
          message: `Event limit reached. Current plan allows ${limitCheck.limit} events per month.`,
          code: 'EVENT_LIMIT_REACHED',
          current: limitCheck.current,
          limit: limitCheck.limit,
        });
      }

      const {
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
        discount_amount = 0,
        tax_rate = 18,
        assigned_manager_id,
        notes,
        special_requests,
      } = req.body;

      // Verify customer exists
      const customer = await Customer.findById(customer_id, tenantId);
      if (!customer) {
        return res.status(400).json({
          success: false,
          message: 'Customer not found',
        });
      }

      // Calculate totals
      const total_amount = guest_count * price_per_plate;
      const tax_amount = (total_amount - discount_amount) * (tax_rate / 100);
      const final_amount = total_amount - discount_amount + tax_amount;

      const eventId = await Event.create({
        tenant_id: tenantId,
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
        discount_amount,
        tax_amount,
        final_amount,
        assigned_manager_id,
        notes,
        special_requests,
      });

      // Update customer stats
      await Customer.updateStats(customer_id, tenantId);

      const event = await Event.findById(eventId, tenantId);

      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update event
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const existingEvent = await Event.findById(id, tenantId);
      if (!existingEvent) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
        });
      }

      const updateData = { ...req.body };

      // Recalculate totals if relevant fields changed
      if (req.body.guest_count || req.body.price_per_plate || req.body.discount_amount || req.body.tax_rate) {
        const guest_count = req.body.guest_count || existingEvent.guest_count;
        const price_per_plate = req.body.price_per_plate || existingEvent.price_per_plate;
        const discount_amount = req.body.discount_amount !== undefined ? req.body.discount_amount : existingEvent.discount_amount;
        const tax_rate = req.body.tax_rate || existingEvent.tax_rate;

        const total_amount = guest_count * price_per_plate;
        const tax_amount = (total_amount - discount_amount) * (tax_rate / 100);
        const final_amount = total_amount - discount_amount + tax_amount;

        updateData.total_amount = total_amount;
        updateData.tax_amount = tax_amount;
        updateData.final_amount = final_amount;
      }

      const updated = await Event.update(id, tenantId, updateData);

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'No changes made',
        });
      }

      // Update customer stats if customer changed
      if (req.body.customer_id && req.body.customer_id !== existingEvent.customer_id) {
        await Customer.updateStats(existingEvent.customer_id, tenantId);
        await Customer.updateStats(req.body.customer_id, tenantId);
      }

      const event = await Event.findById(id, tenantId);

      res.json({
        success: true,
        message: 'Event updated successfully',
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete event
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const event = await Event.findById(id, tenantId);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
        });
      }

      const deleted = await Event.delete(id, tenantId);

      if (!deleted) {
        return res.status(400).json({
          success: false,
          message: 'Failed to delete event',
        });
      }

      // Update customer stats
      await Customer.updateStats(event.customer_id, tenantId);

      res.json({
        success: true,
        message: 'Event deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get events by date range (for calendar)
   */
  async getByDateRange(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { start_date, end_date } = req.query;

      if (!start_date || !end_date) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required',
        });
      }

      const events = await Event.getByDateRange(tenantId, start_date, end_date);

      res.json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get event statistics
   */
  async getStats(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { start_date, end_date } = req.query;

      const stats = await Event.getStats(tenantId, {
        startDate: start_date,
        endDate: end_date,
      });

      const eventTypes = await Event.getEventTypesDistribution(tenantId);
      const monthlyRevenue = await Event.getMonthlyRevenue(tenantId, 12);

      res.json({
        success: true,
        data: {
          ...stats,
          eventTypes,
          monthlyRevenue,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update event status
   */
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;
      const { status } = req.body;

      const validStatuses = ['inquiry', 'quoted', 'confirmed', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status',
          validStatuses,
        });
      }

      const existingEvent = await Event.findById(id, tenantId);
      if (!existingEvent) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
        });
      }

      const updated = await Event.update(id, tenantId, { status });

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'Failed to update status',
        });
      }

      const event = await Event.findById(id, tenantId);

      res.json({
        success: true,
        message: 'Status updated successfully',
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EventController();
