"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";
import { IcClose } from "@/components/brand/icons";

/**
 * Mobile bottom sheet with drag-to-dismiss. Spring slide-up, grabber handle,
 * scrim, safe-area padding. Flick down or drag past the threshold to close.
 * Respects reduced-motion via the global MotionConfig.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            className="glass fixed inset-x-0 bottom-0 z-[141] max-h-[85dvh] overflow-hidden rounded-t-3xl border-x-0 border-b-0"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 500) onClose();
            }}
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="flex touch-none items-center justify-center pt-2.5">
              <div className="h-1 w-10 rounded-full bg-white/25" />
            </div>
            {title && (
              <div className="flex items-center justify-between border-b border-signal-green/15 px-4 py-2.5">
                <span className="font-mono text-[11px] uppercase tracking-widest text-signal-green/70">
                  {title}
                </span>
                <button onClick={onClose} aria-label="Close" className="text-white/40 hover:text-signal-red">
                  <IcClose size={16} />
                </button>
              </div>
            )}
            <div className="max-h-[72dvh] overflow-y-auto px-4 py-4" data-lenis-prevent>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
