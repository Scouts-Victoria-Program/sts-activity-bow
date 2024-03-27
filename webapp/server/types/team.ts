export interface TeamCreateInput {
  name: string;
  flagZoneLat?: number | null;
  flagZoneLong?: number | null;
}

export interface TeamUpdateInput {
  id: number;
  name: string;
  flagZoneLat?: number | null;
  flagZoneLong?: number | null;
}

export interface TeamData {
  id: number;
  name: string;
  flagZoneLat?: number | null;
  flagZoneLong?: number | null;
}
