import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Activer CORS pour permettre les connexions depuis le frontend
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:8080',
    'http://frontend:3000',
  ];

  // Ajouter l'URL du frontend depuis les variables d'environnement si définie
  if (process.env.FRONTEND_PUBLIC_URL) {
    allowedOrigins.push(process.env.FRONTEND_PUBLIC_URL);
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validation globale des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Backend GPS démarré sur le port ${port}`);
}

bootstrap();
