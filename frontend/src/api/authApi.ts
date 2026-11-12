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

export interface GoogleAuthPayload {
  credential?: string;
  email?: string;
  name?: string;
  student_id?: string;
}

export interface UmsImportPayload {
  allotment_text?: string;
  hostel_code?: string;
  room_number?: string;
  bed_letter?: string;
  seater?: number;
  is_ac?: boolean;
  slip_id?: string;
}

export interface UmsImportResponse {
  success: boolean;
  message: string;
  slip_id: string;
  allocation: {
    id: number;
    hostel_name: string;
    hostel_code: string;
    room_number: string;
    bed_identifier: string;
    seater: number;
    is_ac: boolean;
    cooling_type: string;
    start_date: string;
    end_date: string;
  };
  user: User;
  csrf_token: string;
}

export const authApi = {
  getMe: () => apiClient<MeResponse>('/api/auth/me/'),
  
  login: (email_or_id: string, password: string) =>
    apiClient<LoginResponse>('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email_or_id, password }),
    }),

  googleLogin: (payload: GoogleAuthPayload) =>
    apiClient<LoginResponse>('/api/auth/google/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  importUmsAllotment: (payload: UmsImportPayload) =>
    apiClient<UmsImportResponse>('/api/students/import-allotment/', {
      method: 'POST',
      body: JSON.stringify(payload),
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

  updateProfile: (payload: {
    full_name?: string;
    student_id?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
  }) =>
    apiClient<LoginResponse>('/api/auth/profile/update/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
