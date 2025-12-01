import { Request, Response, NextFunction } from 'express';
import { ZoneService } from './zone.service.js';
import { CreateZoneInput, UpdateZoneInput, ListZonesQuery, AssignEmployeeInput, UpdateZoneHeadsInput } from './zone.schema.js';

const zoneService = new ZoneService();

export class ZoneController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const zone = await zoneService.create(req.body as CreateZoneInput);
      res.status(201).json({
        success: true,
        data: zone,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const zone = await zoneService.findById(req.params.id);
      res.json({
        success: true,
        data: zone,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await zoneService.findAll(req.query as unknown as ListZonesQuery);
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
      const zone = await zoneService.update(req.params.id, req.body as UpdateZoneInput);
      res.json({
        success: true,
        data: zone,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await zoneService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Zone Team Management Methods

  async getZoneTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const team = await zoneService.getZoneTeam(req.params.id);
      res.json({
        success: true,
        data: team,
      });
    } catch (error) {
      next(error);
    }
  }

  async assignEmployeeToZone(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId, role, isPrimary } = req.body as AssignEmployeeInput;
      const result = await zoneService.assignEmployeeToZone(
        req.params.id,
        employeeId,
        role,
        isPrimary
      );
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async removeEmployeeFromZone(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await zoneService.removeEmployeeFromZone(
        req.params.id,
        req.params.employeeId
      );
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateZoneHeads(req: Request, res: Response, next: NextFunction) {
    try {
      const { primaryHeadId, secondaryHeadId } = req.body as UpdateZoneHeadsInput;
      const zone = await zoneService.updateZoneHeads(
        req.params.id,
        primaryHeadId ?? undefined,
        secondaryHeadId ?? undefined
      );
      res.json({
        success: true,
        data: zone,
      });
    } catch (error) {
      next(error);
    }
  }

  // Zone Coverage Methods

  async getActiveZoneHead(req: Request, res: Response, next: NextFunction) {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const result = await zoneService.getActiveZoneHead(req.params.id, date);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getZoneCoverageStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const result = await zoneService.getZoneCoverageStatus(req.params.id, startDate, endDate);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllZonesCoverageStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const result = await zoneService.getAllZonesCoverageStatus(date);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
