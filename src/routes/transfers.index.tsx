import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { transferService } from "@/services/transferService.ts";
import type { TransferRecord, TransferStatus } from "@/lib/transfers/types.ts";
import { TransferStatusBadge } from "@/components/transfers/TransferStatusBadge.tsx";
import { HashChip } from "@/components/blockchain/HashChip";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowRight, ArrowLeftRight, Loader2, Plus } from "lucide-react";

export const Route = createFileRoute("/transfers/")({
  head: () => ({
    meta: [
      { title: "Ownership Transfers — LandChain" },
      {
        name: "description",
        content:
          "Track every ownership transfer initiated, approved or rejected on the LandChain ledger.",
      },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <Inner />
    </ProtectedRoute>
  ),
});

function Inner() {
  const { user } = useAuth();
  const [items, setItems] = useState<TransferRecord[] | null>(null);
  const [filter, setFilter] = useState<"all" | TransferStatus>("all");

  useEffect(() => {
    let cancelled = false;
    transferService.listForUser(user).then((rows) => {
      if (!cancelled) setItems(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const filtered = useMemo(() => {
    if (!items) return [];
    return filter === "all" ? items : items.filter((t) => t.status === filter);
  }, [items, filter]);

  const counts = useMemo(() => {
    const base = { all: items?.length ?? 0, pending: 0, approved: 0, rejected: 0, cancelled: 0 };
    items?.forEach((t) => (base[t.status] += 1));
    return base;
  }, [items]);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-glow">
            Ownership transfers
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Transfer ledger
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Every ownership change is anchored on initiation and again on settlement, producing a
            complete two-step audit trail.
          </p>
        </div>
        <Button
          asChild
          className="h-10 bg-(image:--gradient-emerald) text-primary-foreground shadow-(--shadow-elegant) hover:opacity-95"
        >
          <Link to="/transfers/new">
            <Plus className="h-4 w-4" /> Initiate transfer
          </Link>
        </Button>
      </header>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total" value={counts.all} />
        <Stat label="Pending" value={counts.pending} accent="warning" />
        <Stat label="Approved" value={counts.approved} accent="success" />
        <Stat label="Rejected" value={counts.rejected} accent="destructive" />
      </div>

      <div className="mt-6 flex flex-wrap gap-1.5">
        {(["all", "pending", "approved", "rejected", "cancelled"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={
              "rounded-full border px-3 py-1 text-xs font-medium capitalize transition " +
              (filter === k
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground")
            }
          >
            {k}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-(--shadow-card)">
        {items === null ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading transfers…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <ArrowLeftRight className="h-6 w-6" />
            </div>
            <div className="font-display text-lg font-semibold">No transfers to show</div>
            <p className="max-w-sm text-sm text-muted-foreground">
              When you initiate or are involved in a transfer, it will appear here with its full
              chain of anchors.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="px-4">Parcel</TableHead>
                <TableHead>From → To</TableHead>
                <TableHead className="hidden md:table-cell">Initiated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden xl:table-cell">Anchor</TableHead>
                <TableHead className="px-4 text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id} className="hover:bg-muted/30">
                  <TableCell className="px-4 py-3">
                    <div className="font-mono text-xs font-semibold text-primary">
                      {t.parcelNumber}
                    </div>
                    <div className="mt-0.5 text-sm font-medium">{t.landTitle}</div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">{t.fromOwnerName}</span>
                      <ArrowRight className="mx-1 inline h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{t.toOwnerName}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{t.toOwnerNationalId}</div>
                  </TableCell>
                  <TableCell className="hidden py-3 text-sm md:table-cell">
                    <div>{new Date(t.initiatedAt).toLocaleDateString()}</div>
                    <div className="text-xs text-muted-foreground">by {t.initiatedByName}</div>
                  </TableCell>
                  <TableCell className="py-3">
                    <TransferStatusBadge status={t.status} />
                  </TableCell>
                  <TableCell className="hidden py-3 xl:table-cell">
                    <HashChip
                      hash={(t.settlementAnchor ?? t.initiationAnchor).txHash}
                      label="tx"
                      truncate={6}
                    />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary"
                    >
                      <Link to="/transfers/$transferId" params={{ transferId: t.id }}>
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

function Stat({
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
    <div className="rounded-xl border border-border bg-card p-4 shadow-(--shadow-card)">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`mt-1 font-display text-2xl font-bold ${tone}`}>{value}</div>
    </div>
  );
}
