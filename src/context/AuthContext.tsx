import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authService } from "@/services/authService";
import type { AuthSession, LoginPayload, RegisterPayload, Role, User } from "@/lib/auth/types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  hasRole: (roles: Role[] | Role) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Read the session synchronously on the client so protected routes never
  // get stuck on the loading spinner waiting for an effect to flush. On the
  // server there is no localStorage, so we start unauthenticated and the
  // client takes over on hydration.
  const [session, setSession] = useState<AuthSession | null>(() =>
    typeof window === "undefined" ? null : authService.getSession(),
  );
  const [isLoading, setIsLoading] = useState(() => typeof window === "undefined");

  useEffect(() => {
    // Re-sync after hydration in case the SSR HTML reflected a stale state,
    // and clear the loading flag for the (rare) SSR-only initial paint.
    const current = authService.getSession();
    setSession((prev) => (prev?.token === current?.token ? prev : current));
    setIsLoading(false);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const s = await authService.login(payload);
    setSession(s);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const s = await authService.register(payload);
    setSession(s);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setSession(null);
  }, []);

  const hasRole = useCallback(
    (roles: Role[] | Role) => authService.hasRole(session, roles),
    [session],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isAuthenticated: !!session,
      isLoading,
      login,
      register,
      logout,
      hasRole,
    }),
    [session, isLoading, login, register, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
