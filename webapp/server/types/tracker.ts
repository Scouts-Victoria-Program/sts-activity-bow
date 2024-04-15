export interface TrackerCreateInput {
  deviceId: string;
  name: string;
  scoreModifier: number;
}

export interface TrackerUpdateInput {
  id: number;
  deviceId: string;
  name: string;
  scoreModifier: number;
}

export interface TrackerData {
  id: number;
  deviceId: string;
  name: string;
  scoreModifier: number;
}
