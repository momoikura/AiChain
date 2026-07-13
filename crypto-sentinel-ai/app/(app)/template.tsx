"use client";

import { motion } from "framer-motion";

/**
 * Cinematic route transition. `template.tsx` re-mounts on every navigation
 * inside the (app) group, so each page arrives with a decrypt/scan reveal:
 * a quick clip-wipe + blur-in on the content and a green scanline sweep.
 * Reduced-motion users get an instant swap (MotionConfig).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, filter: "blur(8px)", clipPath: "inset(0 0 100% 0)" }}
        animate={{ opacity: 1, filter: "blur(0px)", clipPath: "inset(0 0 0% 0)" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>

      {/* one-shot scan sweep */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[45] h-40 bg-gradient-to-b from-signal-green/20 to-transparent"
        initial={{ y: "-100%", opacity: 0.8 }}
        animate={{ y: "1200%", opacity: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
    </div>
  );
}
