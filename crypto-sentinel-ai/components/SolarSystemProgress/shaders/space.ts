import { GLSL_NOISE } from "./noise";

/**
 * Deep-space environment: volumetric nebula shell, distant galaxies, cosmic dust,
 * plus GPU-animated starfield and debris point clouds.
 *
 * All motion is computed in the vertex shader from a single uTime uniform, so
 * the CPU never touches a particle. No per-frame buffer uploads.
 */

export const NEBULA_VERT = /* glsl */ `
varying vec3 vLocal;
void main() {
  vLocal = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const NEBULA_FRAG = /* glsl */ `
precision highp float;
varying vec3 vLocal;

uniform float uTime;
uniform vec3  uColorA;
uniform vec3  uColorB;
uniform float uIntensity;

${GLSL_NOISE}

void main() {
  vec3 p = normalize(vLocal);

  // Domain-warped fbm gives the filamentary structure real nebulae have;
  // plain fbm reads as fog. Drift is extremely slow — barely perceptible.
  float n = warpedFbm(p * 1.6, uTime * 0.35);
  float density = smoothstep(-0.15, 0.75, n);

  // Second, tighter layer for the brighter cores.
  float cores = smoothstep(0.42, 0.92, warpedFbm(p * 3.1 + 11.0, uTime * 0.22));

  vec3 color = mix(uColorA, uColorB, density);
  color += uColorB * cores * 0.6;

  // Distant galaxies: rare, small, slightly brighter than the surrounding gas.
  float g = snoise(p * 22.0);
  float galaxy = smoothstep(0.86, 0.99, g);
  color += vec3(0.55, 0.62, 0.78) * galaxy * 0.5;

  float alpha = (density * 0.30 + cores * 0.22 + galaxy * 0.35) * uIntensity;
  if (alpha < 0.003) discard;
  gl_FragColor = vec4(color, alpha);
}
`;

/** Starfield — twinkling points at effectively infinite distance. */
export const STARS_VERT = /* glsl */ `
attribute float aSeed;
attribute float aSize;
varying float vAlpha;
varying float vSeed;

uniform float uTime;
uniform float uPixelRatio;

void main() {
  vSeed = aSeed;
  // Twinkle: two incommensurate frequencies so the pattern never visibly loops.
  float tw = 0.62
    + 0.26 * sin(uTime * (0.7 + aSeed * 1.9) + aSeed * 40.0)
    + 0.12 * sin(uTime * (1.7 + aSeed * 0.6) + aSeed * 11.0);
  vAlpha = clamp(tw, 0.08, 1.0);

  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uPixelRatio * (44.0 / -mv.z);
}
`;

export const STARS_FRAG = /* glsl */ `
precision highp float;
varying float vAlpha;
varying float vSeed;
uniform vec3 uTint;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  if (r > 0.5) discard;

  // Soft airy-disc falloff rather than a hard dot.
  float core = pow(1.0 - r * 2.0, 2.4);

  // A faint colour spread across the population: real starfields are not white.
  vec3 tint = mix(vec3(0.78, 0.85, 1.0), uTint, vSeed * 0.55);

  float a = core * vAlpha;
  if (a < 0.004) discard;
  gl_FragColor = vec4(tint, a);
}
`;

/**
 * Cosmic dust and micro-debris drifting around the system.
 * Orbital drift is evaluated per-vertex on the GPU.
 */
export const DUST_VERT = /* glsl */ `
attribute float aSeed;
attribute float aSize;
attribute float aRadius;
attribute float aSpeed;
varying float vAlpha;

uniform float uTime;
uniform float uPixelRatio;
uniform float uReveal;   // hover reveals the particle field

void main() {
  float ang = aSeed * 6.2831853 + uTime * aSpeed;

  // Slow vertical bob keeps the field from looking like a flat disc.
  float bob = sin(uTime * (0.25 + aSeed * 0.5) + aSeed * 12.0) * 0.18;

  vec3 pos = vec3(
    cos(ang) * aRadius,
    position.y + bob,
    sin(ang) * aRadius
  );

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSize * uPixelRatio * (30.0 / -mv.z);

  // Depth fade: particles behind the system dim, giving real depth cueing.
  float depth = smoothstep(-4.0, 1.5, mv.z);
  vAlpha = (0.16 + uReveal * 0.6) * depth;
}
`;

export const DUST_FRAG = /* glsl */ `
precision highp float;
varying float vAlpha;
uniform vec3 uColor;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  if (r > 0.5) discard;
  float core = pow(1.0 - r * 2.0, 1.8);
  float a = core * vAlpha;
  if (a < 0.004) discard;
  gl_FragColor = vec4(uColor, a);
}
`;
