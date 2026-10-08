import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { GatewayAuthService } from './gateway-auth.service.js';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, GatewayAuthService],
})
export class AppModule {}
