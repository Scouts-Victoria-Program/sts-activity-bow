export interface TrackerCreateInput {
  name: string;
  scoreModifier: number;
}

export interface TrackerUpdateInput {
  id: number;
  name: string;
  scoreModifier: number;
}

export interface TrackerData {
  id: number;
  name: string;
  scoreModifier: number;
}
