import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ─── API Prefix ────────────────────────────────
  const apiPrefix = process.env.API_PREFIX ?? 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // ─── CORS ──────────────────────────────────────
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  });

  // ─── Global Validation Pipe ────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ─── Swagger Documentation ─────────────────────
  const config = new DocumentBuilder()
    .setTitle('ClinicFlow API')
    .setDescription('ClinicFlow Clinic Management SaaS — REST API Documentation')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  // ─── Start Server ──────────────────────────────
  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`\n🚀 ClinicFlow API running on: http://localhost:${port}/${apiPrefix}`);
  console.log(`📚 Swagger Docs:              http://localhost:${port}/${apiPrefix}/docs\n`);
}

bootstrap();
