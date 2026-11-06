import { apiClient } from './client';
import { HostelApplicationItem, CycleInfo, DashboardSummary } from '../types/application';

export interface ApplicationChoicePayload {
  priority: number;
  hostel_id: number;
  room_id?: number;
}

export const applicationsApi = {
  getApplications: () =>
    apiClient<{ active_cycle: CycleInfo | null; applications: HostelApplicationItem[] }>(
      '/api/applications/'
    ),

  submitApplication: (choices: ApplicationChoicePayload[]) =>
    apiClient<{ success: boolean; message: string; application_id: number; status: string }>(
      '/api/applications/',
      {
        method: 'POST',
        body: JSON.stringify({ choices }),
      }
    ),

  getDashboardSummary: () => apiClient<DashboardSummary>('/api/dashboard/summary/'),
};
