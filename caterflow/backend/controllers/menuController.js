const { MenuCategory, MenuItem, MenuPackage } = require('../models/Menu');
const { parsePagination } = require('../utils/helpers');

class MenuController {
  // ==================== CATEGORIES ====================
  
  async getCategories(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const categories = await MenuCategory.findAll(tenantId);
      
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
      const { name, description, display_order } = req.body;

      const categoryId = await MenuCategory.create({
        tenant_id: tenantId,
        name,
        description,
        display_order,
      });

      const category = await MenuCategory.findById(categoryId, tenantId);

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

      const updated = await MenuCategory.update(id, tenantId, req.body);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Category not found',
        });
      }

      const category = await MenuCategory.findById(id, tenantId);

      res.json({
        success: true,
        message: 'Category updated successfully',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const deleted = await MenuCategory.delete(id, tenantId);

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

  // ==================== MENU ITEMS ====================

  async getItems(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const { category_id, is_vegetarian, search, page, limit } = req.query;
      const pagination = parsePagination({ page, limit });

      const options = {
        categoryId: category_id,
        isVegetarian: is_vegetarian !== undefined ? is_vegetarian === 'true' : undefined,
        isActive: true,
        search,
        limit: pagination.limit,
        offset: pagination.offset,
      };

      const items = await MenuItem.findAll(tenantId, options);

      res.json({
        success: true,
        data: items,
        meta: {
          page: pagination.page,
          limit: pagination.limit,
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

      const item = await MenuItem.findById(id, tenantId);

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Menu item not found',
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
      
      const itemId = await MenuItem.create({
        tenant_id: tenantId,
        ...req.body,
      });

      const item = await MenuItem.findById(itemId, tenantId);

      res.status(201).json({
        success: true,
        message: 'Menu item created successfully',
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

      const updated = await MenuItem.update(id, tenantId, req.body);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Menu item not found',
        });
      }

      const item = await MenuItem.findById(id, tenantId);

      res.json({
        success: true,
        message: 'Menu item updated successfully',
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

      const deleted = await MenuItem.delete(id, tenantId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Menu item not found',
        });
      }

      res.json({
        success: true,
        message: 'Menu item deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== PACKAGES ====================

  async getPackages(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const packages = await MenuPackage.findAll(tenantId, { isActive: true });

      res.json({
        success: true,
        data: packages,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPackageById(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const packageData = await MenuPackage.findById(id, tenantId);

      if (!packageData) {
        return res.status(404).json({
          success: false,
          message: 'Package not found',
        });
      }

      // Get package items
      const items = await MenuPackage.getItems(id, tenantId);

      res.json({
        success: true,
        data: {
          ...packageData,
          items,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async createPackage(req, res, next) {
    try {
      const tenantId = req.tenantId;
      
      const packageId = await MenuPackage.create({
        tenant_id: tenantId,
        ...req.body,
      });

      const packageData = await MenuPackage.findById(packageId, tenantId);

      res.status(201).json({
        success: true,
        message: 'Package created successfully',
        data: packageData,
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePackage(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const updated = await MenuPackage.update(id, tenantId, req.body);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Package not found',
        });
      }

      const packageData = await MenuPackage.findById(id, tenantId);
      const items = await MenuPackage.getItems(id, tenantId);

      res.json({
        success: true,
        message: 'Package updated successfully',
        data: {
          ...packageData,
          items,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async deletePackage(req, res, next) {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId;

      const deleted = await MenuPackage.delete(id, tenantId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Package not found',
        });
      }

      res.json({
        success: true,
        message: 'Package deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MenuController();
