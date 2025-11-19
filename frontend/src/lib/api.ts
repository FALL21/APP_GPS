import axios from 'axios';
import Cookies from 'js-cookie';
import { AuthResponse, LoginCredentials, RegisterData, Location, User } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    if (response.data.accessToken) {
      Cookies.set('token', response.data.accessToken, { expires: 7 });
      Cookies.set('user', JSON.stringify(response.data.user), { expires: 7 });
    }
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    if (response.data.accessToken) {
      Cookies.set('token', response.data.accessToken, { expires: 7 });
      Cookies.set('user', JSON.stringify(response.data.user), { expires: 7 });
    }
    return response.data;
  },

  logout: () => {
    Cookies.remove('token');
    Cookies.remove('user');
  },

  getCurrentUser: (): any => {
    const userStr = Cookies.get('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: (): string | undefined => {
    return Cookies.get('token');
  },
};

export interface CreateLocationDto {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  address?: string;
}

export const locationApi = {
  create: async (location: CreateLocationDto): Promise<Location> => {
    const response = await api.post<Location>('/locations', location);
    return response.data;
  },

  getAll: async (userId?: number): Promise<Location[]> => {
    const url = userId ? `/locations?userId=${userId}` : '/locations';
    const response = await api.get<Location[]>(url);
    return response.data;
  },

  getLatest: async (userId?: number): Promise<Location> => {
    const url = userId ? `/locations/latest?userId=${userId}` : '/locations/latest';
    const response = await api.get<Location>(url);
    return response.data;
  },

  getHistory: async (userId?: number, limit: number = 100): Promise<Location[]> => {
    const url = userId 
      ? `/locations/history?userId=${userId}&limit=${limit}`
      : `/locations/history?limit=${limit}`;
    const response = await api.get<Location[]>(url);
    return response.data;
  },

  getActivity: async (): Promise<any[]> => {
    const response = await api.get<any[]>('/locations/activity');
    return response.data;
  },

  getRoute: async (userId: number, range: '24h' | '48h' | '72h' = '24h'): Promise<Location[]> => {
    const response = await api.get<Location[]>(`/locations/route?userId=${userId}&range=${range}`);
    return response.data;
  },
};

export const usersApi = {
  list: async (params?: {
    search?: string;
    role?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<any> => {
    // Nettoyer les paramètres: ne pas envoyer de chaînes vides ou undefined
    const cleanParams: any = {};
    if (params) {
      if (params.search && params.search.trim() !== '') cleanParams.search = params.search.trim();
      if (params.role && params.role !== '') cleanParams.role = params.role;
      if (typeof params.isActive === 'boolean') cleanParams.isActive = params.isActive;
      if (params.page) cleanParams.page = params.page;
      if (params.limit) cleanParams.limit = params.limit;
    }
    const response = await api.get<any>('/auth/users', { params: cleanParams });
    return response.data;
  },

  get: async (id: number): Promise<User> => {
    const response = await api.get<User>(`/auth/users/${id}`);
    return response.data;
  },

  create: async (data: any): Promise<User> => {
    const response = await api.post<User>('/auth/users', data);
    return response.data;
  },

  update: async (id: number, data: any): Promise<User> => {
    const response = await api.put<User>(`/auth/users/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/auth/users/${id}`);
  },
};

export default api;
