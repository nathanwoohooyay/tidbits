import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { RoleController } from './auth/role.controller';
import { AuthGuard } from './authorization/auth.guard';
import { RoleGuard } from './authorization/role.guard';

@Module({
  controllers: [AuthController, RoleController],
  providers: [AuthService, AuthGuard, RoleGuard],
})
export class AppModule {}