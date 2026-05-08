import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Landmark, ShieldCheck } from "lucide-react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}

export function AuthShell({ title, subtitle, footer, children }: AuthShellProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-[image:var(--gradient-hero)] p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(var(--color-gold)_1px,transparent_1px),linear-gradient(90deg,var(--color-gold)_1px,transparent_1px)] [background-size:44px_44px]"
        />
        <Link to="/" className="relative flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-[image:var(--gradient-gold)] text-gold-foreground shadow-[var(--shadow-gold)]">
            <Landmark className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <div className="font-display text-base font-bold">LandChain Registry</div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-primary-foreground/70">
              National Land Authority
            </div>
          </div>
        </Link>

        <div className="relative max-w-md">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-gold)]/40 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--color-gold)]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Encrypted session
          </div>
          <h2 className="mt-5 font-display text-3xl font-bold leading-tight md:text-4xl">
            One source of truth for every parcel of land.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-primary-foreground/80">
            Sign in to register titles, initiate transfers, and verify blockchain-anchored records —
            all under a single secure portal.
          </p>
        </div>

        <div className="relative text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} National Land Authority
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col bg-background">
        <div className="flex items-center justify-between p-5 lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-[image:var(--gradient-emerald)] text-primary-foreground">
              <Landmark className="h-5 w-5" />
            </span>
            <span className="font-display text-sm font-bold">LandChain Registry</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-8 md:px-10">
          <div className="w-full max-w-md">
            <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-6 text-sm text-muted-foreground">{footer}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
