import { redirect } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { MobileNav } from "@/components/shell/MobileNav";
import { CyberBackdrop } from "@/components/fx/CyberBackdrop";
import { BootSequence } from "@/components/fx/BootSequence";
import { AIHologram } from "@/components/fx/AIHologram";
import { CommandPalette } from "@/components/command/CommandPalette";
import { Providers } from "@/components/providers/Providers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();

  let user = { name: "Preview User", email: "preview@sentinel.ai" };

  if (configured) {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    // Middleware should have redirected already; this is defense in depth.
    if (!authUser) redirect("/login");
    user = {
      name: (authUser.user_metadata?.name as string) || authUser.email || "Account",
      email: authUser.email || "",
    };
  }

  return (
    <Providers>
      <CyberBackdrop rainOpacity={0.32} />
      <BootSequence />
      <AIHologram />
      <CommandPalette />
      <Sidebar />
      <MobileNav />
      <div className="relative z-10 lg:pl-60">
        <Topbar user={user} />
        {!configured && <PreviewBanner />}
        <main className="mx-auto max-w-[1500px] px-4 py-5 pb-24 sm:px-6 sm:py-6 lg:px-8 lg:pb-6">
          {children}
        </main>
        <footer className="mx-auto max-w-[1500px] px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-10">
          <p className="text-[11px] leading-relaxed text-white/30">
            Crypto Sentinel AI provides probabilistic, evidence-based assessments — not
            guarantees and not financial advice. Signals are cross-validated across multiple
            independent sources; no alert is ever generated from a single source. In this build,
            external providers are simulated behind live-ready adapters and no real trades are
            executed.
          </p>
        </footer>
      </div>
    </Providers>
  );
}

function PreviewBanner() {
  return (
    <div className="mx-auto max-w-[1500px] px-4 pt-4 sm:px-6 lg:px-8">
      <div className="glass flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-signal-yellow/25 bg-signal-yellow/5 px-4 py-2.5 text-[12px]">
        <span className="font-semibold text-signal-yellow">Preview mode</span>
        <span className="text-white/50">
          Supabase isn’t configured yet, so authentication and data persistence are off. Add your
          project keys to <span className="tabular text-white/70">.env.local</span> to enable
          accounts &amp; storage.
        </span>
        <Link href="/sources" className="ml-auto hidden text-signal-green hover:underline sm:block">
          Setup guide →
        </Link>
      </div>
    </div>
  );
}
