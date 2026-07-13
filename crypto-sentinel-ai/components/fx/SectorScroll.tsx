"use client";

import { memo, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Boxes,
  LineChart,
  Blocks,
  GitBranch,
  Landmark,
  Newspaper,
  MessagesSquare,
  Coins,
} from "lucide-react";

/**
 * GSAP horizontal-pinned scrollytelling — the 8 intelligence sectors scroll
 * sideways while the section is pinned vertically (classic Awwwards move).
 *
 * Desktop + motion-on → GSAP pin + scrub. Otherwise → native horizontal swipe
 * (data-lenis-prevent so Lenis doesn't fight it). Isolated via React.memo so
 * the live dashboard's re-renders never disturb the pinned DOM.
 */

const SECTORS = [
  { id: "01", label: "On-Chain", color: "#00ff41", icon: Boxes, desc: "Smart-money, whale, VC, exchange & team wallet clustering. Accumulation, distribution, bridges." },
  { id: "02", label: "Market", color: "#22d3ff", icon: LineChart, desc: "Price, liquidity, funding, open interest, liquidations across 11 venues & DEXs." },
  { id: "03", label: "DeFi", color: "#00ffe0", icon: Blocks, desc: "TVL, new pools, stablecoin flows, protocol revenue, treasury growth." },
  { id: "04", label: "Developer", color: "#ffcf3a", icon: GitBranch, desc: "GitHub commits, contributors, releases, contract deployments. Momentum = conviction." },
  { id: "05", label: "Governance", color: "#22d3ff", icon: Landmark, desc: "DAO proposals, buybacks, burns, votes, partnerships, ecosystem grants." },
  { id: "06", label: "News", color: "#b26bff", icon: Newspaper, desc: "NLP over reputable outlets — entities, sentiment, rumor vs confirmed, dedup." },
  { id: "07", label: "Social", color: "#b26bff", icon: MessagesSquare, desc: "Mentions, engagement, founder posts, bot/spam probability. Never fires alone." },
  { id: "08", label: "Fusion", color: "#00ff41", icon: Coins, desc: "Multi-stage engine fuses all sectors into one explainable confidence score." },
];

function SectorScrollBase() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const desktop = window.innerWidth >= 900;
    if (reduce || !desktop) return;

    gsap.registerPlugin(ScrollTrigger);
    setPinned(true);

    const ctx = gsap.context(() => {
      const distance = () =>
        (track.current?.scrollWidth ?? 0) - (section.current?.clientWidth ?? 0);
      gsap.to(track.current, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section.current,
          start: "top 8%",
          end: () => "+=" + distance(),
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={section} className="relative">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-signal-green/50">
            operator@sentinel:~/sectors$
          </div>
          <h2 className="phosphor text-lg font-bold uppercase tracking-widest">
            Intelligence Sectors
          </h2>
        </div>
        <span className="hidden font-mono text-[10px] uppercase tracking-widest text-signal-green/40 lg:block">
          scroll ↓ to pan →
        </span>
      </div>

      <div
        className={pinned ? "overflow-hidden" : "overflow-x-auto"}
        data-lenis-prevent
      >
        <div ref={track} className="flex w-max gap-4 pb-3">
          {SECTORS.map((s) => {
            const Icon = s.icon;
            return (
              <article
                key={s.id}
                className="glass hud group relative flex h-[260px] w-[300px] shrink-0 flex-col justify-between overflow-hidden rounded-2xl p-5"
              >
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: s.color, opacity: 0.14 }}
                />
                <div className="flex items-center justify-between">
                  <span className="font-mono text-3xl font-bold text-white/10">{s.id}</span>
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl border"
                    style={{ borderColor: `${s.color}55`, color: s.color, background: `${s.color}12` }}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <div>
                  <h3
                    className="text-lg font-bold uppercase tracking-wide"
                    style={{ color: s.color, textShadow: `0 0 10px ${s.color}66` }}
                  >
                    {s.label}
                  </h3>
                  <p className="mt-2 text-[12px] leading-relaxed text-white/55">{s.desc}</p>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full w-full origin-left"
                    style={{ background: s.color, boxShadow: `0 0 8px ${s.color}`, transform: "scaleX(0.65)" }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export const SectorScroll = memo(SectorScrollBase);
