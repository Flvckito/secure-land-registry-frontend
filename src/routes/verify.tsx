import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileSearch,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { landService } from "@/services/landService";
import type { LandRecord } from "@/lib/lands/types";
import { StatusBadge } from "@/components/lands/StatusBadge";
import { HashChip } from "@/components/blockchain/HashChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: "Blockchain Verification — LandChain" },
      {
        name: "description",
        content:
          "Verify any LandChain parcel by parcel number or transaction hash. Tamper-evident, public, instant.",
      },
    ],
  }),
  component: VerifyPage,
});

type Result =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "not_found"; query: string }
  | { kind: "found"; record: LandRecord; matchedAnchor: { type: string; tx: string } };

function VerifyPage() {
  const [parcel, setParcel] = useState("");
  const [tx, setTx] = useState("");
  const [result, setResult] = useState<Result>({ kind: "idle" });

  const lookupByParcel = async () => {
    const q = parcel.trim();
    if (!q) return;
    setResult({ kind: "loading" });
    const rec = await landService.getByParcel(q);
    setResult(
      rec
        ? {
            kind: "found",
            record: rec,
            matchedAnchor: { type: "Registration", tx: rec.anchor.txHash },
          }
        : { kind: "not_found", query: q },
    );
  };

  const lookupByTx = async () => {
    const q = tx.trim();
    if (!q) return;
    setResult({ kind: "loading" });
    const all = await landService.list();
    let matched: { record: LandRecord; type: string; tx: string } | null = null;
    for (const r of all) {
      if (r.anchor.txHash.toLowerCase() === q.toLowerCase()) {
        matched = { record: r, type: "Registration", tx: r.anchor.txHash };
        break;
      }
      const evt = r.history.find((e) => e.anchor.txHash.toLowerCase() === q.toLowerCase());
      if (evt) {
        matched = { record: r, type: evt.type, tx: evt.anchor.txHash };
        break;
      }
    }
    setResult(
      matched
        ? {
            kind: "found",
            record: matched.record,
            matchedAnchor: { type: matched.type, tx: matched.tx },
          }
        : { kind: "not_found", query: q },
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-(image:--gradient-hero) text-primary-foreground">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-10 md:py-14">
          <Link
            to="/"
            className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-primary-foreground/80 hover:text-primary-foreground"
          >
            ← Home
          </Link>
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-(--color-gold)">
            <ShieldCheck className="h-3.5 w-3.5" /> Public verification
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Verify a land record on the blockchain
          </h1>
          <p className="max-w-2xl text-sm text-primary-foreground/80 md:text-base">
            Anyone can audit a parcel without an account. Look it up by parcel number or by any
            transaction hash from its chain of custody — the response is signed by the LandChain
            ledger and cannot be forged.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-(--shadow-card) md:p-8">
          <Tabs defaultValue="parcel">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="parcel">By parcel #</TabsTrigger>
              <TabsTrigger value="tx">By transaction hash</TabsTrigger>
            </TabsList>

            <TabsContent value="parcel" className="mt-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  lookupByParcel();
                }}
                className="flex flex-col gap-3 md:flex-row md:items-end"
              >
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="parcel">Parcel number</Label>
                  <Input
                    id="parcel"
                    value={parcel}
                    onChange={(e) => setParcel(e.target.value.toUpperCase())}
                    placeholder="KGL-CTR-001-2024"
                    className="font-mono"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!parcel.trim() || result.kind === "loading"}
                  className="bg-(image:--gradient-emerald) text-primary-foreground hover:opacity-95"
                >
                  {result.kind === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileSearch className="h-4 w-4" />
                  )}
                  Verify
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="tx" className="mt-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  lookupByTx();
                }}
                className="flex flex-col gap-3 md:flex-row md:items-end"
              >
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="tx">Transaction hash</Label>
                  <Input
                    id="tx"
                    value={tx}
                    onChange={(e) => setTx(e.target.value)}
                    placeholder="0x…"
                    className="font-mono"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!tx.trim() || result.kind === "loading"}
                  className="bg-(image:--gradient-emerald) text-primary-foreground hover:opacity-95"
                >
                  {result.kind === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileSearch className="h-4 w-4" />
                  )}
                  Verify
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-6">
          {result.kind === "idle" && <Hints />}
          {result.kind === "loading" && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Querying the ledger…
            </div>
          )}
          {result.kind === "not_found" && (
            <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <div className="font-display text-base font-semibold">No record found</div>
                <p className="mt-0.5 text-destructive/80">
                  We couldn't find anything anchored as{" "}
                  <span className="font-mono">{result.query}</span>. Double-check the value and try
                  again.
                </p>
              </div>
            </div>
          )}
          {result.kind === "found" && <FoundCard {...result} />}
        </div>
      </main>
    </div>
  );
}

