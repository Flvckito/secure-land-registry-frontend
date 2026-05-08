/**
 * Admin user-management service.
 *
 * Reads/writes the same `lr.users.v1` localStorage bucket the auth service
 * seeds, so role changes persist for the active session. Swap with HTTP
 * calls when wiring the real backend; signatures should remain stable.
 */
import type { Role, User } from "@/lib/auth/types";

const USERS_KEY = "lr.users.v1";

interface StoredUser extends User {
  passwordHash: string;
}

const wait = (ms = 220) => new Promise((r) => setTimeout(r, ms));

function read(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function write(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function strip(u: StoredUser): User {
  const { passwordHash: _ph, ...rest } = u;
  return rest;
}

export const userService = {
  async list(): Promise<User[]> {
    await wait();
    return read()
      .map(strip)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async findByNationalId(nationalId: string): Promise<User | null> {
    await wait(120);
    const norm = nationalId.trim().toLowerCase();
    const u = read().find((x) => (x.nationalId ?? "").toLowerCase() === norm);
    return u ? strip(u) : null;
  },

  async setRole(userId: string, role: Role, actor: User): Promise<User> {
    await wait(260);
    if (actor.role !== "admin") throw new Error("Only admins can change roles.");
    if (actor.id === userId && role !== "admin") {
      throw new Error("You cannot demote your own admin account.");
    }
    const users = read();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error("User not found.");
    users[idx] = { ...users[idx], role };
    write(users);
    return strip(users[idx]);
  },

  async remove(userId: string, actor: User): Promise<void> {
    await wait(260);
    if (actor.role !== "admin") throw new Error("Only admins can delete users.");
    if (actor.id === userId) throw new Error("You cannot delete your own account.");
    const users = read();
    const next = users.filter((u) => u.id !== userId);
    if (next.length === users.length) throw new Error("User not found.");
    write(next);
  },
};
