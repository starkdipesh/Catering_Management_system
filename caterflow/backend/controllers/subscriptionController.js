const Tenant = require('../models/Tenant');
const { SubscriptionPlan, SubscriptionInvoice } = require('../models/Subscription');
const config = require('../config');

class SubscriptionController {
  /**
   * Get current tenant subscription
   */
  async getCurrentSubscription(req, res, next) {
    try {
      const tenantId = req.tenantId;
      
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found',
        });
      }

      // Get available plans for comparison
      const plans = await SubscriptionPlan.findAll();

      // Get billing history
      const invoices = await SubscriptionInvoice.findAll({
        tenantId,
        limit: 12,
      });

      res.json({
        success: true,
        data: {
          subscription: {
            plan: {
              id: tenant.subscription_plan_id,
              name: tenant.plan_name,
              priceMonthly: tenant.price_monthly,
              priceYearly: tenant.price_yearly,
              maxEventsPerMonth: tenant.max_events_per_month,
              maxStaff: tenant.max_staff,
            },
            status: tenant.subscription_status,
            startDate: tenant.subscription_start_date,
            endDate: tenant.subscription_end_date,
            billingCycle: tenant.billing_cycle,
            isTrial: tenant.is_trial,
            trialEndsAt: tenant.trial_ends_at,
          },
          availablePlans: plans,
          billingHistory: invoices,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all available plans
   */
  async getPlans(req, res, next) {
    try {
      const plans = await SubscriptionPlan.findAll();
      
      res.json({
        success: true,
        data: plans,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upgrade subscription
   */
  async upgrade(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { plan_id, billing_cycle = 'monthly', payment_method = 'stripe' } = req.body;

      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found',
        });
      }

      const plan = await SubscriptionPlan.findById(plan_id);
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Plan not found',
        });
      }

      // Calculate amount
      const amount = billing_cycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
      
      // If free plan, just update
      if (amount === 0) {
        await Tenant.updateSubscription(tenantId, {
          subscription_plan_id: plan_id,
          subscription_status: 'active',
          subscription_start_date: new Date(),
          subscription_end_date: null,
          billing_cycle,
          is_trial: false,
        });

        return res.json({
          success: true,
          message: 'Subscription upgraded successfully',
        });
      }

      // For paid plans, create Stripe checkout session or Razorpay order
      if (payment_method === 'stripe' && config.STRIPE.SECRET_KEY) {
        // This would integrate with Stripe
        // For now, return the plan details
        res.json({
          success: true,
          message: 'Stripe checkout session to be created',
          data: {
            plan,
            billingCycle: billing_cycle,
            amount,
            // stripeSessionId would be generated here
          },
        });
      } else if (payment_method === 'razorpay' && config.RAZORPAY.KEY_ID) {
        // This would integrate with Razorpay
        res.json({
          success: true,
          message: 'Razorpay order to be created',
          data: {
            plan,
            billingCycle: billing_cycle,
            amount,
            // razorpayOrderId would be generated here
          },
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Payment method not configured',
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel subscription
   */
  async cancel(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { reason } = req.body;

      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found',
        });
      }

      // Update subscription status
      await Tenant.updateSubscription(tenantId, {
        subscription_status: 'cancelled',
        subscription_end_date: new Date(),
      });

      // Log cancellation reason (could be stored in a separate table)
      console.log(`Tenant ${tenantId} cancelled subscription. Reason: ${reason}`);

      res.json({
        success: true,
        message: 'Subscription cancelled successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle Stripe webhook
   */
  async stripeWebhook(req, res, next) {
    try {
      const sig = req.headers['stripe-signature'];
      const stripe = require('stripe')(config.STRIPE.SECRET_KEY);
      
      let event;
      
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, config.STRIPE.WEBHOOK_SECRET);
      } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle the event
      switch (event.type) {
        case 'invoice.payment_succeeded':
          // Handle successful payment
          break;
        case 'invoice.payment_failed':
          // Handle failed payment
          break;
        case 'customer.subscription.updated':
          // Handle subscription update
          break;
        case 'customer.subscription.deleted':
          // Handle subscription cancellation
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify Razorpay payment
   */
  async verifyRazorpayPayment(req, res, next) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      
      const crypto = require('crypto');
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      
      const expectedSignature = crypto
        .createHmac('sha256', config.RAZORPAY.KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      const isAuthentic = expectedSignature === razorpay_signature;

      if (isAuthentic) {
        // Update tenant subscription
        res.json({
          success: true,
          message: 'Payment verified successfully',
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid signature',
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get usage statistics
   */
  async getUsage(req, res, next) {
    try {
      const tenantId = req.tenantId;
      
      const [eventLimit, staffLimit, stats] = await Promise.all([
        Tenant.checkEventLimit(tenantId),
        Tenant.checkStaffLimit(tenantId),
        Tenant.getStats(tenantId),
      ]);

      res.json({
        success: true,
        data: {
          events: {
            current: eventLimit.current,
            limit: eventLimit.limit,
            remaining: eventLimit.remaining,
            unlimited: !eventLimit.limit,
          },
          staff: {
            current: staffLimit.current,
            limit: staffLimit.limit,
            remaining: staffLimit.remaining,
            unlimited: !staffLimit.limit,
          },
          customers: stats.total_customers,
          totalRevenue: stats.total_revenue,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SubscriptionController();
