import { Controller, Get, Inject, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { GatewayAuthError, GatewayAuthService } from './gateway-auth.service.js';
import { SystemHealthService } from './system-health.service.js';

@Controller()
export class SystemHealthController {
  constructor(
    @Inject(GatewayAuthService) private readonly gatewayAuthService: GatewayAuthService,
    @Inject(SystemHealthService) private readonly systemHealthService: SystemHealthService,
  ) {}

  // Answered by the gateway itself, not proxied. It sits under /audit/api so the audit app reaches it through the same
  // base URL as its other admin calls; AppModule registers this controller first so AppController's /audit proxy
  // doesn't take the route. Admins only.
  @Get('audit/api/admin/system-health')
  async systemHealth(@Req() request: Request, @Res() response: Response): Promise<void> {
    try {
      await this.gatewayAuthService.authorizeRequest(request, '/system');
    } catch (error) {
      if (error instanceof GatewayAuthError) {
        response.status(error.statusCode).json({ statusCode: error.statusCode, message: error.message });
        return;
      }
      throw error;
    }

    response.setHeader('Cache-Control', 'no-store');
    response.json(await this.systemHealthService.getHealth());
  }
}
