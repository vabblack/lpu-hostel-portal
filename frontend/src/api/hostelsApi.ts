import { apiClient } from './client';
import { HostelSummary, HostelDetail } from '../types/hostel';
import { RoomSummary, RoomFilterState } from '../types/room';

export const hostelsApi = {
  getHostels: (params?: { gender?: string; status?: string }) =>
    apiClient<{ hostels: HostelSummary[]; count: number }>('/api/hostels/', {
      params,
    }),

  getHostelDetail: (id: number) =>
    apiClient<{ hostel: HostelDetail }>(`/api/hostels/${id}/`),

  getRooms: (filters?: RoomFilterState) =>
    apiClient<{ rooms: RoomSummary[]; count: number }>('/api/rooms/', {
      params: filters ? {
        hostel_id: filters.hostel_id,
        gender: filters.gender,
        seater: filters.seater,
        cooling: filters.cooling,
        category: filters.category,
        washroom_type: filters.washroom_type,
        vacant_only: filters.vacant_only ? 'true' : undefined,
        q: filters.search,
      } : undefined,
    }),

  getRoomDetail: (id: number) =>
    apiClient<{ room: RoomSummary }>(`/api/rooms/${id}/`),
};
