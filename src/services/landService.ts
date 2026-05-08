/**
 * Mock land registry service.
 *
 * Persists land records to localStorage and simulates blockchain anchoring
 * by generating deterministic-looking hashes. Swap with real fetch calls
 * when the backend is wired in — function signatures should remain stable.
 */
import type {
  BlockchainAnchor,
  LandHistoryEvent,
  LandRecord,
  RegisterLandPayload,
} from "@/lib/lands/types";
import type { User } from "@/lib/auth/types";

const LANDS_KEY = "lr.lands.v1";
const SEED_FLAG = "lr.lands.seeded.v1";
const NETWORK = "LandChain Testnet";

const wait = (ms = 300) => new Promise((r) => setTimeout(r, ms));

function readLands(): LandRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LANDS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeLands(lands: LandRecord[]) {
  localStorage.setItem(LANDS_KEY, JSON.stringify(lands));
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

function seed() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_FLAG)) return;
  const now = new Date();
  const samples: LandRecord[] = [
    {
      id: "land_0001",
      parcelNumber: "KGL-CTR-001-2024",
      title: "Riverside Plot — Kigali Centre",
      ownerId: "u_citizen",
      ownerName: "Demo Citizen",
      ownerNationalId: "CIT-0001",
      location: "KN 45 St, Nyarugenge",
      district: "Nyarugenge",
      region: "Kigali",
      areaSqm: 850,
      use: "residential",
      status: "registered",
      description: "Corner plot with frontage along the riverside boulevard.",
      registeredById: "u_officer",
      registeredByName: "Land Officer",
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 14).toISOString(),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 14).toISOString(),
      anchor: makeAnchor(),
      history: [
        {
          id: "evt_0001",
          type: "registered",
          actorId: "u_officer",
          actorName: "Land Officer",
          notes: "Initial registration following on-site survey.",
          anchor: makeAnchor(),
          at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 14).toISOString(),
        },
      ],
    },
    {
      id: "land_0002",
      parcelNumber: "MUS-AGR-204-2023",
      title: "Hillside Coffee Farm",
      ownerId: "u_citizen",
      ownerName: "Demo Citizen",
      ownerNationalId: "CIT-0001",
      location: "Sector Rwaza, Musanze",
      district: "Musanze",
      region: "Northern",
      areaSqm: 12_400,
      use: "agricultural",
      status: "registered",
      description: "Established coffee plantation with irrigation rights.",
      registeredById: "u_officer",
      registeredByName: "Land Officer",
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 60).toISOString(),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 60).toISOString(),
      anchor: makeAnchor(),
      history: [
        {
          id: "evt_0002",
          type: "registered",
          actorId: "u_officer",
          actorName: "Land Officer",
          anchor: makeAnchor(),
          at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 60).toISOString(),
        },
      ],
    },
    {
      id: "land_0003",
      parcelNumber: "HUY-COM-088-2025",
      title: "Huye Market Lot",
      ownerId: "u_admin",
      ownerName: "Registry Administrator",
      ownerNationalId: "ADMIN-0001",
      location: "Central Market, Huye",
      district: "Huye",
      region: "Southern",
      areaSqm: 320,
      use: "commercial",
      status: "pending_transfer",
      description: "Awaiting buyer KYC clearance before transfer is anchored.",
      registeredById: "u_officer",
      registeredByName: "Land Officer",
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1).toISOString(),
      anchor: makeAnchor(),
      history: [
        {
          id: "evt_0003a",
          type: "registered",
          actorId: "u_officer",
          actorName: "Land Officer",
          anchor: makeAnchor(),
          at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        },
        {
          id: "evt_0003b",
          type: "verified",
          actorId: "u_admin",
          actorName: "Registry Administrator",
          notes: "Survey documents cross-checked.",
          anchor: makeAnchor(),
          at: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        },
      ],
    },
  ];
  writeLands(samples);
  localStorage.setItem(SEED_FLAG, "1");
}

