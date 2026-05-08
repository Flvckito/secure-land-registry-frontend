import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuthShell } from "@/components/auth/AuthShell";
import { useAuth } from "@/context/AuthContext.tsx";
import type { Role } from "@/lib/auth/types";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — LandChain Registry" },
      {
        name: "description",
        content: "Register for a citizen or officer account on the national land registry.",
      },
    ],
  }),
  component: RegisterPage,
});

const schema = z
  .object({
    name: z.string().trim().min(2, "Full name is required.").max(80),
    email: z.string().trim().email("Enter a valid email address.").max(120),
    nationalId: z
      .string()
      .trim()
      .min(4, "National ID is required.")
      .max(40, "National ID is too long."),
    role: z.enum(["citizen", "land_officer"]),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(72)
      .regex(/[A-Z]/, "Include at least one uppercase letter.")
      .regex(/[0-9]/, "Include at least one number."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Passwords do not match.",
  });

type FormState = {
  name: string;
  email: string;
  nationalId: string;
  role: Role;
  password: string;
  confirm: string;
};

type FieldErrors = Partial<Record<keyof FormState | "_form", string>>;

function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    nationalId: "",
    role: "citizen",
    password: "",
    confirm: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate({ to: "/dashboard" });
  }, [isAuthenticated, navigate]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fe: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        fe[issue.path[0] as keyof FormState] = issue.message;
      }
      setErrors(fe);
      return;
    }
    setSubmitting(true);
    try {
      await register({
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        nationalId: parsed.data.nationalId,
        role: parsed.data.role,
      });
      toast.success("Account created successfully");
      navigate({ to: "/dashboard" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed.";
      setErrors({ _form: message });
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Register to access the national land registry."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {errors._form && (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {errors._form}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Full legal name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            aria-invalid={!!errors.name}
            placeholder="As shown on your national ID"
            className="h-11"
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              aria-invalid={!!errors.email}
              placeholder="you@domain.com"
              className="h-11"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="nationalId">National ID</Label>
            <Input
              id="nationalId"
              value={form.nationalId}
              onChange={(e) => update("nationalId", e.target.value)}
              aria-invalid={!!errors.nationalId}
              placeholder="e.g. 1234567890"
              className="h-11"
            />
            {errors.nationalId && <p className="text-xs text-destructive">{errors.nationalId}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Account type</Label>
          <Select value={form.role} onValueChange={(v) => update("role", v as Role)}>
            <SelectTrigger id="role" className="h-11">
              <SelectValue placeholder="Choose role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="citizen">Citizen — view & request</SelectItem>
              <SelectItem value="land_officer">Land Officer — register & approve</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Administrator accounts are provisioned manually by the registry.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                aria-invalid={!!errors.password}
                placeholder="At least 8 characters"
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
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              value={form.confirm}
              onChange={(e) => update("confirm", e.target.value)}
              aria-invalid={!!errors.confirm}
              placeholder="Re-enter password"
              className="h-11"
            />
            {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}
          </div>
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
              <UserPlus className="h-4 w-4" /> Create account
            </>
          )}
        </Button>

        <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
          By creating an account you confirm the information provided is accurate and consent to the
          registry's data processing terms.
        </p>
      </form>
    </AuthShell>
  );
}
