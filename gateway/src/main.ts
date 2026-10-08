import { NestFactory } from '@nestjs/core';
import express from 'express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Allow JSON primitives (e.g. 25.25) for proxied APIs that accept raw numeric bodies.
  app.use(express.json({ strict: false }));

  const corsOrigins = (process.env.GATEWAY_CORS_ORIGINS || 'http://localhost:8084,http://localhost:4200,http://localhost:8080,http://localhost:9875')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
