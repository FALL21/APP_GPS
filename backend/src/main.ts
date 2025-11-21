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

  // Railway expose le port 3001 dans les settings de networking
  // On force le port 3001 pour correspondre au port exposé
  // Note: Si Railway définit PORT=8080, on l'ignore car le port exposé est 3001
  const port = 3001;
  console.log(`🔧 Configuration du port: PORT=${process.env.PORT || 'non défini'} -> Forcé à 3001 (port exposé par Railway)`);
  await app.listen(port, '0.0.0.0'); // Écouter sur toutes les interfaces
  console.log(`🚀 Backend GPS démarré sur le port ${port} (accessible sur 0.0.0.0)`);
  console.log(`✅ Health check disponible sur: http://0.0.0.0:${port}/health`);
  console.log(`✅ API disponible sur: http://0.0.0.0:${port}/`);
}

bootstrap();
