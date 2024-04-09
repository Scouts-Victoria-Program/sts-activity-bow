export const StatSetType = {
  trackerLocationMinutes: "TrackerLocation Minutes",
  longestTimeWithTrackerLocation: "Longest Time With TrackerLocation",
  longestTimeWithoutTrackerLocation: "Longest Time Without TrackerLocation",
  maxConcurrentTrackerLocations: "Max Concurrent TrackerLocations",
  trackerLocationVisibilityViolations: "TrackerLocation Visibility Violations",
  capturedLifeTokens: "Captured Life Tokens",
  missingLifeTokenViolations: "Missing Life Token Violations",
  respawns: "Respawns",
  gameOfChanceWins: "Game Of Chance Wins",
  gameOfChanceLoses: "Game Of Chance Loses",
  otherActions: "Other Actions",
} as const;
export type StatSetTypeKey = keyof typeof StatSetType;

export interface StatSet {
  raw: number;
  score: number;
  type: StatSetTypeKey;
  description: string;
  link: string;
}

export interface StatData {
  statTypes: typeof StatSetType;
  bases: {
    id: number;
    stats: Record<StatSetTypeKey, StatSet>;
    score: number;
  }[];
}
