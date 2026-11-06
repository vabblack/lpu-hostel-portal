import { BedDetail, GenderPolicy } from './hostel';

export type RoomCategory = 'STANDARD' | 'STUDIO_APARTMENT' | 'DORMITORY';
export type WashroomType = 'ATTACHED' | 'SHARED';
export type CoolingType = 'AIR_CONDITIONED' | 'AIR_COOLED';

export interface RoomSummary {
  id: number;
  room_number: string;
  hostel_id: number;
  hostel_name: string;
  hostel_code: string;
  gender_policy: GenderPolicy;
  gender_policy_display: string;
  block_name: string;
  floor_number: number;
  capacity: number;
  category: RoomCategory;
  category_display: string;
  washroom_type: WashroomType;
  washroom_type_display: string;
  is_air_conditioned: boolean;
  cooling_type: CoolingType;
  status: string;
  status_display: string;
  standard_fee: number | null;
  edb_fee: number | null;
  quota_kwh: number | null;
  vacant_beds_count: number;
  occupied_beds_count: number;
  is_full: boolean;
  facilities: string[];
  beds: BedDetail[];
}

export interface RoomFilterState {
  hostel_id?: string;
  gender?: string;
  seater?: string;
  cooling?: string;
  category?: string;
  washroom_type?: string;
  vacant_only?: boolean;
  search?: string;
}
