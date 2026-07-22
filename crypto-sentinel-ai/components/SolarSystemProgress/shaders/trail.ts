import { GLSL_NOISE } from "./noise";

/**
 * Plasma trail + progress state, rendered as one banded ring.
 *
 * This shader is where progress is actually *communicated*:
 *   t <  progress  → completed arc, softly illuminated
 *   t == progress  → the star's position; brightest plasma
 *   t >  progress  → uncompleted arc, dim
 *
 * Geometry supplies aAngle (0..1 around the ring) and aRadial (0..1 across the
 * band width), so the whole state lives on the GPU — changing progress is a
 * single uniform write, never a geometry rebuild.
 */

export const TRAIL_VERT = /* glsl */ `
attribute float aAngle;
attribute float aRadial;
varying float vAngle;
varying float vRadial;
void main() {
  vAngle = aAngle;
  vRadial = aRadial;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const TRAIL_FRAG = /* glsl */ `
precision highp float;
varying float vAngle;
varying float vRadial;

uniform float uTime;
uniform float uProgress;
uniform vec3  uKey;      // completed / trail colour
uniform vec3  uDim;      // uncompleted colour
uniform float uGlow;     // hover boost
uniform float uPulse;

${GLSL_NOISE}

void main() {
  float t = vAngle;
  float head = uProgress;

  // Soft completed/uncompleted split.
  float done = smoothstep(head + 0.005, head - 0.005, t);

  // Angular distance *behind* the star, wrapping across 0.
  float d = head - t;
  d += step(d, 0.0);            // branchless: if (d < 0.0) d += 1.0

  // Cross-band profile: bright core, feathered edges.
  float band = 1.0 - abs(vRadial * 2.0 - 1.0);
  float core = pow(band, 2.2);
  float halo = pow(band, 0.65);

  // Ionised plasma texture streaming along the trail.
  float plasma = fbm(vec3(t * 46.0, vRadial * 3.0, uTime * 0.75), 3, 2.2, 0.5);
  plasma = 0.72 + plasma * 0.45;

  // The trail: exponential decay behind the star.
  float trail = exp(-d * 13.0) * done;
  // A second, much longer tail of drifting stardust.
  float dust  = exp(-d * 2.6) * done * 0.22;

  // Completed arc holds a steady low illumination.
  float completed = done * 0.30;

  float intensity = (trail * plasma * 1.5 + dust * plasma + completed) * (1.0 + uGlow * 0.6);
  intensity += uPulse * done * 0.35;

  vec3 color = mix(uDim, uKey, clamp(intensity * 1.6, 0.0, 1.0));

  // Uncompleted arc stays visible but clearly inert.
  float baseAlpha = mix(0.11, 1.0, clamp(intensity, 0.0, 1.0));
  float alpha = baseAlpha * (core * 0.75 + halo * 0.3);

  if (alpha < 0.004) discard;
  gl_FragColor = vec4(color * (0.6 + intensity * 1.5), alpha);
}
`;

/**
 * Static guide rings framing the orbit. Glass-like: thin, faintly refractive,
 * brightest where they catch the light.
 */
export const ORBIT_VERT = /* glsl */ `
attribute float aAngle;
attribute float aRadial;
varying float vAngle;
varying float vRadial;
varying vec3 vViewW;
void main() {
  vAngle = aAngle;
  vRadial = aRadial;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vViewW = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const ORBIT_FRAG = /* glsl */ `
precision highp float;
varying float vAngle;
varying float vRadial;
varying vec3 vViewW;

uniform float uTime;
uniform vec3  uColor;
uniform float uOpacity;
uniform float uProgress;
uniform float uGlow;

void main() {
  float band = 1.0 - abs(vRadial * 2.0 - 1.0);
  float line = pow(band, 3.0);

  // Light scattering: the ring brightens as it approaches the star.
  float d = abs(vAngle - uProgress);
  d = min(d, 1.0 - d);
  float scatter = exp(-d * 9.0) * 0.55;

  // Very slow breathing so the ring is never perfectly static.
  float pulse = 0.92 + 0.08 * sin(uTime * 0.6 + vAngle * 6.2831);

  float alpha = line * uOpacity * pulse * (1.0 + uGlow * 0.5) + scatter * band * 0.5;
  if (alpha < 0.003) discard;
  gl_FragColor = vec4(uColor * (0.7 + scatter * 2.0), alpha);
}
`;
