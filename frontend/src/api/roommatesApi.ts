import { apiClient } from './client';
import {
  RoommatePreferences,
  CandidateMatch,
  RoommateRequestItem,
  RoommateGroupData,
} from '../types/roommate';

export interface PreferencesResponse {
  has_preferences: boolean;
  preferences: RoommatePreferences | null;
}

export interface DiscoverResponse {
  has_preferences: boolean;
  active_cycle: string | null;
  search_result: CandidateMatch | null;
  recommendations: CandidateMatch[];
}

export interface RequestsResponse {
  received_requests: RoommateRequestItem[];
  sent_requests: RoommateRequestItem[];
}

export const roommatesApi = {
  getPreferences: () => apiClient<PreferencesResponse>('/api/roommates/preferences/'),

  savePreferences: (prefs: RoommatePreferences) =>
    apiClient<{ success: boolean; message: string; preferences: RoommatePreferences }>(
      '/api/roommates/preferences/',
      {
        method: 'POST',
        body: JSON.stringify(prefs),
      }
    ),

  discoverCandidates: (searchQuery?: string) =>
    apiClient<DiscoverResponse>('/api/roommates/discover/', {
      params: searchQuery ? { q: searchQuery } : undefined,
    }),

  getRequests: () => apiClient<RequestsResponse>('/api/roommates/requests/'),

  sendRequest: (target_student_id: string) =>
    apiClient<{ success: boolean; message: string; request_id: number }>(
      '/api/roommates/requests/send/',
      {
        method: 'POST',
        body: JSON.stringify({ target_student_id }),
      }
    ),

  respondRequest: (requestId: number, action: 'ACCEPT' | 'REJECT') =>
    apiClient<{ success: boolean; message: string; status: string }>(
      `/api/roommates/requests/${requestId}/respond/`,
      {
        method: 'POST',
        body: JSON.stringify({ action }),
      }
    ),

  cancelRequest: (requestId: number) =>
    apiClient<{ success: boolean; message: string; status: string }>(
      `/api/roommates/requests/${requestId}/cancel/`,
      {
        method: 'POST',
      }
    ),

  getGroup: () => apiClient<{ group: RoommateGroupData | null }>('/api/roommates/group/'),
};
