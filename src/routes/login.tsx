import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/AuthShell";
import { useAuth } from "@/context/AuthContext.tsx";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — LandChain Registry" },
      { name: "description", content: "Access your secure land registry portal." },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type FieldErrors = Partial<Record<"email" | "password" | "_form", string>>;

function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate({ to: "/dashboard" });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      const fe: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        fe[issue.path[0] as "email" | "password"] = issue.message;
      }
      setErrors(fe);
      return;
    }
    setSubmitting(true);
    try {
      await login(parsed.data);
      toast.success("Signed in successfully");
      navigate({ to: "/dashboard" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed.";
      setErrors({ _form: message });
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (role: "admin" | "officer" | "citizen") => {
    const map = {
      admin: { email: "admin@landregistry.gov", password: "Admin@123" },
      officer: { email: "officer@landregistry.gov", password: "Officer@123" },
      citizen: { email: "citizen@example.com", password: "Citizen@123" },
    } as const;
    setEmail(map[role].email);
    setPassword(map[role].password);
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to access the secure land registry portal."
      footer={
        <>
          New to the registry?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        {errors._form && (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {errors._form}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
            placeholder="you@domain.gov"
            className="h-11"
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              className="text-xs font-medium text-muted-foreground hover:text-primary"
              onClick={() => toast.info("Contact your registry administrator.")}
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!errors.password}
              placeholder="••••••••"
              className="h-11 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="h-11 w-full bg-[image:var(--gradient-emerald)] text-primary-foreground shadow-[var(--shadow-elegant)] hover:opacity-95"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <LogIn className="h-4 w-4" /> Sign in
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/40 p-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Demo accounts
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["admin", "officer", "citizen"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => fillDemo(r)}
              className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium capitalize text-foreground transition hover:border-primary hover:text-primary"
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </AuthShell>
  );
}
