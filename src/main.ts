import { config } from 'dotenv';
config(); // Charge les variables d'environnement depuis le fichier .env

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';


async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Important pour les webhooks Stripe
  });

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  // Vérification des variables d'environnement critiques
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not defined in environment variables');
    process.exit(1);
  }

  // Swagger Configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('BAZA E-Commerce API')
    .setDescription('API documentation pour la boutique BAZA')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', "Endpoints d'authentification")
    .addTag('Products', 'Gestion des produits')
    .addTag('Categories', 'Gestion des catégories')
    .addTag('Cart', 'Gestion du panier')
    .addTag('Orders', 'Gestion des commandes')
    .addTag('Payments', 'Gestion des paiements')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'BAZA API Docs',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #2C1810; }
    `,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Server running on http://localhost:${port}/api`);
  console.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  console.error('Failed to start the server:', err);
  process.exit(1);
});
