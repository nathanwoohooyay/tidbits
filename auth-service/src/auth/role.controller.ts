import { Body, Controller, Get, Inject, Param, Put, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from '../authorization/auth.guard';
import { RoleGuard } from '../authorization/role.guard';
import { Roles } from '../authorization/roles.decorator';
import { Role } from '../authorization/roles.enum';

@Controller('api/roles')
@UseGuards(AuthGuard, RoleGuard)
export class RoleController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Get()
  @Roles(Role.ADMIN)
  async getAllRoles(@Req() req: Request, @Res() res: Response) {
    return this.authService.getAllRoles(req, res);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  async getRoleById(@Req() req: Request, @Res() res: Response, @Param('id') id: string) {
    return this.authService.getRoleById(req, res, Number(id));
  }

  @Get('users/:userId')
  @Roles(Role.ADMIN)
  async getUserRole(@Req() req: Request, @Res() res: Response, @Param('userId') userId: string) {
    return this.authService.getUserRole(req, res, Number(userId));
  }

  @Put('users/:userId')
  @Roles(Role.ADMIN)
  async updateUserRole(
    @Req() req: Request,
    @Res() res: Response,
    @Param('userId') userId: string,
    @Body() body: unknown,
  ) {
    return this.authService.updateUserRole(req, res, Number(userId), body);
  }
}