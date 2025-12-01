import { Request, Response, NextFunction } from 'express';
import { RoomService } from './room.service.js';
import { CreateRoomInput, UpdateRoomInput, ListRoomsQuery, BulkCreateRoomsInput } from './room.schema.js';

const roomService = new RoomService();

export class RoomController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const room = await roomService.create(req.body as CreateRoomInput);
      res.status(201).json({
        success: true,
        data: room,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const room = await roomService.findById(req.params.id);
      res.json({
        success: true,
        data: room,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await roomService.findAll(req.query as unknown as ListRoomsQuery);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async findByUnitId(req: Request, res: Response, next: NextFunction) {
    try {
      const rooms = await roomService.findByUnitId(req.params.unitId);
      res.json({
        success: true,
        data: rooms,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const room = await roomService.update(req.params.id, req.body as UpdateRoomInput);
      res.json({
        success: true,
        data: room,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await roomService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkCreate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await roomService.bulkCreate(
        req.params.unitId,
        req.body as BulkCreateRoomsInput
      );
      res.status(201).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
