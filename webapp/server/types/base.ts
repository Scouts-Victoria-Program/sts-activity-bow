export interface BaseCreateInput {
  name: string;
  lat?: number | null;
  long?: number | null;
}

export interface BaseUpdateInput {
  id: number;
  name: string;
  lat?: number | null;
  long?: number | null;
}

export interface BaseData {
  id: number;
  name: string;
  lat?: number | null;
  long?: number | null;
}
