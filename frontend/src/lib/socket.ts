import { io, Socket } from 'socket.io-client';
import { authApi, CreateLocationDto } from './api';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(WS_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('✅ Connecté au serveur WebSocket');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Déconnecté du serveur WebSocket');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Erreur de connexion WebSocket:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinTracking(userId: number) {
    if (this.socket) {
      this.socket.emit('join_tracking', { userId });
    }
  }

  leaveTracking() {
    if (this.socket) {
      this.socket.emit('leave_tracking');
    }
  }

  updateLocation(userId: number, location: CreateLocationDto) {
    if (this.socket) {
      this.socket.emit('update_location', { userId, location });
    }
  }

  onLocationUpdate(callback: (data: { userId: number; location: any }) => void) {
    if (this.socket) {
      this.socket.on('location_updated', callback);
    }
  }

  offLocationUpdate(callback?: (data: { userId: number; location: any }) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off('location_updated', callback);
      } else {
        this.socket.off('location_updated');
      }
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
