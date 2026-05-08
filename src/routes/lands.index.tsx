import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { landService } from "@/services/landService";
import type { LandRecord, LandStatus } from "@/lib/lands/types";
import { StatusBadge } from "@/components/lands/StatusBadge";
import { HashChip } from "@/components/blockchain/HashChip";
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
import { Loader2, MapPinned, Plus, Search, ShieldCheck, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/lands/")({
  head: () => ({
    meta: [
      { title: "Land Registry — LandChain" },
      {
        name: "description",
        content: "Browse, search and audit every parcel anchored to the LandChain ledger.",
      },
    ],
  }),
  component: LandsListPage,
});

function LandsListPage() {
  return (
    <ProtectedRoute>
      <LandsListInner />
    </ProtectedRoute>
  );
}

function LandsListInner() {
  const { user, hasRole } = useAuth();
  const [lands, setLands] = useState<LandRecord[] | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LandStatus>("all");

  useEffect(() => {
    let cancelled = false;
    landService.listForUser(user).then((rows) => {
      if (!cancelled) setLands(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const canRegister = hasRole(["admin", "land_officer"]);

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
    const base = { all: lands?.length ?? 0, registered: 0, pending_transfer: 0, disputed: 0 };
    lands?.forEach((l) => (base[l.status] += 1));
    return base;
  }, [lands]);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-glow">
            Land registry
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
            {hasRole(["citizen"]) ? "My parcels" : "All registered parcels"}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Every record below is anchored to the LandChain ledger. Click a parcel to view its full
            chain of custody.
          </p>
        </div>
        {canRegister && (
          <Button
            asChild
            className="h-10 bg-[image:var(--gradient-emerald)] text-primary-foreground shadow-[var(--shadow-elegant)] hover:opacity-95"
          >
            <Link to="/lands/new">
              <Plus className="h-4 w-4" /> Register land
            </Link>
          </Button>
        )}
      </header>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total parcels" value={counts.all} />
        <SummaryCard label="Registered" value={counts.registered} accent="success" />
        <SummaryCard label="Pending transfer" value={counts.pending_transfer} accent="warning" />
        <SummaryCard label="Disputed" value={counts.disputed} accent="destructive" />
      </div>

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search parcel #, owner, district…"
            className="h-10 pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["all", "registered", "pending_transfer", "disputed"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={
                "rounded-full border px-3 py-1 text-xs font-medium capitalize transition " +
                (statusFilter === key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground")
              }
            >
              {key.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        {lands === null ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading registry…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState canRegister={canRegister} hasRecords={(lands?.length ?? 0) > 0} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="px-4">Parcel</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="hidden lg:table-cell">Location</TableHead>
                <TableHead className="hidden md:table-cell">Area</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden xl:table-cell">Anchor</TableHead>
                <TableHead className="px-4 text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow key={l.id} className="hover:bg-muted/30">
                  <TableCell className="px-4 py-3">
                    <div className="font-mono text-xs font-semibold text-primary">
                      {l.parcelNumber}
                    </div>
                    <div className="mt-0.5 text-sm font-medium text-foreground">{l.title}</div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="text-sm font-medium">{l.ownerName}</div>
                    <div className="text-xs text-muted-foreground">{l.ownerNationalId}</div>
                  </TableCell>
                  <TableCell className="hidden py-3 lg:table-cell">
                    <div className="text-sm">{l.district}</div>
                    <div className="text-xs text-muted-foreground">{l.region}</div>
                  </TableCell>
                  <TableCell className="hidden py-3 md:table-cell">
                    <div className="text-sm">{l.areaSqm.toLocaleString()} m²</div>
                    <div className="text-xs capitalize text-muted-foreground">{l.use}</div>
                  </TableCell>
                  <TableCell className="py-3">
                    <StatusBadge status={l.status} />
                  </TableCell>
                  <TableCell className="hidden py-3 xl:table-cell">
                    <HashChip hash={l.anchor.txHash} label="tx" truncate={6} />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary"
                    >
                      <Link to="/lands/$landId" params={{ landId: l.id }}>
                        Open <ArrowRight className="h-3.5 w-3.5" />
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

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "success" | "warning" | "destructive";
}) {
  const tone =
    accent === "success"
      ? "text-success"
      : accent === "warning"
        ? "text-warning-foreground"
        : accent === "destructive"
          ? "text-destructive"
          : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`mt-1 font-display text-2xl font-bold ${tone}`}>{value}</div>
    </div>
  );
}

function EmptyState({ canRegister, hasRecords }: { canRegister: boolean; hasRecords: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
        <MapPinned className="h-6 w-6" />
      </div>
      <div className="font-display text-lg font-semibold">
        {hasRecords ? "No parcels match your filters" : "No parcels yet"}
      </div>
      <p className="max-w-sm text-sm text-muted-foreground">
        {hasRecords
          ? "Try clearing the search box or selecting a different status."
          : canRegister
            ? "Register your first parcel to anchor it on the LandChain ledger."
            : "Once a registry officer assigns a parcel to you, it will appear here."}
      </p>
      {!hasRecords && canRegister && (
        <Button asChild className="mt-2 bg-[image:var(--gradient-emerald)] text-primary-foreground">
          <Link to="/lands/new">
            <Plus className="h-4 w-4" /> Register land
          </Link>
        </Button>
      )}
      <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Records are immutable once anchored.
      </div>
    </div>
  );
}
