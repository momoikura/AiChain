import { Suspense } from "react";
import { IcCheck, IcLock, IcMeme, IcSignals } from "@/components/brand/icons";

import { Logo } from "@/components/brand/Logo";
import { AuthBackground } from "./AuthBackground";
import { AuthForm } from "./AuthForm";

const HIGHLIGHTS = [
  { icon: IcSignals, text: "38+ sources fused into explainable risk scores" },
  { icon: IcMeme, text: "Meme radar with on-chain corroboration" },
  { icon: IcLock, text: "Encrypted keys · 2FA · paper-trading by default" },
];

const TRUST = ["No single-source alerts", "Runs at $0", "Not financial advice"];

export function AuthShell({ mode }: { mode: "login" | "signup" }) {
  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-base-950 text-white">
      <AuthBackground />

      <div className="relative z-10 mx-auto grid min-h-dvh max-w-6xl grid-cols-1 items-center gap-8 px-5 py-10 lg:grid-cols-2 lg:gap-16 lg:px-10">
        {/* Brand / marketing panel */}
        <div className="hidden animate-fadeUp flex-col lg:flex">
          <div className="flex items-center gap-3">
            <div className="animate-floatY">
              <Logo size={44} />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight">Crypto Sentinel AI</div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-signal-green">
                Intelligence Terminal
              </div>
            </div>
          </div>

          <h1 className="mt-10 text-4xl font-bold leading-tight tracking-tight">
            The Bloomberg Terminal
            <br />
            for <span className="bg-gradient-to-r from-signal-green to-accent-cyan bg-clip-text text-transparent">crypto intelligence</span>.
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/55">
            Detect early signs of significant market moves — validated across on-chain, market,
            DeFi, developer, governance, news &amp; social signals before you act.
          </p>

          <div className="mt-8 space-y-3">
            {HIGHLIGHTS.map(({ icon: Icon, text }, i) => (
              <div
                key={i}
                className="flex animate-fadeUp items-center gap-3"
                style={{ animationDelay: `${120 + i * 90}ms` }}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-signal-green">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm text-white/70">{text}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-2">
            {TRUST.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/50"
              >
                <IcCheck className="h-3 w-3 text-signal-green" /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Form card */}
        <div className="mx-auto w-full max-w-md animate-fadeUp" style={{ animationDelay: "80ms" }}>
          {/* Mobile brand */}
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <Logo size={40} />
            <div>
              <div className="text-base font-bold tracking-tight">Crypto Sentinel AI</div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-signal-green">
                Intelligence Terminal
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 shadow-glass sm:p-7">
            <div className="mb-5">
              <h2 className="text-xl font-bold tracking-tight">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="mt-1 text-[13px] text-white/45">
                {mode === "login"
                  ? "Sign in to your intelligence terminal."
                  : "Start monitoring the market in minutes — free."}
              </p>
            </div>

            <Suspense fallback={<div className="h-64" />}>
              <AuthForm mode={mode} />
            </Suspense>
          </div>

          <p className="mt-4 px-2 text-center text-[11px] leading-relaxed text-white/30">
            Probabilistic, evidence-based assessments — not financial advice. Demo auth stores a
            salted password hash locally; no data leaves your machine.
          </p>
        </div>
      </div>
    </div>
  );
}
