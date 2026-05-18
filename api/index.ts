import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const server = express();

let appInstance: any;

async function bootstrapServerless() {
  if (!appInstance) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(server),
    );

    // ── Security headers ──────────────────────────────────────────────────
    app.use(helmet({
      contentSecurityPolicy: false, // Turn off CSP for Swagger docs to load correctly in Vercel
    }));

    app.setGlobalPrefix('api');

    // ── CORS ──────────────────────────────────────────────────────────────
    const allowedOrigins: string[] = [];
    if (process.env.FRONTEND_URL) {
      const origin = process.env.FRONTEND_URL.trim();
      allowedOrigins.push(origin);
      if (origin.endsWith('/')) {
        allowedOrigins.push(origin.slice(0, -1));
      } else {
        allowedOrigins.push(`${origin}/`);
      }
    } else {
      allowedOrigins.push(
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
      );
    }

    app.enableCors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        const originTrimmed = origin.trim();

        // 1. Check if matches allowedOrigins list
        const isAllowed = allowedOrigins.some(
          (o) => o.toLowerCase() === originTrimmed.toLowerCase()
        );

        // 2. Also dynamically allow any clinsync Vercel production or deployment preview domain
        const isVercelAllowed = /^https:\/\/(clinsync|clinsync-frontend)(-[\w-]+)?\.vercel\.app\/?$/i.test(
          originTrimmed
        );

        if (isAllowed || isVercelAllowed) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // ── Global pipes & filters ────────────────────────────────────────────
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.useGlobalFilters(new GlobalExceptionFilter());

    // ── Health check ──────────────────────────────────
    const httpAdapter = app.getHttpAdapter();
    httpAdapter.get('/health', (_req, res) => {
      res.status(200).json({
        status: 'ok',
        service: 'clinsync-backend',
        timestamp: new Date().toISOString(),
      });
    });

    // ── Swagger ───────────────────────────────────────────────────────────
    const config = new DocumentBuilder()
      .setTitle('ClinSync API')
      .setDescription(
        'RESTful API for the ClinSync medical appointment scheduling system.\n\n' +
        'Use the **Authorize** button to authenticate with a Bearer JWT token.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth', 'Authentication and session management')
      .addTag('Appointments', 'Patient appointment lifecycle')
      .addTag('Areas', 'Medical specialty areas')
      .addTag('Doctors', 'Medical professionals')
      .addTag('Schedules', 'Availability scheduling')
      .addTag('Admin', 'Administrative dashboard and management')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.init();
    appInstance = server;
  }
  return appInstance;
}

export default async function handler(req: any, res: any) {
  const expressApp = await bootstrapServerless();
  return expressApp(req, res);
}
