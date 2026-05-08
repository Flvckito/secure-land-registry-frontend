/**
 * Mock auth service.
 *
 * Persists users to localStorage and issues opaque session tokens.
 * Replace these functions with real `fetch` calls when the backend is wired up;
 * keep the same signatures so callers don't need to change.
 */
import type {
  AuthSession,
  LoginPayload,
  RegisterPayload,
  Role,
  User,
} from "@/lib/auth/types";

const USERS_KEY = "lr.users.v1";
const SESSION_KEY = "lr.session.v1";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8h

interface StoredUser extends User {
  passwordHash: string;
}

// Cheap, deterministic non-cryptographic hash. POC only — server should hash.
function hash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function seed() {
  if (typeof window === "undefined") return;
  const existing = readUsers();
  if (existing.length) return;
  const now = new Date().toISOString();
  const seedUsers: StoredUser[] = [
    {
      id: "u_admin",
      name: "Registry Administrator",
      email: "admin@landregistry.gov",
      role: "admin",
      nationalId: "ADMIN-0001",
      createdAt: now,
      passwordHash: hash("Admin@123"),
    },
    {
      id: "u_officer",
      name: "Land Officer",
      email: "officer@landregistry.gov",
      role: "land_officer",
      nationalId: "OFC-0001",
      createdAt: now,
      passwordHash: hash("Officer@123"),
    },
    {
      id: "u_citizen",
      name: "Demo Citizen",
      email: "citizen@example.com",
      role: "citizen",
      nationalId: "CIT-0001",
      createdAt: now,
      passwordHash: hash("Citizen@123"),
    },
  ];
  writeUsers(seedUsers);
}

function strip(u: StoredUser): User {
  const { passwordHash: _ph, ...rest } = u;
  return rest;
}

function issueSession(user: User): AuthSession {
  const session: AuthSession = {
    token: `mock.${user.id}.${crypto.randomUUID()}`,
    user,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

const wait = (ms = 350) => new Promise((r) => setTimeout(r, ms));

export const authService = {
  async login({ email, password }: LoginPayload): Promise<AuthSession> {
    seed();
    await wait();
    const users = readUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.passwordHash !== hash(password)) {
      throw new Error("Invalid email or password.");
    }
    return issueSession(strip(user));
  },

  async register(payload: RegisterPayload): Promise<AuthSession> {
    seed();
    await wait();
    const users = readUsers();
    if (users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase())) {
      throw new Error("An account with this email already exists.");
    }
    const newUser: StoredUser = {
      id: `u_${crypto.randomUUID().slice(0, 8)}`,
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      role: payload.role,
      nationalId: payload.nationalId.trim(),
      createdAt: new Date().toISOString(),
      passwordHash: hash(payload.password),
    };
    writeUsers([...users, newUser]);
    return issueSession(strip(newUser));
  },

  getSession(): AuthSession | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const s: AuthSession = JSON.parse(raw);
      if (s.expiresAt < Date.now()) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return s;
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  },

  hasRole(session: AuthSession | null, roles: Role[] | Role): boolean {
    if (!session) return false;
    const arr = Array.isArray(roles) ? roles : [roles];
    return arr.includes(session.user.role);
  },
};
