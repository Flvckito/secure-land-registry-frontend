export type LandStatus = "registered" | "pending_transfer" | "disputed";

export type LandUse = "residential" | "agricultural" | "commercial" | "industrial" | "mixed";

export interface BlockchainAnchor {
  txHash: string;
  blockNumber: number;
  blockHash: string;
  network: string;
  timestamp: string;
}

export interface LandHistoryEvent {
  id: string;
  type: "registered" | "transferred" | "updated" | "verified";
  actorId: string;
  actorName: string;
  notes?: string;
  anchor: BlockchainAnchor;
  at: string;
}

export interface LandRecord {
  id: string;
  parcelNumber: string;
  title: string;
  ownerId: string;
  ownerName: string;
  ownerNationalId: string;
  location: string;
  district: string;
  region: string;
  areaSqm: number;
  use: LandUse;
  status: LandStatus;
  description?: string;
  registeredById: string;
  registeredByName: string;
  createdAt: string;
  updatedAt: string;
  anchor: BlockchainAnchor;
  history: LandHistoryEvent[];
}

export interface RegisterLandPayload {
  parcelNumber: string;
  title: string;
  ownerName: string;
  ownerNationalId: string;
  location: string;
  district: string;
  region: string;
  areaSqm: number;
  use: LandUse;
  description?: string;
}
