import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { landService } from "@/services/landService";

import type { LandRecord, LandStatus } from "@/lib/lands/types";

import { StatusBadge } from "@/components/lands/StatusBadge";
import { HashChip } from "@/components/blockchain/HashChip";

import { getContract } from "@/components/blockchain/blockchain";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Loader2,
  MapPinned,
  Plus,
  Search,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/lands/")({
  component: LandsListPage,
});

function LandsListPage() {
  return (
    <ProtectedRoute>
      <LandsListInner />
    </ProtectedRoute>
  );
}

/**
 * 🔥 UI-only extension type (FIXES YOUR ERROR)
 * This does NOT modify backend model
 */
type LandWithChain = LandRecord & {
  chainOwner?: string;
  chainRegistered?: boolean;
};

function LandsListInner() {
  const { user, hasRole } = useAuth();

  const [lands, setLands] = useState<LandWithChain[] | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"all" | LandStatus>("all");

  const canRegister = hasRole(["admin", "land_officer"]);

  /**
   * 🔥 Blockchain read helper
   */
  const loadChainData = async (parcelNumber: string) => {
    try {
      const contract = getReadContract();
      const data = await contract.getParcel(parcelNumber);

      return {
        currentOwner: data.currentOwner,
        isRegistered: data.isRegistered,
      };
    } catch {
      return {
        currentOwner: "unknown",
        isRegistered: false,
      };
    }
  };

  /**
   * 🔥 Load + enrich lands
   */
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      const rows = await landService.listForUser(user);

      const enriched: LandWithChain[] = await Promise.all(
        rows.map(async (land) => {
          const chain = await loadChainData(land.parcelNumber);

          return {
            ...land,
            chainOwner: chain.currentOwner,
            chainRegistered: chain.isRegistered,
          };
        })
      );

      if (!cancelled) setLands(enriched);
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [user]);

  /**
   * 🔍 Filtering logic
   */
  const filtered = useMemo(() => {
    if (!lands) return [];
    const q = query.trim().toLowerCase();

    return lands.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;

      if (!q) return true;

      return [
        l.parcelNumber,
        l.title,
        l.ownerName,
        l.ownerNationalId,
        l.location,
        l.district,
        l.region,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [lands, query, statusFilter]);

  const counts = useMemo(() => {
    const base = {
      all: lands?.length ?? 0,
      registered: 0,
      pending_transfer: 0,
      disputed: 0,
    };

    lands?.forEach((l) => (base[l.status] += 1));
    return base;
  }, [lands]);

  return (
    <div className="mx-auto max-w-6xl">

      {/* HEADER */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Land Registry</h1>
          <p className="text-sm text-muted-foreground">
            Blockchain-backed land records
          </p>
        </div>

        {canRegister && (
          <Button asChild>
            <Link to="/lands/new">
              <Plus className="h-4 w-4" /> Register land
            </Link>
          </Button>
        )}
      </header>

      {/* SEARCH */}
      <div className="mt-6">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search lands..."
        />
      </div>

      {/* TABLE */}
      <div className="mt-6">

        {lands === null ? (
          <div className="flex items-center gap-2">
            <Loader2 className="animate-spin" />
            Loading...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parcel</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Blockchain Owner</TableHead>
                <TableHead>TX</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((l) => (
                <TableRow key={l.id}>

                  <TableCell>
                    <div className="font-mono text-xs">
                      {l.parcelNumber}
                    </div>
                    <div>{l.title}</div>
                  </TableCell>

                  <TableCell>{l.ownerName}</TableCell>

                  <TableCell>
                    <StatusBadge status={l.status} />
                  </TableCell>

                  {/* 🔥 BLOCKCHAIN DATA */}
                  <TableCell className="text-xs">
                    {l.chainOwner}
                  </TableCell>

                  <TableCell>
                    <HashChip
                      hash={l.anchor.txHash}
                      label="tx"
                      truncate={6}
                    />
                  </TableCell>

                  <TableCell>
                    <Button asChild variant="ghost" size="sm">
                      <Link
                        to="/lands/$landId"
                        params={{ landId: l.id }}
                      >
                        Open <ArrowRight />
                      </Link>
                    </Button>
                  </TableCell>

                </TableRow>
              ))}
            </TableBody>

          </Table>
        )}

      </div>
    </div>
  );
}