const { Invoice, Payment } = require('../models/Invoice');
const Event = require('../models/Event');
const { parsePagination, calculateInvoiceTotals, formatDate } = require('../utils/helpers');

class InvoiceController {
  /**
   * Get all invoices
   */
  async getAll(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { status, customer_id, overdue, start_date, end_date, search, page, limit } = req.query;
      const pagination = parsePagination({ page, limit });

      const options = {
        status,
        customerId: customer_id,
        overdue: overdue === 'true',
        startDate: start_date,
        endDate: end_date,
        search,
        limit: pagination.limit,
        offset: pagination.offset,
      };

      const [invoices, total] = await Promise.all([
        Invoice.findAll(tenantId, options),
        Invoice.count(tenantId, options),
      ]);

      res.json({
        success: true,
        data: invoices,
        meta: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          pages: Math.ceil(total / pagination.limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get invoice by ID
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const invoice = await Invoice.findById(id, tenantId);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found',
        });
      }

      // Get invoice items
      const items = await Invoice.getItems(id, tenantId);

      res.json({
        success: true,
        data: {
          ...invoice,
          items,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create invoice from event
   */
  async create(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { event_id, invoice_date, due_date, notes, items, discount_amount = 0, tax_rate = 18 } = req.body;

      // Get event details
      const event = await Event.findById(event_id, tenantId);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Event not found',
        });
      }

      // Calculate totals
      const { subtotal, tax_amount, total_amount } = calculateInvoiceTotals(items, discount_amount, tax_rate);

      const invoiceId = await Invoice.create({
        tenant_id: tenantId,
        event_id,
        customer_id: event.customer_id,
        invoice_date,
        due_date: due_date || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Default 15 days
        subtotal,
        discount_amount,
        tax_rate,
        tax_amount,
        total_amount,
        notes,
        items,
      });

      // Update event payment status
      await Event.update(event_id, tenantId, { payment_status: 'pending' });

      const invoice = await Invoice.findById(invoiceId, tenantId);

      res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update invoice
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const existingInvoice = await Invoice.findById(id, tenantId);
      if (!existingInvoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found',
        });
      }

      // Don't allow updating paid invoices
      if (existingInvoice.status === 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Cannot update a paid invoice',
        });
      }

      const updated = await Invoice.update(id, tenantId, req.body);

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: 'No changes made',
        });
      }

      const invoice = await Invoice.findById(id, tenantId);

      res.json({
        success: true,
        message: 'Invoice updated successfully',
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete invoice
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const invoice = await Invoice.findById(id, tenantId);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found',
        });
      }

      if (invoice.status === 'paid') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete a paid invoice',
        });
      }

      const deleted = await Invoice.delete(id, tenantId);

      if (!deleted) {
        return res.status(400).json({
          success: false,
          message: 'Failed to delete invoice',
        });
      }

      res.json({
        success: true,
        message: 'Invoice cancelled successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get invoice statistics
   */
  async getStats(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const stats = await Invoice.getStats(tenantId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download invoice as PDF
   */
  async downloadPDF(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const invoice = await Invoice.findById(id, tenantId);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Invoice not found',
        });
      }

      // For now, return JSON with invoice data
      // In production, generate PDF using library like puppeteer or pdfkit
      const items = await Invoice.getItems(id, tenantId);

      res.json({
        success: true,
        message: 'PDF generation to be implemented',
        data: {
          ...invoice,
          items,
          generatedAt: new Date(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== PAYMENTS ====================

  /**
   * Get all payments
   */
  async getPayments(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { invoice_id, customer_id, payment_method, status, start_date, end_date, page, limit } = req.query;
      const pagination = parsePagination({ page, limit });

      const options = {
        invoiceId: invoice_id,
        customerId: customer_id,
        paymentMethod: payment_method,
        status,
        startDate: start_date,
        endDate: end_date,
        limit: pagination.limit,
        offset: pagination.offset,
      };

      const payments = await Payment.findAll(tenantId, options);

      res.json({
        success: true,
        data: payments,
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
   * Create payment
   */
  async createPayment(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const userId = req.user.id;

      const {
        invoice_id,
        customer_id,
        event_id,
        amount,
        payment_method,
        payment_date,
        reference_number,
        transaction_id,
        notes,
      } = req.body;

      // Validate invoice exists
      if (invoice_id) {
        const invoice = await Invoice.findById(invoice_id, tenantId);
        if (!invoice) {
          return res.status(404).json({
            success: false,
            message: 'Invoice not found',
          });
        }

        // Check if amount exceeds due amount
        if (amount > invoice.amount_due) {
          return res.status(400).json({
            success: false,
            message: 'Payment amount exceeds invoice amount due',
            amountDue: invoice.amount_due,
          });
        }
      }

      const paymentId = await Payment.create({
        tenant_id: tenantId,
        invoice_id,
        customer_id,
        event_id,
        amount,
        payment_method,
        payment_date,
        reference_number,
        transaction_id,
        notes,
        received_by: userId,
      });

      // Update invoice payment status
      if (invoice_id) {
        await Invoice.updatePaymentStatus(invoice_id, tenantId);
      }

      // Update event payment status
      if (event_id) {
        const event = await Event.findById(event_id, tenantId);
        if (event) {
          const payments = await Payment.findAll(tenantId, { eventId: event_id, status: 'completed' });
          const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
          
          let paymentStatus = 'pending';
          if (totalPaid >= event.final_amount) {
            paymentStatus = 'paid';
          } else if (totalPaid > 0) {
            paymentStatus = 'partial';
          }
          
          await Event.update(event_id, tenantId, { payment_status: paymentStatus });
        }
      }

      const payment = await Payment.findById(paymentId, tenantId);

      res.status(201).json({
        success: true,
        message: 'Payment recorded successfully',
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { start_date, end_date } = req.query;

      const stats = await Payment.getStats(tenantId, {
        startDate: start_date,
        endDate: end_date,
      });

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InvoiceController();
