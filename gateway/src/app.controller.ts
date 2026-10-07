import { All, Controller, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @All(['client', 'client/*path'])
  proxyClient(@Req() request: Request, @Res() response: Response): Promise<void> {
    return this.appService.proxyToClient(request, response);
  }

  @All(['audit', 'audit/*path'])
  proxyAudit(@Req() request: Request, @Res() response: Response): Promise<void> {
    return this.appService.proxyToAudit(request, response);
  }
}
