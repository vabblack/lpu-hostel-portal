export type PassType = 'DAY_PASS' | 'NIGHT_OUT' | 'LEAVE' | 'EMERGENCY';

export type GatePassStatus =
  | 'SUBMITTED'
  | 'PENDING_PARENT'
  | 'PENDING_WARDEN'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTIVE_OUTSIDE'
  | 'CLOSED_RETURNED'
  | 'OVERDUE';

export interface GatePassItem {
  id: number;
  pass_type: PassType;
  pass_type_display: string;
  destination: string;
  reason: string;
  departure_date: string;
  expected_return_date: string;
  actual_exit_time: string | null;
  actual_return_time: string | null;
  status: GatePassStatus;
  status_display: string;
  qr_token: string;
  parent_consent_at: string | null;
  warden_approved_at: string | null;
  warden_remarks: string;
  created_at: string;
}

export type RMSTradeCategory =
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'CARPENTRY'
  | 'CIVIL'
  | 'HVAC'
  | 'PEST_CONTROL'
  | 'CLEANING'
  | 'OTHER';

export type RMSTicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';

export type RMSTicketStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'CLOSED';

export interface RMSTicketItem {
  id: number;
  ticket_number: string;
  room_number: string;
  hostel_name: string;
  hostel_code: string;
  category: RMSTradeCategory;
  category_display: string;
  priority: RMSTicketPriority;
  priority_display: string;
  status: RMSTicketStatus;
  status_display: string;
  title: string;
  description: string;
  sla_deadline: string;
  is_escalated: boolean;
  resolved_at: string | null;
  resolution_notes: string;
  created_at: string;
}

export interface MessCuisineOption {
  id: string;
  name: string;
  description: string;
  monthly_fee: number;
  tags: string[];
}

export interface EconomicsCalculationResult {
  specification: {
    category: string;
    seater_count: number;
    cooling_type: string;
    is_edb_eligible: boolean;
  };
  pricing: {
    standard_fee: number;
    edb_fee: number;
    edb_savings: number;
    applicable_hostel_fee: number;
  };
  electricity: {
    quota_kwh: number;
    consumed_kwh: number;
    overage_kwh: number;
    rate_per_unit: number;
    total_room_overage_charge: number;
    per_resident_share: number;
  };
  mess: {
    cuisine_id: string;
    cuisine_name: string;
    meal_plan: string;
    meal_plan_label: string;
    monthly_fee: number;
    session_10_month_fee: number;
    available_cuisines: MessCuisineOption[];
  };
  summary: {
    total_annual_cost: number;
  };
}

