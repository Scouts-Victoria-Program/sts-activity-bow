export interface BaseCreateInput {
  name: string;
  flagZoneLat?: number | null;
  flagZoneLong?: number | null;
}

export interface BaseUpdateInput {
  id: number;
  name: string;
  flagZoneLat?: number | null;
  flagZoneLong?: number | null;
}

export interface BaseData {
  id: number;
  name: string;
  flagZoneLat?: number | null;
  flagZoneLong?: number | null;
}
