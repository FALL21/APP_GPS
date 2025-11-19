export interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'super_admin';
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdById?: number;
}

export interface Location {
  id: number;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  address?: string;
  userId: number;
  timestamp: string;
  user?: User;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role?: 'user' | 'admin' | 'super_admin';
  isActive?: boolean;
}

export interface UpdateUserData {
  email?: string;
  password?: string;
  name?: string;
  role?: 'user' | 'admin' | 'super_admin';
  isActive?: boolean;
}

export interface UsersListResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GpsActivity {
  userId: number;
  userName: string;
  userEmail: string;
  userRole: string;
  isTracking: boolean;
  lastUpdate: string;
  lastLocation?: {
    latitude: number;
    longitude: number;
  };
  totalLocations?: number;
}
