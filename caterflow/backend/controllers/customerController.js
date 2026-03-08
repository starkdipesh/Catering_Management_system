const Customer = require('../models/Customer');
const { parsePagination } = require('../utils/helpers');

class CustomerController {
  /**
   * Get all customers
   */
  async getAll(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { search, customer_type, is_active, sort_by, sort_order } = req.query;
      const { page, limit, offset } = parsePagination(req.query);

      const options = {
        search,
        customerType: customer_type,
        isActive: is_active !== undefined ? is_active === 'true' : undefined,
        limit,
        offset,
        sortBy: sort_by,
        sortOrder: sort_order,
      };

      const [customers, total] = await Promise.all([
        Customer.findAll(tenantId, options),
        Customer.count(tenantId, options),
      ]);

      res.json({
        success: true,
        data: customers,
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
   * Get customer by ID
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const customer = await Customer.findById(id, tenantId);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found',
        });
      }

      res.json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new customer
   */
  async create(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const {
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
        country,
        customer_type,
        company_name,
        gst_number,
        notes,
        dietary_preferences,
      } = req.body;

      const customerId = await Customer.create({
        tenant_id: tenantId,
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
        country,
        customer_type,
        company_name,
        gst_number,
        notes,
        dietary_preferences,
      });

      const customer = await Customer.findById(customerId, tenantId);

      res.status(201).json({
        success: true,
        message: 'Customer created successfully',
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update customer
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const existingCustomer = await Customer.findById(id, tenantId);
      if (!existingCustomer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found',
        });
      }

      const updated = await Customer.update(id, tenantId, req.body);

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'No changes made',
        });
      }

      const customer = await Customer.findById(id, tenantId);

      res.json({
        success: true,
        message: 'Customer updated successfully',
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete customer (soft delete)
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const customer = await Customer.findById(id, tenantId);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found',
        });
      }

      const deleted = await Customer.delete(id, tenantId);

      if (!deleted) {
        return res.status(400).json({
          success: false,
          message: 'Failed to delete customer',
        });
      }

      res.json({
        success: true,
        message: 'Customer deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get customer event history
   */
  async getEventHistory(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const customer = await Customer.findById(id, tenantId);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found',
        });
      }

      const events = await Customer.getEventHistory(id, tenantId);

      res.json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search customers
   */
  async search(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { q } = req.query;

      if (!q || q.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters',
        });
      }

      const customers = await Customer.findAll(tenantId, {
        search: q,
        limit: 20,
      });

      res.json({
        success: true,
        data: customers,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CustomerController();
