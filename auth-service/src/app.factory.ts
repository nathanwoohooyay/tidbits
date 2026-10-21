import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

const allowedOrigins = (process.env.AUTH_CORS_ORIGINS || 'http://localhost:8084,http://localhost:4200,http://localhost:8080,http://localhost:9875')
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

export function configureApp(app: INestApplication) {
  app.use(cookieParser());
  app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    return next();
  });
}

export async function createApp() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  return app;
}