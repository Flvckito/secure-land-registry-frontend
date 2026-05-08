import { Link, useRouterState } from "@tanstack/react-router";
import { Landmark, Menu, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext.tsx";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

const roleLabel: Record<string, string> = {
  admin: "Administrator",
  land_officer: "Land Officer",
  citizen: "Citizen",
};

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onToggleSidebar}
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-[image:var(--gradient-emerald)] text-primary-foreground shadow-[var(--shadow-elegant)]">
              <Landmark className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <div className="font-display text-base font-bold tracking-tight">
                LandChain Registry
              </div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                National Land Authority
              </div>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {!isAuthenticated ? (
            <>
              {pathname !== "/login" && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Sign in</Link>
                </Button>
              )}
              {pathname !== "/register" && (
                <Button
                  asChild
                  size="sm"
                  className="bg-(image:--gradient-emerald) shadow-(--shadow-elegant)"
                >
                  <Link to="/register">Create account</Link>
                </Button>
              )}
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
                    <UserIcon className="h-4 w-4" />
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block text-sm font-medium leading-none">{user?.name}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {roleLabel[user?.role ?? ""]}
                    </span>
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="text-sm font-medium">{user?.name}</div>
                  <div className="text-xs font-normal text-muted-foreground">{user?.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
