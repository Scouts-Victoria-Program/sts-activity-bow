export interface BaseCreateInput {
  name: string;
  trackerlocationZoneLat?: number | null;
  trackerlocationZoneLong?: number | null;
}

export interface BaseUpdateInput {
  id: number;
  name: string;
  trackerlocationZoneLat?: number | null;
  trackerlocationZoneLong?: number | null;
}

export interface BaseData {
  id: number;
  name: string;
  trackerlocationZoneLat?: number | null;
  trackerlocationZoneLong?: number | null;
}
