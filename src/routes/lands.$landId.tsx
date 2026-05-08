import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileSignature,
  Loader2,
  MapPin,
  Ruler,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { landService } from "@/services/landService";
import type { LandRecord } from "@/lib/lands/types";
import { StatusBadge } from "@/components/lands/StatusBadge";
import { HashChip } from "@/components/blockchain/HashChip";

export const Route = createFileRoute("/lands/$landId")({
  head: () => ({
    meta: [
      { title: "Land Record — LandChain" },
      {
        name: "description",
        content: "Cryptographically anchored land record details.",
      },
    ],
  }),
  component: LandDetailPage,
});

function LandDetailPage() {
  return (
    <ProtectedRoute>
      <LandDetailInner />
    </ProtectedRoute>
  );
}

function LandDetailInner() {
  const { landId } = useParams({ from: "/lands/$landId" });
  const [land, setLand] = useState<LandRecord | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    landService.getById(landId).then((l) => {
      if (!cancelled) setLand(l);
    });
    return () => {
      cancelled = true;
    };
  }, [landId]);

  if (land === undefined) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading record…
      </div>
    );
  }

  if (land === null) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Record not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This parcel id does not exist on the ledger.
        </p>
        <Link
          to="/lands"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to registry
        </Link>
      </div>
    );
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        to="/lands"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to registry
      </Link>

      {/* Header / Certificate */}
      <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-(image:--gradient-hero) p-6 text-primary-foreground shadow-(--shadow-elegant) md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-(--color-gold)">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified on-chain
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold md:text-3xl">{land.title}</h1>
            <div className="mt-1 font-mono text-xs text-primary-foreground/80">
              Parcel · {land.parcelNumber}
            </div>
          </div>
          <StatusBadge
            status={land.status}
            className="bg-white/10 text-primary-foreground border-white/20 backdrop-blur"
          />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <AnchorRow label="Transaction hash" value={land.anchor.txHash} />
          <AnchorRow label="Block hash" value={land.anchor.blockHash} />
          <div className="rounded-lg bg-white/5 px-3 py-2 text-xs">
            <div className="font-semibold uppercase tracking-wider text-primary-foreground/70">
              Block #
            </div>
            <div className="mt-0.5 font-mono">{land.anchor.blockNumber.toLocaleString()}</div>
          </div>
          <div className="rounded-lg bg-white/5 px-3 py-2 text-xs">
            <div className="font-semibold uppercase tracking-wider text-primary-foreground/70">
              Network
            </div>
            <div className="mt-0.5">{land.anchor.network}</div>
          </div>
        </div>
      </div>

      {/* Body grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Owner of record" icon={UserIcon}>
            <Row label="Full name" value={land.ownerName} />
            <Row label="National ID" value={land.ownerNationalId} mono />
          </Card>

          <Card title="Location" icon={MapPin}>
            <Row label="Address" value={land.location} />
            <Row label="District" value={land.district} />
            <Row label="Region" value={land.region} />
          </Card>

          <Card title="Specification" icon={Ruler}>
            <Row label="Area" value={`${land.areaSqm.toLocaleString()} m²`} />
            <Row label="Land use" value={land.use} capitalize />
            {land.description && <Row label="Notes" value={land.description} />}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Registration" icon={FileSignature}>
            <Row label="Registered by" value={land.registeredByName} />
            <Row label="Created" value={formatDate(land.createdAt)} />
            <Row label="Last updated" value={formatDate(land.updatedAt)} />
          </Card>

          <Card title="Chain of custody" icon={Calendar}>
            <ol className="relative space-y-5 border-l border-border pl-5">
              {land.history.map((evt) => (
                <li key={evt.id} className="relative">
                  <span className="absolute -left-6.75 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                    <CheckCircle2 className="h-3 w-3" />
                  </span>
                  <div className="text-sm font-medium capitalize">{evt.type.replace("_", " ")}</div>
                  <div className="text-xs text-muted-foreground">
                    {evt.actorName} · {formatDate(evt.at)}
                  </div>
                  {evt.notes && <p className="mt-1 text-xs text-muted-foreground">{evt.notes}</p>}
                  <div className="mt-2">
                    <HashChip hash={evt.anchor.txHash} label="tx" truncate={6} />
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-(--shadow-card)">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
          {title}
        </h2>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  mono,
  capitalize,
}: {
  label: string;
  value: string;
  mono?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-start gap-3 text-sm">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={
          (mono ? "font-mono text-xs " : "") + (capitalize ? "capitalize " : "") + "text-foreground"
        }
      >
        {value}
      </div>
    </div>
  );
}

function AnchorRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/5 px-3 py-2 text-xs">
      <div className="font-semibold uppercase tracking-wider text-primary-foreground/70">
        {label}
      </div>
      <div className="mt-1">
        <HashChip
          hash={value}
          truncate={8}
          className="border-white/15 bg-white/10 text-primary-foreground hover:bg-white/15 hover:text-primary-foreground"
        />
      </div>
    </div>
  );
}
