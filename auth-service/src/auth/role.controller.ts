import { Body, Controller, Get, Inject, Param, Put, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';

@Controller('api/roles')
export class RoleController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Get()
  async getAllRoles(@Req() req: Request, @Res() res: Response) {
    return this.authService.getAllRoles(req, res);
  }

  @Get(':id')
  async getRoleById(@Req() req: Request, @Res() res: Response, @Param('id') id: string) {
    return this.authService.getRoleById(req, res, Number(id));
  }

  @Get('users/:userId')
  async getUserRole(@Req() req: Request, @Res() res: Response, @Param('userId') userId: string) {
    return this.authService.getUserRole(req, res, Number(userId));
  }

  @Put('users/:userId')
  async updateUserRole(
    @Req() req: Request,
    @Res() res: Response,
    @Param('userId') userId: string,
    @Body() body: unknown,
  ) {
    return this.authService.updateUserRole(req, res, Number(userId), body);
  }
}