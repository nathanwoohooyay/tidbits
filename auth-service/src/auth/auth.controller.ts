import { Body, Controller, Get, Inject, Patch, Post, Req, Res, UseGuards, HttpCode  } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard, AuthenticatedUser } from '../authorization/auth.guard';
import { RoleGuard } from '../authorization/role.guard';
import { Roles } from '../authorization/roles.decorator';
import { Role } from '../authorization/roles.enum';

interface ChangePasswordBody {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

@Controller('api/auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Req() req: Request, @Res() res: Response, @Body() body: unknown) {
    return this.authService.signup(req, res, body);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Req() req: Request, @Res() res: Response, @Body() body: unknown) {
    return this.authService.login(req, res, body);
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    return this.authService.refresh(req, res);
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    return this.authService.logout(req, res);
  }

  @Patch('change-password')
  @UseGuards(AuthGuard)
  async changePassword(@Req() req: Request, @Res() res: Response, @Body() body: ChangePasswordBody) {
    return this.authService.changePassword(req, res, body);
  }

  @Post('users/:userId/revoke')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard, RoleGuard)
  async revokeAccess(@Req() req: Request, @Res() res: Response) {
    return this.authService.revokeAccess(req, res, Number(req.params.userId));
  }

  @Get('sessions')
  @UseGuards(AuthGuard)
  async listSessions(@Req() req: Request & { user: AuthenticatedUser }, @Res() res: Response) {
    return this.authService.listSessions(req, res, req.user);
  }

  // Ends every session except the one making the request.
  @Post('sessions/sign-out-others')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  async signOutOtherSessions(@Req() req: Request & { user: AuthenticatedUser }, @Res() res: Response) {
    return this.authService.signOutOtherSessions(req, res, req.user);
  }

  @Get('whoami')
  async whoAmI(@Req() req: Request, @Res() res: Response) {
    return this.authService.whoAmI(req, res);
  }

  @Get('health')
  health() {
    return this.authService.health();
  }
}