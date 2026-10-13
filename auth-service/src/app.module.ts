import { Module } from '@nestjs/common';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { RoleController } from './auth/role.controller';

@Module({
  controllers: [AuthController, RoleController],
  providers: [AuthService],
})
export class AppModule {}