export type Role = "admin" | "land_officer" | "citizen";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  nationalId?: string;
  createdAt: string;
}

export interface AuthSession {
  token: string;
  user: User;
  expiresAt: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  nationalId: string;
  role: Role;
}
