"use client";

import { motion } from "framer-motion";

/**
 * Cinematic "portal" route transition. `template.tsx` re-mounts on every
 * navigation in the (app) group, so each page arrives as: two black panels
 * retract from center (portal doors opening, green edge glow) while the content
 * reconstructs with a blur + scale + scan sweep. Reduced-motion → instant swap.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, filter: "blur(10px)", scale: 0.99 }}
        animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>

      {/* Portal doors */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[80] bg-black"
        initial={{ height: "50vh" }}
        animate={{ height: 0 }}
        transition={{ duration: 0.42, ease: [0.7, 0, 0.3, 1] }}
      >
        <div className="absolute inset-x-0 bottom-0 h-px bg-signal-green shadow-glow" />
      </motion.div>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] bg-black"
        initial={{ height: "50vh" }}
        animate={{ height: 0 }}
        transition={{ duration: 0.42, ease: [0.7, 0, 0.3, 1] }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-signal-green shadow-glow" />
      </motion.div>

      {/* Scan sweep after the doors open */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[79] h-32 bg-gradient-to-b from-signal-green/20 to-transparent"
        initial={{ y: "-100%", opacity: 0.9 }}
        animate={{ y: "1400%", opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
      />
    </div>
  );
}
