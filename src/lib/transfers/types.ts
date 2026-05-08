import type { BlockchainAnchor } from "@/lib/lands/types";

export type TransferStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface TransferRecord {
  id: string;
  landId: string;
  parcelNumber: string;
  landTitle: string;
  fromOwnerId: string;
  fromOwnerName: string;
  fromOwnerNationalId: string;
  toOwnerName: string;
  toOwnerNationalId: string;
  reason: string;
  status: TransferStatus;
  initiatedById: string;
  initiatedByName: string;
  initiatedAt: string;
  decidedById?: string;
  decidedByName?: string;
  decidedAt?: string;
  decisionNotes?: string;
  /** Anchor created when the transfer was initiated. */
  initiationAnchor: BlockchainAnchor;
  /** Anchor created on approval — links to the new chain-of-custody event. */
  settlementAnchor?: BlockchainAnchor;
}

export interface InitiateTransferPayload {
  landId: string;
  toOwnerName: string;
  toOwnerNationalId: string;
  reason: string;
}
