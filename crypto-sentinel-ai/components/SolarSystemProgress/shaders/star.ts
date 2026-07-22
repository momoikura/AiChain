import { GLSL_NOISE } from "./noise";

/**
 * The progress indicator itself — a miniature star.
 *
 * Two passes: an emissive photosphere sphere (granulation + plasma convection)
 * and a camera-facing corona billboard (additive, with procedural flares and a
 * refraction-style heat shimmer around the limb).
 */

export const STAR_CORE_VERT = /* glsl */ `
varying vec3 vLocal;
varying vec3 vNormalW;
varying vec3 vViewW;
void main() {
  vLocal = position;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vViewW = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const STAR_CORE_FRAG = /* glsl */ `
precision highp float;
varying vec3 vLocal;
varying vec3 vNormalW;
varying vec3 vViewW;

uniform float uTime;
uniform vec3  uCore;      // hottest colour, centre
uniform vec3  uEdge;      // cooler limb colour
uniform float uIntensity;
uniform float uFlicker;

${GLSL_NOISE}

void main() {
  vec3 p = normalize(vLocal);

  // Convection granulation — fine cells drifting over a slower churn.
  float churn = warpedFbm(p * 2.2 + vec3(0.0, 0.0, uTime * 0.28), uTime * 0.5);
  float gran  = fbm(p * 9.0 + vec3(uTime * 0.22, uTime * 0.16, 0.0), 4, 2.2, 0.5);
  float plasma = churn * 0.68 + gran * 0.32;

  // Hot spots where convection cells surface.
  float hot = smoothstep(0.10, 0.62, plasma);

  vec3 color = mix(uEdge, uCore, hot);

  // Inverse limb darkening: emissive bodies read brightest face-on.
  float facing = max(dot(normalize(vNormalW), normalize(vViewW)), 0.0);
  color *= 0.55 + pow(facing, 1.6) * 0.85;

  // Sub-second brightness flicker; amplitude stays small so it never strobes.
  color *= uIntensity * (1.0 + uFlicker * 0.06 * sin(uTime * 9.3));

  gl_FragColor = vec4(color, 1.0);
}
`;

/** Corona billboard — additive, camera-facing, with flares and heat shimmer. */
export const CORONA_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  // Billboard: strip rotation from the model-view matrix so the quad always
  // faces the camera without a per-frame CPU lookAt().
  mat4 mv = viewMatrix * modelMatrix;
  mv[0].xyz = vec3(length(modelMatrix[0].xyz), 0.0, 0.0);
  mv[1].xyz = vec3(0.0, length(modelMatrix[1].xyz), 0.0);
  mv[2].xyz = vec3(0.0, 0.0, length(modelMatrix[2].xyz));
  gl_Position = projectionMatrix * mv * vec4(position, 1.0);
}
`;

export const CORONA_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;

uniform float uTime;
uniform vec3  uColor;
uniform float uIntensity;

${GLSL_NOISE}

void main() {
  vec2 c = vUv - 0.5;
  float r = length(c) * 2.0;
  if (r > 1.0) discard;

  float ang = atan(c.y, c.x);

  // Heat shimmer: perturb the sampled radius, not the geometry — cheap, and
  // reads as refraction through hot plasma.
  float shimmer = snoise(vec3(cos(ang) * 3.0, sin(ang) * 3.0, uTime * 0.9)) * 0.045;
  float rr = r + shimmer * smoothstep(0.15, 1.0, r);

  // Base corona falloff.
  float corona = pow(1.0 - clamp(rr, 0.0, 1.0), 3.1);

  // Solar flares — angular tongues that rise and fall independently.
  float flare = fbm(vec3(cos(ang) * 2.4, sin(ang) * 2.4, uTime * 0.42), 4, 2.0, 0.5);
  flare = smoothstep(0.05, 0.85, flare);
  float flareMask = pow(1.0 - clamp(rr, 0.0, 1.0), 1.5) * flare * 0.55;

  float a = (corona + flareMask) * uIntensity;
  if (a < 0.003) discard;

  gl_FragColor = vec4(uColor * a, a);
}
`;
