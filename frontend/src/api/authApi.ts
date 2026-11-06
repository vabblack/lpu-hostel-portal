import { apiClient } from './client';
import { User } from '../types/auth';

export interface MeResponse {
  authenticated: boolean;
  user: User | null;
  csrf_token: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: User;
  csrf_token: string;
}

export interface RegisterPayload {
  student_id: string;
  institutional_email: string;
  password: string;
  confirm_password: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export const authApi = {
  getMe: () => apiClient<MeResponse>('/api/auth/me/'),
  
  login: (email_or_id: string, password: string) =>
    apiClient<LoginResponse>('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email_or_id, password }),
    }),

  logout: () =>
    apiClient<{ success: boolean; message: string }>('/api/auth/logout/', {
      method: 'POST',
    }),

  register: (payload: RegisterPayload) =>
    apiClient<LoginResponse>('/api/auth/register/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
