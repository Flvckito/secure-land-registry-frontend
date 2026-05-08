import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { transferService } from "@/services/transferService.ts";
import type { TransferRecord } from "@/lib/transfers/types.ts";
import { TransferStatusBadge } from "@/components/transfers/TransferStatusBadge.tsx";
import { HashChip } from "@/components/blockchain/HashChip";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/transfers/$transferId")({
  head: () => ({
    meta: [
      { title: "Transfer Record — LandChain" },
      {
        name: "description",
        content: "Approve, reject or audit an ownership transfer request.",
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
  const { transferId } = useParams({ from: "/transfers/$transferId" });
  const { user, hasRole } = useAuth();
  const [t, setT] = useState<TransferRecord | null | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<null | "approve" | "reject" | "cancel">(null);

  const refresh = () => transferService.getById(transferId).then(setT);
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transferId]);

  if (t === undefined) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading transfer…
      </div>
    );
  }
  if (t === null) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Transfer not found</h1>
        <Link
          to="/transfers"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to transfers
        </Link>
      </div>
    );
  }

  const formatDate = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "—";

  const isOfficer = hasRole(["admin", "land_officer"]);
  const isInitiator = !!user && user.id === t.initiatedById;
  const canDecide = isOfficer && t.status === "pending";
  const canCancel = isInitiator && t.status === "pending";

  const decide = async (action: "approve" | "reject" | "cancel") => {
    if (!user) return;
    if (action === "reject" && !notes.trim()) {
      toast.error("Add a rejection reason first.");
      return;
    }
    setBusy(action);
    try {
      if (action === "approve") await transferService.approve(t.id, user, notes);
      if (action === "reject") await transferService.reject(t.id, user, notes);
      if (action === "cancel") await transferService.cancel(t.id, user, notes);
      toast.success(
        `Transfer ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "cancelled"}`,
      );
      setNotes("");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        to="/transfers"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to transfers
      </Link>

      <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-(image:--gradient-hero) p-6 text-primary-foreground shadow-(--shadow-elegant) md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-(--color-gold)">
              <ShieldCheck className="h-3.5 w-3.5" /> Transfer #{t.id.replace("xfer_", "")}
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold md:text-3xl">{t.landTitle}</h1>
            <div className="mt-1 font-mono text-xs text-primary-foreground/80">
              Parcel · {t.parcelNumber}
            </div>
          </div>
          <TransferStatusBadge
            status={t.status}
            className="border-white/20 bg-white/10 text-primary-foreground backdrop-blur"
          />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Party label="From owner" name={t.fromOwnerName} nationalId={t.fromOwnerNationalId} />
          <Party label="To owner" name={t.toOwnerName} nationalId={t.toOwnerNationalId} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Reason / reference">
            <p className="text-sm text-foreground/90">{t.reason}</p>
          </Card>

          <Card title="Chain of custody" icon={<Calendar className="h-3.5 w-3.5" />}>
            <ol className="relative space-y-5 border-l border-border pl-5">
              <Event
                title="Initiated"
                actor={t.initiatedByName}
                at={t.initiatedAt}
                hash={t.initiationAnchor.txHash}
              />
              {t.status === "approved" && t.settlementAnchor && (
                <Event
                  title="Approved & settled on-chain"
                  actor={t.decidedByName ?? "—"}
                  at={t.decidedAt ?? ""}
                  hash={t.settlementAnchor.txHash}
                  notes={t.decisionNotes}
                  variant="success"
                />
              )}
              {t.status === "rejected" && (
                <Event
                  title="Rejected"
                  actor={t.decidedByName ?? "—"}
                  at={t.decidedAt ?? ""}
                  notes={t.decisionNotes}
                  variant="destructive"
                />
              )}
              {t.status === "cancelled" && (
                <Event
                  title="Cancelled"
                  actor={t.decidedByName ?? "—"}
                  at={t.decidedAt ?? ""}
                  notes={t.decisionNotes}
                  variant="muted"
                />
              )}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Anchors">
            <div className="space-y-2">
              <AnchorRow label="Initiation tx" hash={t.initiationAnchor.txHash} />
              <AnchorRow label="Initiation block" hash={t.initiationAnchor.blockHash} />
              {t.settlementAnchor && (
                <>
                  <AnchorRow label="Settlement tx" hash={t.settlementAnchor.txHash} />
                  <AnchorRow label="Settlement block" hash={t.settlementAnchor.blockHash} />
                </>
              )}
            </div>
          </Card>

          <Card title="Linked parcel">
            <Link
              to="/lands/$landId"
              params={{ landId: t.landId }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              Open parcel record <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>

          {(canDecide || canCancel) && (
            <Card title="Action">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="notes">
                    {canDecide ? "Decision notes" : "Cancellation notes"}
                  </Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={
                      canDecide ? "KYC verified, documents on file." : "Optional context."
                    }
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {canDecide && (
                    <>
                      <Button
                        onClick={() => decide("approve")}
                        disabled={!!busy}
                        className="bg-success text-success-foreground hover:bg-success/90"
                      >
                        {busy === "approve" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Approve & settle
                      </Button>
                      <Button
                        onClick={() => decide("reject")}
                        disabled={!!busy}
                        variant="outline"
                        className="border-destructive/40 text-destructive hover:bg-destructive/5"
                      >
                        {busy === "reject" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        Reject
                      </Button>
                    </>
                  )}
                  {canCancel && !canDecide && (
                    <Button onClick={() => decide("cancel")} disabled={!!busy} variant="outline">
                      {busy === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Cancel transfer
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}

          <Card title="Timeline">
            <Row label="Initiated" value={formatDate(t.initiatedAt)} />
            <Row label="Initiated by" value={t.initiatedByName} />
            {t.decidedAt && (
              <>
                <Row label="Decided" value={formatDate(t.decidedAt)} />
                <Row label="Decided by" value={t.decidedByName ?? "—"} />
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Party({ label, name, nationalId }: { label: string; name: string; nationalId: string }) {
  return (
    <div className="rounded-lg bg-white/5 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/70">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium">{name}</div>
      <div className="mt-0.5 font-mono text-xs text-primary-foreground/70">{nationalId}</div>
    </div>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-(--shadow-card)">
      <div className="mb-4 flex items-center gap-2">
        {icon && (
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary">
            {icon}
          </span>
        )}
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-start gap-3 py-1 text-sm">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-foreground">{value}</div>
    </div>
  );
}

function AnchorRow({ label, hash }: { label: string; hash: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <HashChip hash={hash} truncate={8} />
    </div>
  );
}

function Event({
  title,
  actor,
  at,
  hash,
  notes,
  variant = "default",
}: {
  title: string;
  actor: string;
  at: string;
  hash?: string;
  notes?: string;
  variant?: "default" | "success" | "destructive" | "muted";
}) {
  const dotClass =
    variant === "success"
      ? "bg-success text-success-foreground"
      : variant === "destructive"
        ? "bg-destructive text-destructive-foreground"
        : variant === "muted"
          ? "bg-muted-foreground/30 text-foreground"
          : "bg-primary text-primary-foreground";
  return (
    <li className="relative">
      <span
        className={`absolute -left-6.75 top-0.5 grid h-5 w-5 place-items-center rounded-full ${dotClass}`}
      >
        <CheckCircle2 className="h-3 w-3" />
      </span>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground">
        {actor}
        {at && ` · ${new Date(at).toLocaleString()}`}
      </div>
      {notes && <p className="mt-1 text-xs text-muted-foreground">{notes}</p>}
      {hash && (
        <div className="mt-2">
          <HashChip hash={hash} label="tx" truncate={6} />
        </div>
      )}
    </li>
  );
}
