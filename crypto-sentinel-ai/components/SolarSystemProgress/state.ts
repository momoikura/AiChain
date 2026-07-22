/**
 * Per-instance animation state, shared across scene components by ref.
 *
 * Everything that changes per frame lives here rather than in React state:
 * `useFrame` mutates these values directly so the whole scene animates without
 * triggering a single React re-render.
 *
 * IMPORTANT: this module must never import `three`. It is reached from the
 * non-dynamic entry point, so a three.js import here is pulled into every route
 * that renders a gauge and defeats the code-split entirely — worth ~190 kB of
 * First Load JS on routes that only ever show the Canvas2D tier.
 */

/** Minimal vector, deliberately not THREE.Vector3. See note above. */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}
export interface SolarState {
  /** Eased progress, 0..1. Trails the target so the star flies rather than jumps. */
  progress: number;
  /** Target progress, 0..1. */
  target: number;
  /** Hover intensity, 0..1, eased. */
  glow: number;
  /** Hover target. */
  glowTarget: number;
  /** Decaying energy pulse, 0..1. Fired on progress change and at completion. */
  pulse: number;
  /** Direction light arrives from, updated per frame by <Lighting />. */
  lightDir: Vec3;
  /** Star's current position in orbit-local space. */
  starPos: Vec3;
  /** Set once when progress first reaches 100%, so completion fires exactly once. */
  completed: boolean;
}

export function createSolarState(initial: number): SolarState {
  return {
    progress: initial,
    target: initial,
    glow: 0,
    glowTarget: 0,
    pulse: 0,
    // Pre-normalised (-0.6, 0.35, 0.72).
    lightDir: { x: -0.6383, y: 0.3723, z: 0.6738 },
    starPos: { x: 0, y: 0, z: 0 },
    completed: initial >= 1,
  };
}

/** Frame-rate independent exponential smoothing.
 *  `lambda` is the rate — higher converges faster. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}
