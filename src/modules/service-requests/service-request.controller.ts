import { Request, Response, NextFunction } from 'express';
import { ServiceRequestService } from './service-request.service.js';
import { prisma } from '../../config/database.js';
import { BadRequestError } from '../../utils/errors.js';
import {
  CreateServiceRequestInput,
  UpdateServiceRequestInput,
  AssignServiceRequestInput,
  ListServiceRequestsQuery,
} from './service-request.schema.js';

const serviceRequestService = new ServiceRequestService();

// Mapping from mobile category names to complaint type names in database
const CATEGORY_TO_COMPLAINT_TYPE: Record<string, string> = {
  'plumbing': 'Plumbing',
  'electrical': 'Electrical',
  'hvac': 'AC Maintenance',
  'appliance': 'General Maintenance',
  'cleaning': 'Cleaning',
  'general': 'General Maintenance',
};

export class ServiceRequestController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const body = req.body as CreateServiceRequestInput & { category?: string };

      // For customer role, derive customerId from authenticated user if not provided
      if (!body.customerId && req.user?.role === 'customer' && req.user.customerId) {
        body.customerId = req.user.customerId;
      }

      // If customerId is still missing, return error
      if (!body.customerId) {
        throw new BadRequestError('Customer ID is required');
      }

      // If complaintTypeId is not provided but category is, look up the complaint type
      if (!body.complaintTypeId && body.category) {
        const categoryName = CATEGORY_TO_COMPLAINT_TYPE[body.category.toLowerCase()] || body.category;

        // Look up complaint type by name (case-insensitive)
        const complaintType = await prisma.complaintType.findFirst({
          where: {
            name: {
              equals: categoryName,
              mode: 'insensitive',
            },
          },
        });

        if (complaintType) {
          body.complaintTypeId = complaintType.id;
        } else {
          // Fall back to first available complaint type
          const defaultType = await prisma.complaintType.findFirst();
          if (defaultType) {
            body.complaintTypeId = defaultType.id;
          } else {
            throw new BadRequestError('No complaint types available. Please contact support.');
          }
        }
      }

      // If complaintTypeId is still missing, return error
      if (!body.complaintTypeId) {
        throw new BadRequestError('Complaint type or category is required');
      }

      // Normalize priority to uppercase if provided in lowercase
      if (body.priority) {
        body.priority = body.priority.toUpperCase() as any;
      }

      const serviceRequest = await serviceRequestService.create(
        body as CreateServiceRequestInput,
        req.user?.id
      );
      res.status(201).json({
        success: true,
        data: serviceRequest,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const serviceRequest = await serviceRequestService.findById(req.params.id);
      res.json({
        success: true,
        data: serviceRequest,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userContext = req.user ? {
        role: req.user.role,
        departmentId: req.user.departmentId,
      } : undefined;

      // Build query with automatic customer filter for customer role
      const query = req.query as unknown as ListServiceRequestsQuery;

      // If user is a customer, automatically filter by their customerId
      // This ensures customers can only see their own service requests
      if (req.user?.role === 'customer' && req.user.customerId) {
        query.customerId = req.user.customerId;
      }

      const result = await serviceRequestService.findAll(
        query,
        userContext
      );
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
      const serviceRequest = await serviceRequestService.update(
        req.params.id,
        req.body as UpdateServiceRequestInput,
        req.user?.id
      );
      res.json({
        success: true,
        data: serviceRequest,
      });
    } catch (error) {
      next(error);
    }
  }

  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const serviceRequest = await serviceRequestService.assign(
        req.params.id,
        req.body as AssignServiceRequestInput,
        req.user?.id
      );
      res.json({
        success: true,
        data: serviceRequest,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await serviceRequestService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userContext = req.user ? {
        role: req.user.role,
        departmentId: req.user.departmentId,
      } : undefined;

      const stats = await serviceRequestService.getStats(userContext);
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // Attachment methods
  async addAttachment(req: Request, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({
          success: false,
          error: { message: 'No file uploaded' },
        });
      }

      // Build file path relative to uploads directory
      const relativePath = `/uploads/service-requests/${req.params.id}/${file.filename}`;

      const attachmentData = {
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        filePath: relativePath,
      };

      const attachment = await serviceRequestService.addAttachment(
        req.params.id,
        attachmentData,
        req.user?.id
      );
      res.status(201).json({
        success: true,
        data: attachment,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAttachments(req: Request, res: Response, next: NextFunction) {
    try {
      const attachments = await serviceRequestService.getAttachments(req.params.id);
      res.json({
        success: true,
        data: attachments,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAttachment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await serviceRequestService.deleteAttachment(
        req.params.id,
        req.params.attachmentId,
        req.user?.id
      );
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Asset linking methods
  async linkAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const serviceRequest = await serviceRequestService.linkAsset(
        req.params.id,
        req.body.assetId,
        req.user?.id
      );
      res.json({
        success: true,
        data: serviceRequest,
      });
    } catch (error) {
      next(error);
    }
  }

  async unlinkAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const serviceRequest = await serviceRequestService.unlinkAsset(
        req.params.id,
        req.user?.id
      );
      res.json({
        success: true,
        data: serviceRequest,
      });
    } catch (error) {
      next(error);
    }
  }
}
