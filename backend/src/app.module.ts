import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { LocationModule } from './location/location.module';
import { User } from './auth/entities/user.entity';
import { Location } from './location/entities/location.entity';
import { LocationGateway } from './location/location.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      username: process.env.DB_USERNAME || 'gpsuser',
      password: process.env.DB_PASSWORD || 'gpspassword',
      database: process.env.DB_DATABASE || 'gps_tracking',
      entities: [User, Location],
      synchronize: process.env.NODE_ENV !== 'production', // Ne pas utiliser en production
      autoLoadEntities: true,
    }),
    AuthModule,
    LocationModule,
  ],
  controllers: [AppController],
  providers: [AppService, LocationGateway],
})
export class AppModule {}
