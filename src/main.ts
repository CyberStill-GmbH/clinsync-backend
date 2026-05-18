import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Security headers ──────────────────────────────────────────────────
  app.use(helmet());

  app.setGlobalPrefix('api');

  // ── CORS ──────────────────────────────────────────────────────────────
  const allowedOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL]
    : [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
      ];

  app.enableCors({
    origin: allowedOrigins,
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

  // ── Health check (no auth required) ──────────────────────────────────
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

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 ClinSync API running at http://localhost:${port}/api`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
  console.log(`❤️  Health check at http://localhost:${port}/health`);
}

bootstrap();