function Hints() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[
        {
          title: "Tamper-evident",
          body: "Every record is hashed and anchored. Any change rewrites the chain — and is instantly visible.",
        },
        {
          title: "No account needed",
          body: "Verification is public by design. Citizens, courts and notaries can audit at any time.",
        },
        {
          title: "Full chain of custody",
          body: "See every event from initial registration through ownership transfers, each with its own anchor.",
        },
        {
          title: "Cryptographic proof",
          body: "Transaction & block hashes can be cross-checked against the LandChain ledger explorer.",
        },
      ].map((h) => (
        <div
          key={h.title}
          className="rounded-xl border border-border bg-card p-5 shadow-(--shadow-card)"
        >
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="h-4 w-4" />
            <span className="font-display text-sm font-semibold uppercase tracking-[0.14em]">
              {h.title}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{h.body}</p>
        </div>
      ))}
    </div>
  );
}

function FoundCard({
  record,
  matchedAnchor,
}: {
  record: LandRecord;
  matchedAnchor: { type: string; tx: string };
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-success/40 bg-card shadow-(--shadow-card)">
      <div className="flex items-center gap-3 border-b border-success/30 bg-success/10 px-6 py-3 text-success">
        <CheckCircle2 className="h-5 w-5" />
        <div className="font-display text-sm font-semibold uppercase tracking-[0.14em]">
          Verified on-chain
        </div>
      </div>
      <div className="grid gap-6 p-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="font-mono text-xs font-semibold text-primary">{record.parcelNumber}</div>
          <h2 className="mt-1 font-display text-xl font-bold">{record.title}</h2>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <Field label="Owner of record" value={record.ownerName} />
            <Field label="National ID" value={record.ownerNationalId} mono />
            <Field
              label="Location"
              value={`${record.location}, ${record.district}, ${record.region}`}
            />
            <Field label="Area" value={`${record.areaSqm.toLocaleString()} m²`} />
            <Field label="Land use" value={record.use} capitalize />
            <Field label="Status" value="">
              <StatusBadge status={record.status} />
            </Field>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Matched anchor — {matchedAnchor.type}
            </div>
            <div className="mt-1">
              <HashChip hash={matchedAnchor.tx} label="tx" truncate={8} />
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Network
            </div>
            <div className="mt-1 text-sm">{record.anchor.network}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              History
            </div>
            <div className="mt-1 text-sm">
              {record.history.length} event
              {record.history.length === 1 ? "" : "s"} on chain
            </div>
          </div>
          <Button asChild variant="outline" className="w-full justify-between">
            <Link to="/lands/$landId" params={{ landId: record.id }}>
              Open full record <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  capitalize,
  children,
}: {
  label: string;
  value: string;
  mono?: boolean;
  capitalize?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children ?? (
        <div
          className={`mt-1 text-foreground ${mono ? "font-mono text-xs" : ""} ${
            capitalize ? "capitalize" : ""
          }`}
        >
          {value}
        </div>
      )}
    </div>
  );
}
