"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { classNames } from "@/lib/format";

type Mode = "login" | "signup";

const DEMO = { email: "demo@sentinel.ai", password: "sentinel" };

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const payload = mode === "login" ? { email, password } : { email, name, password };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      // Supabase may require email confirmation before a session exists.
      if (mode === "signup" && data.needsConfirmation) {
        setNotice(
          "Account created. Check your email to confirm, then sign in. (Or disable email confirmation in your Supabase Auth settings for instant access.)"
        );
        setLoading(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Network error — please try again.");
      setLoading(false);
    }
  }

  function fillDemo() {
    setEmail(DEMO.email);
    setPassword(DEMO.password);
    setError(null);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div className="flex animate-fadeUp items-start gap-2 rounded-xl border border-signal-red/30 bg-signal-red/10 px-3 py-2.5 text-[13px] text-signal-red">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="flex animate-fadeUp items-start gap-2 rounded-xl border border-signal-green/30 bg-signal-green/10 px-3 py-2.5 text-[13px] text-signal-green">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {mode === "signup" && (
        <Field
          icon={<User className="h-4 w-4" />}
          label="Full name"
          type="text"
          value={name}
          onChange={setName}
          placeholder="Satoshi Nakamoto"
          autoComplete="name"
        />
      )}

      <Field
        icon={<Mail className="h-4 w-4" />}
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@wallet.xyz"
        autoComplete="email"
      />

      <div>
        <div className="relative">
          <Field
            icon={<Lock className="h-4 w-4" />}
            label="Password"
            type={showPw ? "text" : "password"}
            value={password}
            onChange={setPassword}
            placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="absolute right-3 top-[34px] text-white/30 transition hover:text-white/70"
            tabIndex={-1}
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={classNames(
          "group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-3 text-sm font-semibold text-base-950 transition",
          "bg-gradient-to-r from-signal-green to-accent-cyan shadow-glow hover:brightness-110 disabled:opacity-70"
        )}
      >
        {/* shimmer sweep */}
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-shimmer" />
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            {mode === "login" ? "Sign in" : "Create account"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>

      {mode === "login" && (
        <button
          type="button"
          onClick={fillDemo}
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-white/60 transition hover:border-signal-green/40 hover:text-white"
        >
          Try the demo account →
        </button>
      )}

      <p className="pt-1 text-center text-[13px] text-white/45">
        {mode === "login" ? (
          <>
            New to Sentinel?{" "}
            <Link href="/signup" className="font-medium text-signal-green hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-signal-green hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

function Field({
  icon,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  icon: React.ReactNode;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-white/40">
        {label}
      </span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="w-full rounded-xl border border-white/10 bg-base-950/60 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-white/25 transition focus:border-signal-green/50 focus:outline-none focus:ring-2 focus:ring-signal-green/20"
        />
      </span>
    </label>
  );
}
