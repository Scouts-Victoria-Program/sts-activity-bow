export interface BowAlertCreateInput {
  datetime: string;
  faction: string;
  expiry: string;
  description: string;
  baseId: number;
}

export interface BowAlertUpdateInput {
  id: number;
  datetime: string;
  faction: string;
  expiry: string;
  description: string;
  baseId: number;
}

export interface BowAlertData {
  id: number;
  datetime: string;
  faction: string;
  expiry: string;
  description: string;
  baseId: number;
}
