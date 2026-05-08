import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { landService } from "@/services/landService";
import { transferService } from "@/services/transferService.ts";
import type { LandRecord } from "@/lib/lands/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/transfers/new")({
  head: () => ({
    meta: [
      { title: "Initiate Transfer — LandChain" },
      {
        name: "description",
        content: "Initiate an ownership transfer and anchor it on the ledger.",
      },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <Inner />
    </ProtectedRoute>
  ),
});

const schema = z.object({
  landId: z.string().min(1, "Select the parcel to transfer."),
  toOwnerName: z.string().trim().min(2, "New owner name is required.").max(120),
  toOwnerNationalId: z.string().trim().min(4, "National ID is required.").max(40),
  reason: z.string().trim().min(5, "Add a short reason or reference.").max(400),
});

function Inner() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [lands, setLands] = useState<LandRecord[] | null>(null);
  const [form, setForm] = useState({
    landId: "",
    toOwnerName: "",
    toOwnerNationalId: "",
    reason: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loader = hasRole(["admin", "land_officer"])
      ? landService.list()
      : landService.listForUser(user);
    loader.then((rows) => {
      if (!cancelled) {
        setLands(rows.filter((l) => l.status === "registered"));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user, hasRole]);

  const selectedLand = useMemo(
    () => lands?.find((l) => l.id === form.landId) ?? null,
    [lands, form.landId],
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrors({});
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const issue of parsed.error.issues) fe[issue.path[0] as string] = issue.message;
      setErrors(fe);
      return;
    }
    setSubmitting(true);
    try {
      const created = await transferService.initiate(parsed.data, user);
      toast.success("Transfer initiated and anchored");
      navigate({ to: "/transfers/$transferId", params: { transferId: created.id } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not initiate transfer.";
      setErrors({ _form: message });
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/transfers"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to transfers
      </Link>

      <header className="mt-3">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-glow">
          New transfer
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
          Initiate ownership transfer
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          The parcel will be flagged as <span className="font-medium">pending transfer</span> until
          a registry officer approves and settles it on-chain.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        noValidate
        className="mt-8 space-y-6 rounded-2xl border border-border bg-card p-6 shadow-(--shadow-card) md:p-8"
      >
        {errors._form && (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {errors._form}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="landId">Parcel</Label>
          {lands === null ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading parcels…
            </div>
          ) : lands.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You don't have any transferable parcels.{" "}
              <Link to="/lands" className="text-primary hover:underline">
                View your registry
              </Link>
              .
            </p>
          ) : (
            <Select
              value={form.landId}
              onValueChange={(v) => setForm((f) => ({ ...f, landId: v }))}
            >
              <SelectTrigger id="landId">
                <SelectValue placeholder="Choose a parcel…" />
              </SelectTrigger>
              <SelectContent>
                {lands.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.parcelNumber} — {l.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {errors.landId && <p className="text-xs text-destructive">{errors.landId}</p>}
        </div>

        {selectedLand && (
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs">
            <div className="font-semibold uppercase tracking-wider text-muted-foreground">
              Current owner
            </div>
            <div className="mt-1 text-sm font-medium text-foreground">
              {selectedLand.ownerName}{" "}
              <span className="font-mono text-xs text-muted-foreground">
                · {selectedLand.ownerNationalId}
              </span>
            </div>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="toOwnerName">New owner full name</Label>
            <Input
              id="toOwnerName"
              value={form.toOwnerName}
              onChange={(e) => setForm((f) => ({ ...f, toOwnerName: e.target.value }))}
              placeholder="John Buyer"
            />
            {errors.toOwnerName && <p className="text-xs text-destructive">{errors.toOwnerName}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="toOwnerNationalId">New owner national ID</Label>
            <Input
              id="toOwnerNationalId"
              value={form.toOwnerNationalId}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  toOwnerNationalId: e.target.value.toUpperCase(),
                }))
              }
              placeholder="CIT-7654321"
              className="font-mono"
            />
            {errors.toOwnerNationalId && (
              <p className="text-xs text-destructive">{errors.toOwnerNationalId}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reason">Reason / reference</Label>
          <Textarea
            id="reason"
            rows={3}
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            placeholder="Sale agreement #2024-0142 dated 12 Apr 2026."
          />
          {errors.reason && <p className="text-xs text-destructive">{errors.reason}</p>}
        </div>

        <div className="flex flex-col-reverse items-stretch gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Initiation will be hashed and anchored immediately.
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/transfers">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={submitting || !lands || lands.length === 0}
              className="bg-(image:--gradient-emerald) text-primary-foreground shadow-(--shadow-elegant) hover:opacity-95"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Anchoring…
                </>
              ) : (
                "Initiate & anchor"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
