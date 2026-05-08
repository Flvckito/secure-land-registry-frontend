import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Search, ShieldCheck, Trash2, UserCog, Users as UsersIcon } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/services/userService.ts";
import type { Role, User } from "@/lib/auth/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "User Management — LandChain" },
      {
        name: "description",
        content: "Admin console: manage registry users, roles and access.",
      },
    ],
  }),
  component: () => (
    <ProtectedRoute roles={["admin"]}>
      <Inner />
    </ProtectedRoute>
  ),
});

const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrator",
  land_officer: "Land officer",
  citizen: "Citizen",
};

const ROLE_TONE: Record<Role, string> = {
  admin: "bg-primary/10 text-primary border-primary/30",
  land_officer:
    "bg-[color:var(--color-gold)]/15 text-gold-foreground border-[color:var(--color-gold)]/40",
  citizen: "bg-muted text-foreground border-border",
};

function Inner() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[] | null>(null);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);

  const refresh = () => userService.list().then(setUsers);
  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.name, u.email, u.nationalId ?? "", u.role].join(" ").toLowerCase().includes(q),
    );
  }, [users, query]);

  const counts = useMemo(() => {
    const base = { all: users?.length ?? 0, admin: 0, land_officer: 0, citizen: 0 } as Record<
      "all" | Role,
      number
    >;
    users?.forEach((u) => (base[u.role] += 1));
    return base;
  }, [users]);

  const onChangeRole = async (target: User, role: Role) => {
    if (!me || target.role === role) return;
    setBusyId(target.id);
    try {
      await userService.setRole(target.id, role, me);
      toast.success(`${target.name} is now ${ROLE_LABEL[role]}`);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change role.");
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async () => {
    if (!me || !confirmDelete) return;
    setBusyId(confirmDelete.id);
    try {
      await userService.remove(confirmDelete.id, me);
      toast.success(`${confirmDelete.name} removed`);
      setConfirmDelete(null);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete user.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <header>
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-glow">
          Administration
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
          User management
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Promote registry officers, demote inactive accounts and remove users who no longer need
          access. Role changes take effect immediately.
        </p>
      </header>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="All users" value={counts.all} icon={UsersIcon} />
        <Stat label="Administrators" value={counts.admin} icon={ShieldCheck} />
        <Stat label="Land officers" value={counts.land_officer} icon={UserCog} />
        <Stat label="Citizens" value={counts.citizen} icon={UsersIcon} />
      </div>

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, national ID…"
            className="h-10 pl-9"
          />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card shadow-(--shadow-card)">
        {users === null ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading users…
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">
            No users match your search.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="px-4">User</TableHead>
                <TableHead className="hidden md:table-cell">National ID</TableHead>
                <TableHead className="hidden lg:table-cell">Created</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="px-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => {
                const isMe = me?.id === u.id;
                return (
                  <TableRow key={u.id} className="hover:bg-muted/30">
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 font-display text-sm font-semibold text-primary">
                          {u.name
                            .split(" ")
                            .slice(0, 2)
                            .map((p) => p[0])
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {u.name}
                            {isMe && (
                              <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                you
                              </span>
                            )}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden py-3 font-mono text-xs md:table-cell">
                      {u.nationalId ?? "—"}
                    </TableCell>
                    <TableCell className="hidden py-3 text-sm lg:table-cell">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${ROLE_TONE[u.role]}`}
                      >
                        {ROLE_LABEL[u.role]}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Select
                          value={u.role}
                          onValueChange={(v) => onChangeRole(u, v as Role)}
                          disabled={busyId === u.id || (isMe && u.role === "admin")}
                        >
                          <SelectTrigger className="h-9 w-37.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrator</SelectItem>
                            <SelectItem value="land_officer">Land officer</SelectItem>
                            <SelectItem value="citizen">Citizen</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isMe || busyId === u.id}
                          onClick={() => setConfirmDelete(u)}
                          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Delete ${u.name}`}
                        >
                          {busyId === u.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this user?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDelete?.name} will lose access immediately. Land records they own remain on
              the ledger and are unaffected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-(--shadow-card)">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}
