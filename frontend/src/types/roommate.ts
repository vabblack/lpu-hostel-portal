export type FoodPreference = 'VEGETARIAN' | 'NON_VEGETARIAN' | 'FLEXIBLE';

export interface RoommatePreferences {
  sleeping_schedule: number; // 1-5
  cleanliness: number;       // 1-5
  study_habits: number;      // 1-5
  noise_tolerance: number;   // 1-5
  food_preference: FoodPreference;
  social_preference: number; // 1-5
  temperature_pref: number;  // 1-5
}

export interface CandidateMatch {
  student_id: string;
  full_name: string;
  branch: string;
  cgpa: number | null;
  score: number | null; // e.g. 85.5
  is_room_aligned: boolean;
  target_room?: string | null;
  has_pending_request: boolean;
}

export interface RoommateRequestItem {
  id: number;
  other_student_id: string;
  other_full_name: string;
  other_branch: string;
  cycle_name: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  status_display: string;
  created_at: string;
  responded_at: string | null;
}

export interface RoommateGroupMemberItem {
  student_id: string;
  full_name: string;
  branch: string;
  joined_at: string;
}

export interface RoommateGroupData {
  id: number;
  is_confirmed: boolean;
  target_room: {
    id: number;
    room_number: string;
    hostel_name: string;
    capacity: number;
  };
  members: RoommateGroupMemberItem[];
  member_count: number;
  capacity: number;
}
