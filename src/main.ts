import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static files (e.g. generated PDF certificates)
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Global API prefix
  app.setGlobalPrefix('api/v1');

  // CORS — only allow from frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Global validation pipe (whitelist, transform)
  app.useGlobalPipes(new ValidationPipe());

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global response interceptor (success envelope)
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Swagger setup at /api
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SkillForge API')
    .setDescription('AI-Powered Corporate Training & Certification Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 SkillForge API running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs at:           http://localhost:${port}/api`);
}

bootstrap();
