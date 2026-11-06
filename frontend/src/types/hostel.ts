export type GenderPolicy = 'MALE' | 'FEMALE' | 'CO_ED';
export type HostelStatus = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';

export interface HostelSummary {
  id: number;
  name: string;
  code: string;
  gender_policy: GenderPolicy;
  gender_policy_display: string;
  status: HostelStatus;
  status_display: string;
  description: string;
  total_capacity: number;
  total_rooms: number;
  total_beds: number;
  vacant_beds: number;
  occupied_beds: number;
  occupancy_pct: number;
  ac_rooms_count: number;
  cooler_rooms_count: number;
  min_standard_fee: number | null;
  max_standard_fee: number | null;
}

export interface BedDetail {
  id: number;
  identifier: string;
  status: 'VACANT' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
  status_display: string;
}

export interface FloorRoomDetail {
  id: number;
  room_number: string;
  capacity: number;
  category: string;
  category_display: string;
  washroom_type: string;
  is_air_conditioned: boolean;
  cooling_type: string;
  status: string;
  standard_fee: number | null;
  edb_fee: number | null;
  quota_kwh: number | null;
  vacant_beds_count: number;
  occupied_beds_count: number;
  is_full: boolean;
  beds: BedDetail[];
}

export interface FloorDetail {
  id: number;
  floor_number: number;
  label: string;
  rooms: FloorRoomDetail[];
}

export interface BlockDetail {
  id: number;
  name: string;
  floors: FloorDetail[];
}

export interface HostelDetail {
  id: number;
  name: string;
  code: string;
  gender_policy: GenderPolicy;
  gender_policy_display: string;
  status: HostelStatus;
  status_display: string;
  description: string;
  total_capacity: number;
  total_beds: number;
  vacant_beds: number;
  occupied_beds: number;
  blocks: BlockDetail[];
}
