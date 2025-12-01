import { Request, Response, NextFunction } from 'express';
import { RoomTypeService } from './room-type.service.js';
import { CreateRoomTypeInput, UpdateRoomTypeInput, ListRoomTypesQuery } from './room-type.schema.js';

const roomTypeService = new RoomTypeService();

export class RoomTypeController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const roomType = await roomTypeService.create(req.body as CreateRoomTypeInput);
      res.status(201).json({
        success: true,
        data: roomType,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const roomType = await roomTypeService.findById(req.params.id);
      res.json({
        success: true,
        data: roomType,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await roomTypeService.findAll(req.query as unknown as ListRoomTypesQuery);
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
      const roomType = await roomTypeService.update(req.params.id, req.body as UpdateRoomTypeInput);
      res.json({
        success: true,
        data: roomType,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await roomTypeService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
