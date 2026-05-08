import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { landService } from "@/services/landService.ts";
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
import type { LandUse, RegisterLandPayload } from "@/lib/lands/types.ts";

export const Route = createFileRoute("/lands/new")({
  head: () => ({
    meta: [
      { title: "Register Land — LandChain" },
      {
        name: "description",
        content: "Anchor a new parcel record on the LandChain ledger.",
      },
    ],
  }),
  component: NewLandPage,
});

const schema = z.object({
  parcelNumber: z
    .string()
    .trim()
    .min(4, "Parcel number must be at least 4 characters.")
    .max(40, "Parcel number must be under 40 characters.")
    .regex(/^[A-Za-z0-9\-_/]+$/, "Use letters, numbers, '-', '_' or '/' only."),
  title: z.string().trim().min(3, "Title is required.").max(120),
  ownerName: z.string().trim().min(2, "Owner name is required.").max(120),
  ownerNationalId: z.string().trim().min(4, "National ID is required.").max(40),
  location: z.string().trim().min(3, "Location is required.").max(160),
  district: z.string().trim().min(2, "District is required.").max(80),
  region: z.string().trim().min(2, "Region is required.").max(80),
  areaSqm: z
    .number({ invalid_type_error: "Enter the area in square metres." })
    .int("Use whole square metres.")
    .min(1, "Area must be greater than 0.")
    .max(10_000_000, "Area looks unrealistically large."),
  use: z.enum(["residential", "agricultural", "commercial", "industrial", "mixed"]),
  description: z.string().trim().max(600).optional().or(z.literal("")),
});

type FormState = {
  parcelNumber: string;
  title: string;
  ownerName: string;
  ownerNationalId: string;
  location: string;
  district: string;
  region: string;
  areaSqm: string;
  use: LandUse;
  description: string;
};

type FieldErrors = Partial<Record<keyof FormState | "_form", string>>;

function NewLandPage() {
  return (
    <ProtectedRoute roles={["admin", "land_officer"]}>
      <NewLandInner />
    </ProtectedRoute>
  );
}

function NewLandInner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>({
    parcelNumber: "",
    title: "",
    ownerName: "",
    ownerNationalId: "",
    location: "",
    district: "",
    region: "",
    areaSqm: "",
    use: "residential",
    description: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrors({});
    const parsed = schema.safeParse({
      ...form,
      areaSqm: form.areaSqm === "" ? Number.NaN : Number(form.areaSqm),
      description: form.description || undefined,
    });
    if (!parsed.success) {
      const fe: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        fe[issue.path[0] as keyof FormState] = issue.message;
      }
      setErrors(fe);
      return;
    }
    setSubmitting(true);
    try {
      const payload: RegisterLandPayload = parsed.data;
      const created = await landService.register(payload, user);
      toast.success("Land record anchored on the ledger");
      navigate({ to: "/lands/$landId", params: { landId: created.id } });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed.";
      setErrors({ _form: message });
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/lands"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to registry
      </Link>

      <header className="mt-3">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-glow">
          New record
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
          Register a new parcel
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Capture the survey details below. On submission the record is hashed and anchored to the
          LandChain ledger — the resulting transaction becomes the parcel's permanent proof of
          registration.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        noValidate
        className="mt-8 space-y-8 rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-8"
      >
        {errors._form && (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {errors._form}
          </div>
        )}

        <Section title="Parcel">
          <Field
            label="Parcel number"
            htmlFor="parcelNumber"
            error={errors.parcelNumber}
            hint="Unique identifier from the cadastral record."
          >
            <Input
              id="parcelNumber"
              value={form.parcelNumber}
              onChange={(e) => set("parcelNumber", e.target.value.toUpperCase())}
              placeholder="KGL-CTR-001-2024"
              className="font-mono"
            />
          </Field>
          <Field label="Title / description" htmlFor="title" error={errors.title}>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Riverside plot — Kigali Centre"
            />
          </Field>
        </Section>

        <Section title="Owner">
          <Field label="Owner full name" htmlFor="ownerName" error={errors.ownerName}>
            <Input
              id="ownerName"
              value={form.ownerName}
              onChange={(e) => set("ownerName", e.target.value)}
              placeholder="Jane Doe"
            />
          </Field>
          <Field label="Owner national ID" htmlFor="ownerNationalId" error={errors.ownerNationalId}>
            <Input
              id="ownerNationalId"
              value={form.ownerNationalId}
              onChange={(e) => set("ownerNationalId", e.target.value.toUpperCase())}
              placeholder="CIT-1234567"
              className="font-mono"
            />
          </Field>
        </Section>

        <Section title="Location">
          <Field label="Address / locality" htmlFor="location" error={errors.location}>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="KN 45 St, Nyarugenge"
            />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="District" htmlFor="district" error={errors.district}>
              <Input
                id="district"
                value={form.district}
                onChange={(e) => set("district", e.target.value)}
                placeholder="Nyarugenge"
              />
            </Field>
            <Field label="Region / Province" htmlFor="region" error={errors.region}>
              <Input
                id="region"
                value={form.region}
                onChange={(e) => set("region", e.target.value)}
                placeholder="Kigali"
              />
            </Field>
          </div>
        </Section>

        <Section title="Specification">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Area (m²)" htmlFor="areaSqm" error={errors.areaSqm}>
              <Input
                id="areaSqm"
                type="number"
                inputMode="numeric"
                min={1}
                value={form.areaSqm}
                onChange={(e) => set("areaSqm", e.target.value)}
                placeholder="850"
              />
            </Field>
            <Field label="Land use" htmlFor="use" error={errors.use}>
              <Select value={form.use} onValueChange={(v) => set("use", v as LandUse)}>
                <SelectTrigger id="use">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="agricultural">Agricultural</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="mixed">Mixed use</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field
            label="Notes (optional)"
            htmlFor="description"
            error={errors.description}
            hint="Additional context that will be hashed alongside the record."
          >
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Boundary stones GPS-tagged on east edge…"
              rows={3}
            />
          </Field>
        </Section>

        <div className="flex flex-col-reverse items-stretch gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Record will be cryptographically anchored on submission.
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/lands">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[image:var(--gradient-emerald)] text-primary-foreground shadow-[var(--shadow-elegant)] hover:opacity-95"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Anchoring…
                </>
              ) : (
                "Register & anchor"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-primary">
        {title}
      </h2>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
