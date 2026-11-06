export type UserRole = 'STUDENT' | 'WARDEN' | 'ADMIN';

export interface ActiveAllocation {
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
}

export interface StudentDetails {
  id: number;
  student_id: string;
  full_name: string;
  gender: string;
  gender_display: string;
  enrollment_status: string;
  cgpa: number | null;
  phone_number: string;
  branch: string;
  department: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  profile_completed: boolean;
  has_roommate_preferences: boolean;
  active_allocation: ActiveAllocation | null;
}

export interface WardenHostelAssignment {
  id: number;
  name: string;
  code: string;
  can_approve: boolean;
}

export interface WardenDetails {
  hostels: WardenHostelAssignment[];
}

export interface User {
  id: number;
  email: string;
  student_id_login: string | null;
  role: UserRole;
  is_staff: boolean;
  is_superuser: boolean;
  student?: StudentDetails;
  warden?: WardenDetails;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  csrfToken: string | null;
}
