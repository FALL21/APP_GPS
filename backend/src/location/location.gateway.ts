import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:8080',
        'http://frontend:3000',
        'https://prodis-gps.up.railway.app',
      ];
      // En production, accepter aussi les origines Railway
      if (process.env.NODE_ENV === 'production') {
        if (!origin || origin.includes('.railway.app') || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
      }
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  },
})
export class LocationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('LocationGateway');
  private connectedClients = new Map<string, number>(); // socketId -> userId

  constructor(private readonly locationService: LocationService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connecté: ${client.id}`);
    // L'authentification sera gérée côté client via le token JWT
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client déconnecté: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('join_tracking')
  handleJoinTracking(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number },
  ) {
    this.connectedClients.set(client.id, data.userId);
    client.join(`user_${data.userId}`);
    this.logger.log(`Client ${client.id} suit l'utilisateur ${data.userId}`);
  }

  @SubscribeMessage('leave_tracking')
  handleLeaveTracking(@ConnectedSocket() client: Socket) {
    const userId = this.connectedClients.get(client.id);
    if (userId) {
      client.leave(`user_${userId}`);
      this.connectedClients.delete(client.id);
    }
  }

  @SubscribeMessage('update_location')
  async handleUpdateLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number; location: CreateLocationDto },
  ) {
    try {
      // Sauvegarder la position
      const location = await this.locationService.create(
        data.userId,
        data.location,
      );

      // Diffuser à tous les clients qui suivent spécifiquement cet utilisateur
      const payload = {
        userId: data.userId,
        location,
      };
      this.server.to(`user_${data.userId}`).emit('location_updated', payload);

      // Diffuser également globalement pour les tableaux de bord admin/super admin
      this.server.emit('location_updated', payload);

      return { success: true, location };
    } catch (error) {
      this.logger.error('Erreur lors de la mise à jour de position', error);
      return { success: false, error: error.message };
    }
  }

  // Méthode pour diffuser une position depuis d'autres parties de l'application
  broadcastLocation(userId: number, location: any) {
    const payload = { userId, location };
    this.logger.log(`Broadcasting location update for user ${userId} to ${this.server.sockets.sockets.size} connected clients`);
    // Clients abonnés à cet utilisateur
    this.server.to(`user_${userId}`).emit('location_updated', payload);
    // Dashboards admin / super admin (écoutent globalement)
    this.server.emit('location_updated', payload);
  }
}
