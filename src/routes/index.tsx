import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Landmark, Link2, FileSearch, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/components/layout/AppLayout";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LandChain Registry — Secure Land Records on the Blockchain" },
      {
        name: "description",
        content:
          "A national land registry where every title, transfer and verification is anchored to an immutable ledger.",
      },
    ],
  }),
  component: LandingPage,
});

const features = [
  {
    icon: Landmark,
    title: "Authoritative registry",
    body: "Maintain the canonical record of every parcel, plot and title under the National Land Authority.",
  },
  {
    icon: Link2,
    title: "Blockchain-anchored",
    body: "Each record produces an immutable transaction hash — tamper-evident by design.",
  },
  {
    icon: FileSearch,
    title: "Public verification",
    body: "Citizens can independently verify the authenticity of any land record using its hash.",
  },
];

function LandingPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-10 bg-(image:--gradient-hero)" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.07] bg-[linear-gradient(var(--color-gold)_1px,transparent_1px),linear-gradient(90deg,var(--color-gold)_1px,transparent_1px)] bg-size-[48px_48px]"
        />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 md:grid-cols-[1.1fr_0.9fr] md:gap-16 md:px-8 md:py-28 lg:py-32">
          <div className="text-primary-foreground">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-background/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-(--color-gold) backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5" />
              Official · Secure · Immutable
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
              Land ownership,
              <br />
              <span className="bg-(image:--gradient-gold) bg-clip-text text-transparent">
                proven on the blockchain.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-primary-foreground/80 md:text-lg">
              LandChain Registry is the national platform for registering, transferring and
              verifying land titles. Every action is cryptographically signed and anchored to a
              public ledger — preventing fraud, eliminating disputes, and giving citizens true
              certainty over their property.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="bg-(image:--gradient-gold) text-gold-foreground shadow-(--shadow-gold) hover:opacity-95"
              >
                <Link to="/register">
                  Create an account <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link to="/login">Sign in to portal</Link>
              </Button>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-primary-foreground/15 pt-8">
              {[
                ["100%", "Tamper-proof"],
                ["24/7", "Public verification"],
                ["3", "Authority roles"],
              ].map(([k, v]) => (
                <div key={v}>
                  <dt className="font-display text-2xl font-bold text-(--color-gold)">{k}</dt>
                  <dd className="mt-1 text-xs uppercase tracking-wider text-primary-foreground/70">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Decorative certificate card */}
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-gold/10 blur-2xl" />
            <div className="rounded-2xl border border-primary-foreground/10 bg-card/95 p-6 shadow-(--shadow-elegant) backdrop-blur md:p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-md bg-(image:--gradient-emerald) text-primary-foreground">
                    <Landmark className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="font-display text-sm font-semibold">Certificate of Title</div>
                    <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      Parcel No. LR-2026-00471
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
                  <CheckCircle2 className="h-3 w-3" /> Verified
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                {[
                  ["Owner", "Amani N. Kessy"],
                  ["Region", "Coastal · Block 12"],
                  ["Area", "1,420 m²"],
                  ["Issued", "12 Mar 2026"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {k}
                    </div>
                    <div className="mt-0.5 font-medium">{v}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-lg bg-muted/70 p-4">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Blockchain transaction hash
                </div>
                <div className="mt-1 break-all font-mono text-xs text-primary">
                  0x9af3c12e84d7b6e1f0a55b91c7a0d4e8c3f1a2b6d8e4f97a1c0b2d5e6f7a8b9c
                </div>
              </div>
              <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full w-3/4 bg-(image:--gradient-gold)" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-8">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-glow">
              How it works
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
              A registry built for trust.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Three pillars hold the platform together — authority, immutability, and openness — so
              every land record can be trusted without question.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl border border-border bg-card p-6 shadow-(--shadow-card) transition-all hover:-translate-y-0.5 hover:shadow-(--shadow-elegant)"
              >
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card/50">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:px-8">
          <div>© {new Date().getFullYear()} National Land Authority · LandChain Registry</div>
          <div className="text-xs">A blockchain-secured proof of concept.</div>
        </div>
      </footer>
    </PublicLayout>
  );
}
