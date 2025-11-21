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
    console.log('✅ CORS: Frontend URL ajoutée:', process.env.FRONTEND_PUBLIC_URL);
  } else {
    console.warn('⚠️ CORS: FRONTEND_PUBLIC_URL non définie!');
  }

  // En production, accepter aussi les origines Railway par défaut
  if (process.env.NODE_ENV === 'production') {
    allowedOrigins.push('https://prodis-gps.up.railway.app');
    allowedOrigins.push('https://celebrated-friendship-production.up.railway.app');
  }

  console.log('🌐 CORS: Origines autorisées:', allowedOrigins);

  app.enableCors({
    origin: (origin, callback) => {
      // En production, accepter toutes les origines Railway si FRONTEND_PUBLIC_URL n'est pas définie
      if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_PUBLIC_URL) {
        if (!origin || origin.includes('.railway.app') || origin.includes('localhost')) {
          return callback(null, true);
        }
      }
      // Sinon, utiliser la liste des origines autorisées
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn('🚫 CORS: Origine bloquée:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
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
  console.log(`🔧 Configuration du port: PORT=${process.env.PORT || 'non défini (défaut: 3001)'}`);
  await app.listen(port);
  console.log(`🚀 Backend GPS démarré sur le port ${port}`);
}

bootstrap();
