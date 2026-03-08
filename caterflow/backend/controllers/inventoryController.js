const { InventoryItem, InventoryCategory, InventoryTransaction, Supplier } = require('../models/Inventory');
const { parsePagination } = require('../utils/helpers');

class InventoryController {
  // ==================== CATEGORIES ====================
  
  async getCategories(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const categories = await InventoryCategory.findAll(tenantId);
      
      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { name, description } = req.body;

      const categoryId = await InventoryCategory.create({
        tenant_id: tenantId,
        name,
        description,
      });

      const category = await InventoryCategory.findById(categoryId, tenantId);

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const updated = await InventoryCategory.update(id, tenantId, req.body);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Category not found',
        });
      }

      res.json({
        success: true,
        message: 'Category updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const deleted = await InventoryCategory.delete(id, tenantId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Category not found',
        });
      }

      res.json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== INVENTORY ITEMS ====================

  async getItems(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { category_id, supplier_id, low_stock, search, page, limit } = req.query;
      const pagination = parsePagination({ page, limit });

      const options = {
        categoryId: category_id,
        supplierId: supplier_id,
        lowStock: low_stock === 'true',
        search,
        limit: pagination.limit,
        offset: pagination.offset,
      };

      const [items, total] = await Promise.all([
        InventoryItem.findAll(tenantId, options),
        InventoryItem.count(tenantId, options),
      ]);

      res.json({
        success: true,
        data: items,
        meta: {
          page: pagination.page,
          limit: pagination.limit,
          total,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getItemById(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const item = await InventoryItem.findById(id, tenantId);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Inventory item not found',
        });
      }

      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async createItem(req, res, next) {
    try {
      const tenantId = req.tenantId;
      
      const itemId = await InventoryItem.create({
        tenant_id: tenantId,
        ...req.body,
      });

      const item = await InventoryItem.findById(itemId, tenantId);

      res.status(201).json({
        success: true,
        message: 'Inventory item created successfully',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateItem(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const updated = await InventoryItem.update(id, tenantId, req.body);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Inventory item not found',
        });
      }

      const item = await InventoryItem.findById(id, tenantId);

      res.json({
        success: true,
        message: 'Inventory item updated successfully',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteItem(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const deleted = await InventoryItem.delete(id, tenantId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Inventory item not found',
        });
      }

      res.json({
        success: true,
        message: 'Inventory item deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getLowStock(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const items = await InventoryItem.getLowStockItems(tenantId);

      res.json({
        success: true,
        data: items,
        count: items.length,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== TRANSACTIONS ====================

  async getTransactions(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { item_id, transaction_type, start_date, end_date, page, limit } = req.query;
      const pagination = parsePagination({ page, limit });

      const options = {
        itemId: item_id,
        transactionType: transaction_type,
        startDate: start_date,
        endDate: end_date,
        limit: pagination.limit,
        offset: pagination.offset,
      };

      const transactions = await InventoryTransaction.findAll(tenantId, options);

      res.json({
        success: true,
        data: transactions,
        meta: {
          page: pagination.page,
          limit: pagination.limit,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async createTransaction(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const userId = req.user.id;
      
      const { inventory_item_id, transaction_type, quantity, unit_cost, notes, reference_type, reference_id } = req.body;

      // Get current item
      const item = await InventoryItem.findById(inventory_item_id, tenantId);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Inventory item not found',
        });
      }

      // Calculate new quantity
      let newQuantity = parseFloat(item.quantity);
      if (transaction_type === 'purchase') {
        newQuantity += parseFloat(quantity);
      } else if (transaction_type === 'consumption' || transaction_type === 'wastage') {
        newQuantity -= parseFloat(quantity);
      } else if (transaction_type === 'adjustment') {
        newQuantity = parseFloat(quantity);
      }

      // Ensure quantity doesn't go negative
      if (newQuantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock for this transaction',
        });
      }

      const total_cost = unit_cost ? quantity * unit_cost : null;

      // Create transaction
      const transactionId = await InventoryTransaction.create({
        tenant_id: tenantId,
        inventory_item_id,
        transaction_type,
        quantity,
        unit_cost,
        total_cost,
        reference_type,
        reference_id,
        notes,
        performed_by: userId,
      });

      // Update item quantity
      await InventoryItem.updateQuantity(inventory_item_id, tenantId, newQuantity);

      const transaction = await InventoryTransaction.findById(transactionId, tenantId);

      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStockValue(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const stats = await InventoryTransaction.getStockValue(tenantId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== SUPPLIERS ====================

  async getSuppliers(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const suppliers = await Supplier.findAll(tenantId, { isActive: true });

      res.json({
        success: true,
        data: suppliers,
      });
    } catch (error) {
      next(error);
    }
  }

  async createSupplier(req, res, next) {
    try {
      const tenantId = req.tenantId;
      
      const supplierId = await Supplier.create({
        tenant_id: tenantId,
        ...req.body,
      });

      const supplier = await Supplier.findById(supplierId, tenantId);

      res.status(201).json({
        success: true,
        message: 'Supplier created successfully',
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSupplier(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const updated = await Supplier.update(id, tenantId, req.body);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found',
        });
      }

      const supplier = await Supplier.findById(id, tenantId);

      res.json({
        success: true,
        message: 'Supplier updated successfully',
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteSupplier(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const deleted = await Supplier.delete(id, tenantId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found',
        });
      }

      res.json({
        success: true,
        message: 'Supplier deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InventoryController();
