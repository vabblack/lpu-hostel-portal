import { apiClient } from './client';
import {
  GatePassItem,
  RMSTicketItem,
  EconomicsCalculationResult,
  PassType,
  RMSTradeCategory,
  RMSTicketPriority,
  RMSTicketStatus,
} from '../types/living';

export const livingApi = {
  // Gate Passes
  getGatePasses: () => apiClient<{ gate_passes: GatePassItem[] }>('/api/gatepass/'),

  createGatePass: (data: {
    pass_type: PassType;
    destination: string;
    reason: string;
    departure_date: string;
    expected_return_date: string;
  }) =>
    apiClient<{ message: string; gate_pass: Partial<GatePassItem> }>('/api/gatepass/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  gatePassAction: (
    id: number,
    action: 'parent_consent' | 'warden_approve' | 'warden_reject' | 'security_exit' | 'security_return' | 'cancel',
    remarks?: string
  ) =>
    apiClient<{ message: string; status: string }>(`/api/gatepass/${id}/action/`, {
      method: 'POST',
      body: JSON.stringify({ action, remarks }),
    }),

  // RMS Maintenance Tickets
  getRMSTickets: () => apiClient<{ tickets: RMSTicketItem[] }>('/api/rms/tickets/'),

  createRMSTicket: (data: {
    title: string;
    description: string;
    category: RMSTradeCategory;
    priority: RMSTicketPriority;
    room_id?: number;
  }) =>
    apiClient<{ message: string; ticket: Partial<RMSTicketItem> }>('/api/rms/tickets/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRMSTicketStatus: (id: number, status: RMSTicketStatus, notes?: string) =>
    apiClient<{ message: string; status: string }>(`/api/rms/tickets/${id}/update/`, {
      method: 'POST',
      body: JSON.stringify({ status, notes }),
    }),

  // Residential Economics & Overage Calculator
  calculateEconomics: (params: {
    category?: string;
    seater_count?: number;
    cooling_type?: string;
    is_edb_eligible?: boolean;
    mess_cuisine?: string;
    meal_plan?: string;
    estimated_kwh?: number;
  }) =>
    apiClient<EconomicsCalculationResult>('/api/economics/calculator/', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
};

