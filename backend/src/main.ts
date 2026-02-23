import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { SanitizePipe } from './common/pipes/sanitize.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  
  // Security headers
  app.use(helmet());

  // Structured logging
  app.useLogger(app.get(Logger));

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new SanitizePipe(),
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global error filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger OpenAPI Setup
  const config = new DocumentBuilder()
    .setTitle('Subscription Tracker API')
    .setDescription('The API documentation for the Subscription Tracker application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  app.get(Logger).log(`Backend is running on: http://localhost:${port}`);
}
bootstrap();
