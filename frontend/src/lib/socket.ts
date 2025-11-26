import { io, Socket } from 'socket.io-client';
import { authApi, CreateLocationDto } from './api';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

// Log pour vérifier l'URL utilisée (toujours affiché)
if (typeof window !== 'undefined') {
  console.log('🔌 WebSocket URL configurée:', WS_URL);
  if (WS_URL.includes('localhost') && window.location.hostname !== 'localhost') {
    console.error('⚠️ ATTENTION: La WebSocket URL pointe vers localhost en production! Vérifiez NEXT_PUBLIC_WS_URL dans Railway.');
  }
}

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
      console.log('✅ Connecté au serveur WebSocket, socket ID:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Déconnecté du serveur WebSocket');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Erreur de connexion WebSocket:', error);
    });

    // Logger tous les événements pour déboguer
    this.socket.onAny((eventName, ...args) => {
      if (eventName !== 'location_updated') {
        console.log(`[Socket] Event received: ${eventName}`, args);
      }
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
    if (!this.socket) {
      this.connect();
    }
    
    // Toujours attacher le listener, même si pas encore connecté
    // Il sera actif dès que la connexion sera établie
    this.socket?.on('location_updated', (data: { userId: number; location: any }) => {
      console.log('[Socket] location_updated event received:', { userId: data.userId, locationId: data.location?.id });
      callback(data);
    });
    
    // Si déjà connecté, le listener est actif immédiatement
    if (this.socket?.connected) {
      console.log('[Socket] Listener attached to connected socket');
    } else {
      // Sinon, attendre la connexion
      this.socket?.once('connect', () => {
        console.log('[Socket] Socket connected, location_updated listener is now active');
      });
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
