export interface TrackerLocationCreateInput {
  datetime: string;
  windowSize: number;
  scoreModifier: number;
  lat: number;
  long: number;
  trackerId: number;
  baseId: number | null;
  distance: number;
}

export interface TrackerLocationUpdateInput {
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

export interface TrackerLocationData {
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