function nextId(prefix: string, existing: LandRecord[]): string {
  const n = existing.length + 1;
  return `${prefix}_${String(n).padStart(4, "0")}`;
}

export const landService = {
  async list(): Promise<LandRecord[]> {
    seed();
    await wait(200);
    return readLands().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async listForUser(user: User | null): Promise<LandRecord[]> {
    const all = await this.list();
    if (!user) return [];
    if (user.role === "admin" || user.role === "land_officer") return all;
    return all.filter(
      (l) =>
        l.ownerId === user.id ||
        l.ownerNationalId.toLowerCase() === (user.nationalId ?? "").toLowerCase(),
    );
  },

  async getById(id: string): Promise<LandRecord | null> {
    seed();
    await wait(150);
    return readLands().find((l) => l.id === id) ?? null;
  },

  async getByParcel(parcelNumber: string): Promise<LandRecord | null> {
    seed();
    await wait(200);
    const norm = parcelNumber.trim().toLowerCase();
    return readLands().find((l) => l.parcelNumber.toLowerCase() === norm) ?? null;
  },

  async register(payload: RegisterLandPayload, actor: User): Promise<LandRecord> {
    seed();
    await wait(450);
    const lands = readLands();
    if (
      lands.some((l) => l.parcelNumber.toLowerCase() === payload.parcelNumber.trim().toLowerCase())
    ) {
      throw new Error("A land record with this parcel number already exists.");
    }
    const now = new Date().toISOString();
    const anchor = makeAnchor();
    const event: LandHistoryEvent = {
      id: `evt_${randomHex(8)}`,
      type: "registered",
      actorId: actor.id,
      actorName: actor.name,
      notes: "On-chain registration anchored on the LandChain ledger.",
      anchor,
      at: now,
    };
    const record: LandRecord = {
      id: nextId("land", lands),
      parcelNumber: payload.parcelNumber.trim().toUpperCase(),
      title: payload.title.trim(),
      ownerId: actor.role === "citizen" ? actor.id : `ext_${randomHex(6)}`,
      ownerName: payload.ownerName.trim(),
      ownerNationalId: payload.ownerNationalId.trim().toUpperCase(),
      location: payload.location.trim(),
      district: payload.district.trim(),
      region: payload.region.trim(),
      areaSqm: payload.areaSqm,
      use: payload.use,
      status: "registered",
      description: payload.description?.trim() || undefined,
      registeredById: actor.id,
      registeredByName: actor.name,
      createdAt: now,
      updatedAt: now,
      anchor,
      history: [event],
    };
    writeLands([record, ...lands]);
    return record;
  },
};

/**
 * Internal mutators used by transferService.
 * Not for direct use in UI components.
 */
export const _landMutators = {
  setStatus(landId: string, status: LandRecord["status"]): void {
    const lands = readLands();
    const idx = lands.findIndex((l) => l.id === landId);
    if (idx === -1) return;
    lands[idx] = { ...lands[idx], status, updatedAt: new Date().toISOString() };
    writeLands(lands);
  },

  applyTransfer(
    landId: string,
    newOwner: { name: string; nationalId: string },
    actor: User,
    notes: string,
  ): LandRecord | null {
    const lands = readLands();
    const idx = lands.findIndex((l) => l.id === landId);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    const anchor = makeAnchor();
    const event: LandHistoryEvent = {
      id: `evt_${randomHex(8)}`,
      type: "transferred",
      actorId: actor.id,
      actorName: actor.name,
      notes,
      anchor,
      at: now,
    };
    const updated: LandRecord = {
      ...lands[idx],
      ownerId: `ext_${randomHex(6)}`,
      ownerName: newOwner.name,
      ownerNationalId: newOwner.nationalId.toUpperCase(),
      status: "registered",
      updatedAt: now,
      anchor,
      history: [...lands[idx].history, event],
    };
    lands[idx] = updated;
    writeLands(lands);
    return updated;
  },
};
