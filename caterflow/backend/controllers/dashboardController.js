const Tenant = require('../models/Tenant');
const Event = require('../models/Event');
const Customer = require('../models/Customer');
const { Invoice, Payment } = require('../models/Invoice');
const { InventoryItem } = require('../models/Inventory');
const User = require('../models/User');

class DashboardController {
  /**
   * Get dashboard statistics
   */
  async getStats(req, res, next) {
    try {
      const tenantId = req.tenantId;
      
      // Get basic counts
      const totalEvents = await Event.count(tenantId);
      const totalCustomers = await Customer.count(tenantId);
      const totalUsers = await User.findByTenant(tenantId, { limit: 1000 });
      const totalInvoices = await Invoice.count(tenantId);
      
      // Get upcoming events (next 7 days)
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const upcomingEvents = await Event.findAll(tenantId, {
        startDate: today,
        endDate: nextWeek,
        limit: 5,
      });
      
      // Get low stock items
      const lowStockItems = await InventoryItem.findAll(tenantId, {
        lowStock: true,
        limit: 10,
      });

      res.json({
        success: true,
        data: {
          stats: {
            totalEvents,
            totalCustomers,
            totalUsers: totalUsers.length,
            totalInvoices,
            upcomingEvents: upcomingEvents.length,
            lowStockItems: lowStockItems.length,
          },
          upcomingEvents,
          lowStockItems,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get calendar events
   */
  async getCalendarEvents(req, res, next) {
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

      // Format for calendar
      const calendarEvents = events.map(event => ({
        id: event.id,
        title: event.event_name,
        start: `${event.event_date}T${event.event_time || '00:00:00'}`,
        end: event.duration_hours 
          ? new Date(new Date(`${event.event_date}T${event.event_time || '00:00:00'}`).getTime() + event.duration_hours * 60 * 60 * 1000).toISOString()
          : null,
        status: event.status,
        customer: `${event.first_name} ${event.last_name}`,
        venue: event.venue_name,
        guestCount: event.guest_count,
      }));

      res.json({
        success: true,
        data: calendarEvents,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get notifications
   */
  async getNotifications(req, res, next) {
    try {
      const tenantId = req.tenantId;
      
      const notifications = [];
      
      // Get upcoming events for next 3 days
      const today = new Date();
      const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      
      const upcomingEvents = await Event.findAll(tenantId, {
        startDate: today.toISOString().split('T')[0],
        endDate: threeDaysLater.toISOString().split('T')[0],
        status: 'confirmed',
        limit: 10,
      });
      
      upcomingEvents.forEach(event => {
        const eventDate = new Date(event.event_date);
        const daysDiff = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
        
        notifications.push({
          type: 'event',
          priority: daysDiff <= 1 ? 'high' : 'medium',
          title: `Upcoming Event: ${event.event_name}`,
          message: `Event for ${event.guest_count} guests at ${event.venue_name}`,
          date: event.event_date,
          daysRemaining: daysDiff,
          link: `/events/${event.id}`,
        });
      });
      
      // Get low stock alerts
      const lowStockItems = await InventoryItem.getLowStockItems(tenantId);
      
      if (lowStockItems.length > 0) {
        notifications.push({
          type: 'inventory',
          priority: 'high',
          title: 'Low Stock Alert',
          message: `${lowStockItems.length} items are below minimum threshold`,
          count: lowStockItems.length,
          link: '/inventory?low_stock=true',
        });
      }
      
      // Get overdue invoices
      const overdueInvoices = await Invoice.findAll(tenantId, {
        overdue: true,
        limit: 10,
      });
      
      if (overdueInvoices.length > 0) {
        const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount_due), 0);
        
        notifications.push({
          type: 'invoice',
          priority: 'high',
          title: 'Overdue Invoices',
          message: `${overdueInvoices.length} invoices overdue with ${totalOverdue.toFixed(2)} outstanding`,
          count: overdueInvoices.length,
          totalAmount: totalOverdue,
          link: '/invoices?overdue=true',
        });
      }

      // Sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      notifications.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      res.json({
        success: true,
        data: notifications.slice(0, 20),
        unreadCount: notifications.filter(n => n.priority === 'high').length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recent activity
   */
  async getActivity(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { limit = 20 } = req.query;
      
      const db = require('../config/database');
      
      const sql = `
        SELECT al.*, u.first_name, u.last_name
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.tenant_id = ?
        ORDER BY al.created_at DESC
        LIMIT ?
      `;
      
      const activities = await db.query(sql, [tenantId, parseInt(limit)]);

      res.json({
        success: true,
        data: activities,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { period = 'monthly', months = 12 } = req.query;
      
      let sql;
      
      if (period === 'monthly') {
        sql = `
          SELECT 
            DATE_FORMAT(event_date, '%Y-%m') as period,
            COUNT(*) as event_count,
            COALESCE(SUM(final_amount), 0) as revenue,
            COALESCE(SUM(guest_count), 0) as total_guests
          FROM events
          WHERE tenant_id = ? AND status = 'completed'
            AND event_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
          GROUP BY DATE_FORMAT(event_date, '%Y-%m')
          ORDER BY period ASC
        `;
      } else if (period === 'weekly') {
        sql = `
          SELECT 
            YEARWEEK(event_date) as period,
            COUNT(*) as event_count,
            COALESCE(SUM(final_amount), 0) as revenue,
            COALESCE(SUM(guest_count), 0) as total_guests
          FROM events
          WHERE tenant_id = ? AND status = 'completed'
            AND event_date >= DATE_SUB(CURDATE(), INTERVAL ? WEEK)
          GROUP BY YEARWEEK(event_date)
          ORDER BY period ASC
        `;
      }
      
      const db = require('../config/database');
      const data = await db.query(sql, [tenantId, parseInt(months)]);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
