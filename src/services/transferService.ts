/**
 * Mock ownership-transfer service.
 *
 * Workflow:
 *   1. `initiate` — owner (or officer) requests a transfer; the land is
 *      flagged as `pending_transfer` and an initiation anchor is recorded.
 *   2. `approve` — admin/officer settles the transfer: the land's owner is
 *      rewritten and a `transferred` event is appended to its chain of
 *      custody with a fresh settlement anchor.
 *   3. `reject` / `cancel` — the land returns to `registered` and the
 *      transfer is closed without mutating ownership.
 *
 * Persists to localStorage. Replace with `fetch(...)` calls when wiring the
 * real backend; the public function signatures should stay stable so callers
 * never change.
 */
import type { User } from "@/lib/auth/types";
import type { BlockchainAnchor } from "@/lib/lands/types";
import type {
  InitiateTransferPayload,
  TransferRecord,
  TransferStatus,
} from "@/lib/transfers/types.ts";
import { _landMutators, landService } from "@/services/landService";

const TRANSFERS_KEY = "lr.transfers.v1";
const NETWORK = "LandChain Testnet";

const wait = (ms = 280) => new Promise((r) => setTimeout(r, ms));

function read(): TransferRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(TRANSFERS_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function write(items: TransferRecord[]) {
  localStorage.setItem(TRANSFERS_KEY, JSON.stringify(items));
}

function randomHex(length: number): string {
  const bytes = new Uint8Array(length / 2);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function makeAnchor(): BlockchainAnchor {
  return {
    txHash: `0x${randomHex(64)}`,
    blockHash: `0x${randomHex(64)}`,
    blockNumber: 1_840_000 + Math.floor(Math.random() * 50_000),
    network: NETWORK,
    timestamp: new Date().toISOString(),
  };
}

function nextId(items: TransferRecord[]): string {
  return `xfer_${String(items.length + 1).padStart(4, "0")}`;
}

function canActOn(t: TransferRecord, user: User): boolean {
  if (user.role === "admin" || user.role === "land_officer") return true;
  return t.fromOwnerId === user.id;
}

export const transferService = {
  async list(): Promise<TransferRecord[]> {
    await wait(180);
    return read().sort((a, b) => b.initiatedAt.localeCompare(a.initiatedAt));
  },

  async listForUser(user: User | null): Promise<TransferRecord[]> {
    const all = await this.list();
    if (!user) return [];
    if (user.role === "admin" || user.role === "land_officer") return all;
    const nid = (user.nationalId ?? "").toLowerCase();
    return all.filter(
      (t) =>
        t.fromOwnerId === user.id ||
        t.fromOwnerNationalId.toLowerCase() === nid ||
        t.toOwnerNationalId.toLowerCase() === nid,
    );
  },

  async getById(id: string): Promise<TransferRecord | null> {
    await wait(140);
    return read().find((t) => t.id === id) ?? null;
  },

  async initiate(payload: InitiateTransferPayload, actor: User): Promise<TransferRecord> {
    await wait(380);
    const land = await landService.getById(payload.landId);
    if (!land) throw new Error("Land record not found.");
    if (land.status === "pending_transfer") {
      throw new Error("This parcel already has a pending transfer.");
    }
    if (land.status === "disputed") {
      throw new Error("Disputed parcels cannot be transferred.");
    }
    const isOwner =
      land.ownerId === actor.id ||
      land.ownerNationalId.toLowerCase() === (actor.nationalId ?? "").toLowerCase();
    const isOfficer = actor.role === "admin" || actor.role === "land_officer";
    if (!isOwner && !isOfficer) {
      throw new Error("You are not authorised to transfer this parcel.");
    }
    if (payload.toOwnerNationalId.trim().toLowerCase() === land.ownerNationalId.toLowerCase()) {
      throw new Error("New owner must differ from the current owner.");
    }

    const items = read();
    const anchor = makeAnchor();
    const record: TransferRecord = {
      id: nextId(items),
      landId: land.id,
      parcelNumber: land.parcelNumber,
      landTitle: land.title,
      fromOwnerId: land.ownerId,
      fromOwnerName: land.ownerName,
      fromOwnerNationalId: land.ownerNationalId,
      toOwnerName: payload.toOwnerName.trim(),
      toOwnerNationalId: payload.toOwnerNationalId.trim().toUpperCase(),
      reason: payload.reason.trim(),
      status: "pending",
      initiatedById: actor.id,
      initiatedByName: actor.name,
      initiatedAt: new Date().toISOString(),
      initiationAnchor: anchor,
    };
    write([record, ...items]);
    _landMutators.setStatus(land.id, "pending_transfer");
    return record;
  },

  async approve(transferId: string, actor: User, notes?: string): Promise<TransferRecord> {
    await wait(420);
    if (actor.role !== "admin" && actor.role !== "land_officer") {
      throw new Error("Only registry officers can approve transfers.");
    }
    const items = read();
    const idx = items.findIndex((t) => t.id === transferId);
    if (idx === -1) throw new Error("Transfer not found.");
    const t = items[idx];
    if (t.status !== "pending") {
      throw new Error(`Transfer is already ${t.status}.`);
    }
    const result = _landMutators.applyTransfer(
      t.landId,
      { name: t.toOwnerName, nationalId: t.toOwnerNationalId },
      actor,
      notes?.trim() || `Ownership transferred to ${t.toOwnerName} (${t.toOwnerNationalId}).`,
    );
    if (!result) throw new Error("Underlying land record vanished.");
    const updated: TransferRecord = {
      ...t,
      status: "approved",
      decidedById: actor.id,
      decidedByName: actor.name,
      decidedAt: new Date().toISOString(),
      decisionNotes: notes?.trim() || undefined,
      settlementAnchor: result.anchor,
    };
    items[idx] = updated;
    write(items);
    return updated;
  },

  async reject(transferId: string, actor: User, notes: string): Promise<TransferRecord> {
    await wait(320);
    if (actor.role !== "admin" && actor.role !== "land_officer") {
      throw new Error("Only registry officers can reject transfers.");
    }
    if (!notes.trim()) throw new Error("A rejection reason is required.");
    return this._close(transferId, actor, "rejected", notes.trim());
  },

  async cancel(transferId: string, actor: User, notes?: string): Promise<TransferRecord> {
    await wait(260);
    const items = read();
    const t = items.find((x) => x.id === transferId);
    if (!t) throw new Error("Transfer not found.");
    if (!canActOn(t, actor)) {
      throw new Error("Only the initiator can cancel this transfer.");
    }
    return this._close(transferId, actor, "cancelled", notes?.trim() || "Cancelled by initiator.");
  },

  async _close(
    transferId: string,
    actor: User,
    status: Extract<TransferStatus, "rejected" | "cancelled">,
    notes: string,
  ): Promise<TransferRecord> {
    const items = read();
    const idx = items.findIndex((t) => t.id === transferId);
    if (idx === -1) throw new Error("Transfer not found.");
    const t = items[idx];
    if (t.status !== "pending") throw new Error(`Transfer is already ${t.status}.`);
    _landMutators.setStatus(t.landId, "registered");
    const updated: TransferRecord = {
      ...t,
      status,
      decidedById: actor.id,
      decidedByName: actor.name,
      decidedAt: new Date().toISOString(),
      decisionNotes: notes,
    };
    items[idx] = updated;
    write(items);
    return updated;
  },
};
