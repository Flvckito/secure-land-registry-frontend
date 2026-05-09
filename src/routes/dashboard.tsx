import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — LandChain Registry" },
      { name: "description", content: "Your land registry workspace." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardInner />
    </ProtectedRoute>
  );
}

function DashboardInner() {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-glow">
            Workspace
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Welcome, {user?.name.split(" ")[0]}.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            You're signed in as{" "}
            <span className="font-medium text-foreground capitalize">
              {user?.role.replace("_", " ")}
            </span>
            . The full registry, transfer, and verification modules will be wired up next.
          </p>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success md:inline-flex">
          <ShieldCheck className="h-3.5 w-3.5" /> Secure session
        </span>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Registered lands", value: "—", hint: "Coming soon" },
          { label: "Pending transfers", value: "—", hint: "Coming soon" },
          { label: "Verifications today", value: "—", hint: "Coming soon" },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-border bg-card p-5 shadow-(--shadow-card)"
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {c.label}
            </div>
            <div className="mt-2 font-display text-3xl font-bold">{c.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{c.hint}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
