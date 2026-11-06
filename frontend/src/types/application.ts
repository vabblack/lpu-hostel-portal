export interface RoomSelection {
  id: number;
  room_number: string;
  capacity: number;
  is_ac: boolean;
  category: string;
  standard_fee: number | null;
}

export interface ApplicationChoiceItem {
  id: number;
  priority: number;
  hostel_id: number;
  hostel_name: string;
  hostel_code: string;
  room: RoomSelection | null;
}

export interface HostelApplicationItem {
  id: number;
  cycle_name: string;
  academic_year: string;
  status: string;
  status_display: string;
  submitted_at: string;
  reviewed_at: string | null;
  review_notes: string;
  choices: ApplicationChoiceItem[];
}

export interface CycleInfo {
  id: number;
  name: string;
  academic_year: string;
  semester: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface CampusStats {
  total_hostels: number;
  total_rooms: number;
  total_beds: number;
  vacant_beds: number;
  occupied_beds: number;
  occupancy_rate: number;
  active_cycle_name: string;
}

export interface StudentDashboardStatus {
  has_active_application: boolean;
  latest_app_status: string | null;
  latest_app_status_display: string | null;
  has_allocation: boolean;
  allocated_hostel: string | null;
  allocated_room: string | null;
  allocated_bed: string | null;
}

export interface DashboardSummary {
  campus: CampusStats;
  student_status?: StudentDashboardStatus;
}
