import { Request, Response, NextFunction } from 'express';
import { MenuService } from './menu.service.js';
import { CreateMenuItemInput, UpdateMenuItemInput, AssignMenusInput } from './menu.schema.js';

const menuService = new MenuService();

export class MenuController {
  // ==================== Menu Item CRUD ====================

  async createMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await menuService.createMenuItem(req.body as CreateMenuItemInput);
      res.status(201).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMenuItemById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await menuService.getMenuItemById(req.params.id);
      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllMenuItems(req: Request, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const items = await menuService.getAllMenuItems(includeInactive);
      res.json({
        success: true,
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await menuService.updateMenuItem(req.params.id, req.body as UpdateMenuItemInput);
      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await menuService.deleteMenuItem(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== Role Menu Permissions ====================

  async assignMenusToRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { menuItemIds } = req.body as AssignMenusInput;
      const result = await menuService.assignMenusToRole(req.params.roleId, menuItemIds);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMenusForRole(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await menuService.getMenusForRole(req.params.roleId);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllRolesWithMenus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await menuService.getAllRolesWithMenus();
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyMenus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const menus = await menuService.getMenusForUser(userId);
      res.json({
        success: true,
        data: menus,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyZones(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const zones = await menuService.getUserZones(userId);
      res.json({
        success: true,
        data: zones,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyDashboardWidgets(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const widgets = await menuService.getUserDashboardWidgets(userId);
      res.json({
        success: true,
        data: widgets,
      });
    } catch (error) {
      next(error);
    }
  }
}
