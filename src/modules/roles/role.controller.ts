import { Request, Response, NextFunction } from 'express';
import { RoleService } from './role.service.js';
import { CreateRoleInput, UpdateRoleInput, ListRolesQuery, UpdateRolePermissionsInput } from './role.schema.js';

const roleService = new RoleService();

export class RoleController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const role = await roleService.create(req.body as CreateRoleInput);
      res.status(201).json({
        success: true,
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const role = await roleService.findById(req.params.id);
      res.json({
        success: true,
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await roleService.findAll(req.query as unknown as ListRolesQuery);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const role = await roleService.update(req.params.id, req.body as UpdateRoleInput);
      res.json({
        success: true,
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const role = await roleService.updatePermissions(req.params.id, req.body as UpdateRolePermissionsInput);
      res.json({
        success: true,
        data: role,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await roleService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await roleService.getPermissions();
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
