export interface FlagCreateInput {
  datetime: string;
  windowSize: number;
  scoreModifier: number;
  lat: number;
  long: number;
  trackerId: number;
  baseId: number | null;
  distance: number;
}

export interface FlagUpdateInput {
  id: number;
  datetime: string;
  windowSize: number;
  scoreModifier: number;
  lat: number;
  long: number;
  trackerId: number;
  baseId: number | null;
  distance: number;
}

export interface FlagData {
  id: number;
  datetime: string;
  windowSize: number;
  scoreModifier: number;
  lat: number;
  long: number;
  trackerId: number;
  baseId: number | null;
  distance: number;
}
