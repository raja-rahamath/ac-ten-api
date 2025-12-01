import { Request, Response, NextFunction } from 'express';
import { LeaveService } from './leave.service.js';
import {
  CreateLeaveTypeInput,
  UpdateLeaveTypeInput,
  CreateLeaveRequestInput,
  UpdateLeaveRequestInput,
  ApproveLeaveRequestInput,
  RejectLeaveRequestInput,
  ListLeaveRequestsQuery,
  AdjustLeaveBalanceInput,
} from './leave.schema.js';

const leaveService = new LeaveService();

export class LeaveController {
  // ==================== LEAVE TYPE CONTROLLERS ====================

  async createLeaveType(req: Request, res: Response, next: NextFunction) {
    try {
      const leaveType = await leaveService.createLeaveType(req.body as CreateLeaveTypeInput);
      res.status(201).json({
        success: true,
        data: leaveType,
      });
    } catch (error) {
      next(error);
    }
  }

  async findLeaveTypeById(req: Request, res: Response, next: NextFunction) {
    try {
      const leaveType = await leaveService.findLeaveTypeById(req.params.id);
      res.json({
        success: true,
        data: leaveType,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAllLeaveTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
      const leaveTypes = await leaveService.findAllLeaveTypes(isActive);
      res.json({
        success: true,
        data: leaveTypes,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateLeaveType(req: Request, res: Response, next: NextFunction) {
    try {
      const leaveType = await leaveService.updateLeaveType(req.params.id, req.body as UpdateLeaveTypeInput);
      res.json({
        success: true,
        data: leaveType,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteLeaveType(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await leaveService.deleteLeaveType(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== LEAVE REQUEST CONTROLLERS ====================

  async createLeaveRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const leaveRequest = await leaveService.createLeaveRequest(req.body as CreateLeaveRequestInput);
      res.status(201).json({
        success: true,
        data: leaveRequest,
      });
    } catch (error) {
      next(error);
    }
  }

  async findLeaveRequestById(req: Request, res: Response, next: NextFunction) {
    try {
      const leaveRequest = await leaveService.findLeaveRequestById(req.params.id);
      res.json({
        success: true,
        data: leaveRequest,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAllLeaveRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await leaveService.findAllLeaveRequests(req.query as unknown as ListLeaveRequestsQuery);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateLeaveRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const leaveRequest = await leaveService.updateLeaveRequest(req.params.id, req.body as UpdateLeaveRequestInput);
      res.json({
        success: true,
        data: leaveRequest,
      });
    } catch (error) {
      next(error);
    }
  }

  async approveLeaveRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { approverId } = req.body as ApproveLeaveRequestInput;
      const leaveRequest = await leaveService.approveLeaveRequest(req.params.id, approverId);
      res.json({
        success: true,
        data: leaveRequest,
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectLeaveRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { approverId, rejectionReason } = req.body as RejectLeaveRequestInput;
      const leaveRequest = await leaveService.rejectLeaveRequest(req.params.id, approverId, rejectionReason);
      res.json({
        success: true,
        data: leaveRequest,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelLeaveRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const leaveRequest = await leaveService.cancelLeaveRequest(req.params.id);
      res.json({
        success: true,
        data: leaveRequest,
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== LEAVE BALANCE CONTROLLERS ====================

  async getLeaveBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const balances = await leaveService.getLeaveBalance(req.params.employeeId, year);
      res.json({
        success: true,
        data: balances,
      });
    } catch (error) {
      next(error);
    }
  }

  async initializeLeaveBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId, year } = req.body;
      const balances = await leaveService.initializeLeaveBalance(employeeId, year);
      res.status(201).json({
        success: true,
        data: balances,
      });
    } catch (error) {
      next(error);
    }
  }

  async adjustLeaveBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const balance = await leaveService.adjustLeaveBalance(
        req.params.employeeId,
        req.params.leaveTypeId,
        req.body as AdjustLeaveBalanceInput
      );
      res.json({
        success: true,
        data: balance,
      });
    } catch (error) {
      next(error);
    }
  }

  async getEmployeesOnLeave(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, zoneId } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: 'startDate and endDate are required',
        });
        return;
      }

      const employees = await leaveService.getEmployeesOnLeave(
        new Date(startDate as string),
        new Date(endDate as string),
        zoneId as string | undefined
      );

      res.json({
        success: true,
        data: employees,
      });
    } catch (error) {
      next(error);
    }
  }
}
