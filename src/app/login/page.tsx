"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Flame, ShieldCheck, Sparkles, Thermometer } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push(params.get("callbackUrl") || "/");
    router.refresh();
  }

  function fillDemo(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("password123");
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_#7a2333,_#1a0a0f_65%)] p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <Flame className="h-5 w-5" strokeWidth={2.25} fill="currentColor" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Skinergy</span>
        </div>

        <div className="animate-slide-up">
          <h1 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">
            A complete burn monitoring ecosystem.
          </h1>
          <p className="mt-4 max-w-sm text-white/70">
            Physical device, AI medical assistant, and hospital-grade patient
            monitoring — in one connected platform.
          </p>
          <div className="mt-10 flex flex-col gap-4">
            <Feature icon={Thermometer} text="Real-time device scans with severity tracking" />
            <Feature icon={Sparkles} text="Context-aware AI assistant for every burn case" />
            <Feature icon={ShieldCheck} text="Hospital-grade patient data isolation" />
          </div>
        </div>

        <p className="text-xs text-white/40">© 2026 Skinergy Medical Technologies</p>
      </div>

      <div className="flex items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-500 text-white">
              <Flame className="h-5 w-5" strokeWidth={2.25} fill="currentColor" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Skinergy</span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
          <p className="mt-1.5 text-sm text-[var(--muted)]">
            Sign in to continue to your dashboard.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@skinergy.health"
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-[var(--status-danger-bg)] px-3 py-2 text-sm text-[var(--status-danger-fg)]">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" loading={loading}>
              Sign in
            </Button>
          </form>

          <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Demo accounts
            </p>
            <div className="flex flex-col gap-1.5">
              <DemoButton onClick={() => fillDemo("ahmed@skinergy.health")} label="Ahmed Hassan" role="Personal patient" />
              <DemoButton onClick={() => fillDemo("dr.laila@skinergy.health")} label="Dr. Laila Mostafa" role="Doctor" />
              <DemoButton onClick={() => fillDemo("nurse.omar@skinergy.health")} label="Omar Farid" role="Nurse" />
            </div>
            <p className="mt-2.5 text-[11px] text-[var(--muted)]">Password: password123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, text }: { icon: typeof Flame; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10">
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <span className="text-sm text-white/80">{text}</span>
    </div>
  );
}

function DemoButton({ onClick, label, role }: { onClick: () => void; label: string; role: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-sm transition hover:bg-[var(--border)]/50"
    >
      <span className="font-medium">{label}</span>
      <span className="text-xs text-[var(--muted)]">{role}</span>
    </button>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
