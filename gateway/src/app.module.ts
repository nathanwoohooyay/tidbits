import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { GatewayAuthService } from './gateway-auth.service.js';
import { SystemHealthController } from './system-health.controller.js';
import { SystemHealthService } from './system-health.service.js';

@Module({
  imports: [],
  // SystemHealthController first: its route is inside AppController's /audit proxy.
  controllers: [SystemHealthController, AppController],
  providers: [AppService, GatewayAuthService, SystemHealthService],
})
export class AppModule {}
