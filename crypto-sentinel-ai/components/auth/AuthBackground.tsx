/**
 * Ambient animated backdrop for the auth screens. Pure decoration, reuses the
 * app's signal palette + keyframes (aurora, scanline, grid) so it reads as the
 * same product. No client JS needed — all CSS animation.
 */
export function AuthBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Aurora blobs */}
      <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-signal-green/20 blur-[120px] animate-aurora" />
      <div className="absolute -right-40 top-10 h-[460px] w-[460px] rounded-full bg-signal-blue/20 blur-[120px] animate-auroraSlow" />
      <div className="absolute bottom-[-120px] left-1/3 h-[440px] w-[440px] rounded-full bg-signal-violet/20 blur-[120px] animate-aurora" />

      {/* Faint moving grid */}
      <div className="absolute inset-0 bg-grid-faint bg-[size:44px_44px] opacity-[0.6]" />

      {/* Scanline sweep */}
      <div className="absolute inset-x-0 top-0 h-40 animate-scanline bg-gradient-to-b from-signal-green/10 to-transparent" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(5,7,13,0.85)_100%)]" />
    </div>
  );
}
