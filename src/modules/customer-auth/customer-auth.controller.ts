import { Request, Response, NextFunction } from 'express';
import { CustomerAuthService } from './customer-auth.service.js';

const service = new CustomerAuthService();

export class CustomerAuthController {
  async checkEmailAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.query as { email: string };
      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required',
        });
      }
      const result = await service.checkEmailAvailability(email);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async registerIndividual(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.registerIndividual(req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async registerCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.registerCompany(req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.query as { token: string };
      const result = await service.verifyEmail(token);

      // Return HTML success page
      res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verified - AgentCare</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .card {
              background: white;
              border-radius: 16px;
              padding: 40px;
              text-align: center;
              max-width: 400px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.2);
            }
            .icon {
              width: 80px;
              height: 80px;
              background: #10B981;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 24px;
            }
            .icon svg { width: 40px; height: 40px; }
            h1 { color: #1F2937; font-size: 24px; margin-bottom: 12px; }
            p { color: #6B7280; font-size: 16px; line-height: 1.5; margin-bottom: 24px; }
            .btn {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 32px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 600;
              transition: transform 0.2s;
            }
            .btn:hover { transform: translateY(-2px); }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">
              <svg fill="none" stroke="white" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h1>Email Verified!</h1>
            <p>Your email has been successfully verified. You can now log in to your AgentCare account.</p>
            <a href="agentcare://login" class="btn">Open App</a>
          </div>
        </body>
        </html>
      `);
    } catch (error: any) {
      // Return HTML error page
      const errorMessage = error.message || 'Verification failed';
      res.status(400).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Failed - AgentCare</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .card {
              background: white;
              border-radius: 16px;
              padding: 40px;
              text-align: center;
              max-width: 400px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.2);
            }
            .icon {
              width: 80px;
              height: 80px;
              background: #EF4444;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 24px;
            }
            .icon svg { width: 40px; height: 40px; }
            h1 { color: #1F2937; font-size: 24px; margin-bottom: 12px; }
            p { color: #6B7280; font-size: 16px; line-height: 1.5; margin-bottom: 24px; }
            .error { color: #EF4444; font-size: 14px; background: #FEE2E2; padding: 12px; border-radius: 8px; margin-bottom: 24px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">
              <svg fill="none" stroke="white" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <h1>Verification Failed</h1>
            <p class="error">${errorMessage}</p>
            <p>The verification link may have expired or is invalid. Please request a new verification email.</p>
          </div>
        </body>
        </html>
      `);
    }
  }

  async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.resendVerification(req.body.email);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.login(req.body);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.forgotPassword(req.body);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.resetPassword(req.body);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.refreshToken(req.body);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response) {
    // For JWT-based auth, logout is handled client-side by discarding tokens
    res.status(200).json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  }

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const result = await service.getProfile(userId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async registerProperty(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const result = await service.registerProperty(userId, req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProperties(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const status = req.query.status as string | undefined;
      const result = await service.getCustomerProperties(userId, status);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async setPrimaryProperty(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const { propertyId } = req.params;
      const result = await service.setPrimaryProperty(userId, propertyId);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async listAreas(req: Request, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string | undefined;
      const result = await service.listAreas(search);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async createServiceRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const result = await service.createServiceRequest(userId, req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getServiceTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getServiceTypes();
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getServiceRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const { status } = req.query;
      const result = await service.getCustomerServiceRequests(userId, {
        status: status as string | undefined,
      });
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getServiceRequestById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const { id } = req.params;
      const result = await service.getCustomerServiceRequestById(userId, id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelServiceRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const { id } = req.params;
      const result = await service.cancelServiceRequest(userId, id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
