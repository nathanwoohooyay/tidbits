import { Body, Controller, Get, HttpCode, Inject, Patch, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';

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
  async changePassword(@Req() req: Request, @Res() res: Response, @Body() body: ChangePasswordBody) {
    return this.authService.changePassword(req, res, body);
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