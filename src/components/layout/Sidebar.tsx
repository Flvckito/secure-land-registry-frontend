import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, MapPinned, ArrowLeftRight, ShieldCheck, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext.tsx";
import type { Role } from "@/lib/auth/types.ts";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Role[];
}

const items: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Land Registry", to: "/lands", icon: MapPinned },
  { label: "Transfers", to: "/transfers", icon: ArrowLeftRight },
  { label: "Verify", to: "/verify", icon: ShieldCheck },
  { label: "Users", to: "/admin/users", icon: Users, roles: ["admin"] },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { hasRole, user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const visible = items.filter((i) => !i.roles || hasRole(i.roles));

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm md:hidden",
          open ? "block" : "hidden",
        )}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 -translate-x-full transform border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-200 ease-out md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:translate-x-0",
          open && "translate-x-0",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5 md:hidden">
          <span className="font-display text-sm font-semibold uppercase tracking-widest text-sidebar-primary">
            Menu
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex h-full flex-col gap-1 overflow-y-auto px-3 py-5">
          <div className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/60">
            Workspace
          </div>
          {visible.map((item) => {
            const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_3px_0_0] shadow-sidebar-primary"
                    : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="mt-auto rounded-lg border border-sidebar-border/60 bg-sidebar-accent/40 p-3 text-xs text-sidebar-foreground/80">
            <div className="mb-1 font-display text-sm font-semibold text-sidebar-primary">
              Secured by blockchain
            </div>
            Every record is anchored to an immutable ledger. Logged in as{" "}
            <span className="font-medium text-sidebar-foreground">{user?.name}</span>.
          </div>
        </nav>
      </aside>
    </>
  );
}
