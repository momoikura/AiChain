import { GLSL_NOISE } from "./noise";

/**
 * Physically based planet surface.
 *
 * Rather than sampling albedo/normal/AO texture maps, the surface is generated
 * procedurally and the normal + occlusion are *derived* from the same elevation
 * field. That keeps the maps perfectly consistent with each other (a common
 * source of artifacts when maps are authored separately) and costs no bandwidth.
 *
 * Lighting is a real Cook-Torrance BRDF: GGX distribution, Smith geometry term,
 * Schlick Fresnel — with ocean and land carrying genuinely different roughness.
 */

export const PLANET_VERT = /* glsl */ `
varying vec3 vLocal;
varying vec3 vNormalW;
varying vec3 vViewW;

void main() {
  vLocal = position;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vViewW = normalize(cameraPosition - worldPos.xyz);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

export const PLANET_FRAG = /* glsl */ `
precision highp float;

varying vec3 vLocal;
varying vec3 vNormalW;
varying vec3 vViewW;

uniform float uTime;
uniform vec3  uLandColor;
uniform vec3  uOceanColor;
uniform vec3  uAtmosColor;
uniform vec3  uLightDir;
uniform float uLightIntensity;
uniform float uGlow;      // hover / completion boost
uniform float uPulse;     // energy pulse 0..1

${GLSL_NOISE}

const float PI = 3.14159265359;

/** Elevation field. Also the source of the normal and AO maps. */
float elevation(vec3 p) {
  float continents = fbm(p * 1.35, 5, 2.1, 0.52);
  float detail     = fbm(p * 6.4, 4, 2.0, 0.45) * 0.16;
  return continents + detail;
}

// --- Cook-Torrance terms -----------------------------------------------------
float distributionGGX(float NdotH, float rough) {
  float a  = rough * rough;
  float a2 = a * a;
  float d  = NdotH * NdotH * (a2 - 1.0) + 1.0;
  return a2 / max(PI * d * d, 1e-5);
}
float geometrySmith(float NdotV, float NdotL, float rough) {
  float k = (rough + 1.0) * (rough + 1.0) / 8.0;
  float gv = NdotV / (NdotV * (1.0 - k) + k);
  float gl = NdotL / (NdotL * (1.0 - k) + k);
  return gv * gl;
}
vec3 fresnelSchlick(float cosT, vec3 F0) {
  return F0 + (1.0 - F0) * pow(clamp(1.0 - cosT, 0.0, 1.0), 5.0);
}

void main() {
  vec3 sphereN = normalize(vLocal);
  float h = elevation(sphereN);

  // Land / ocean split with a soft coastline.
  float land = smoothstep(0.02, 0.16, h);

  // --- Derived normal map ---------------------------------------------------
  // Finite-difference the elevation field across the local tangent basis.
  vec3 tangent   = normalize(cross(vec3(0.0, 1.0, 0.0), sphereN) + 1e-5);
  vec3 bitangent = normalize(cross(sphereN, tangent));
  float eps = 0.028;
  float hT = elevation(normalize(sphereN + tangent * eps));
  float hB = elevation(normalize(sphereN + bitangent * eps));
  // Ocean is flat; only landmass carries relief.
  float relief = land * 0.85;
  vec3 perturbed = normalize(
    vNormalW
    - normalize(mat3(modelMatrix) * tangent)   * (hT - h) / eps * relief * 0.09
    - normalize(mat3(modelMatrix) * bitangent) * (hB - h) / eps * relief * 0.09
  );

  // --- Derived ambient occlusion -------------------------------------------
  // Cavities (below-average elevation next to high ground) self-occlude.
  float cavity = clamp((h - min(hT, hB)) * 2.2, 0.0, 1.0);
  float ao = mix(1.0, 0.62, cavity * land);

  // --- Material -------------------------------------------------------------
  vec3  albedo    = mix(uOceanColor, uLandColor, land);
  float roughness = mix(0.14, 0.88, land);
  float metalness = mix(0.28, 0.02, land);   // wet ocean reads slightly metallic

  vec3 N = perturbed;
  vec3 V = normalize(vViewW);
  vec3 L = normalize(uLightDir);
  vec3 H = normalize(V + L);

  float NdotL = max(dot(N, L), 0.0);
  float NdotV = max(dot(N, V), 1e-4);
  float NdotH = max(dot(N, H), 0.0);

  vec3 F0 = mix(vec3(0.04), albedo, metalness);
  vec3 F  = fresnelSchlick(max(dot(H, V), 0.0), F0);
  float D = distributionGGX(NdotH, roughness);
  float G = geometrySmith(NdotV, NdotL, roughness);

  vec3 specular = (D * G * F) / max(4.0 * NdotV * NdotL, 1e-4);
  vec3 kD = (1.0 - F) * (1.0 - metalness);
  vec3 diffuse = kD * albedo / PI;

  vec3 color = (diffuse + specular) * NdotL * uLightIntensity * ao;

  // --- Subsurface / atmospheric scatter at the terminator -------------------
  // Light bleeding around the day-night edge; the single strongest cue that a
  // sphere has an atmosphere rather than being a flat disc.
  float terminator = pow(1.0 - abs(dot(N, L)), 3.0);
  color += uAtmosColor * terminator * 0.16 * smoothstep(-0.35, 0.25, dot(N, L));

  // --- Night side ------------------------------------------------------------
  // Never fully black: keeps WCAG contrast behind the percentage readable.
  float night = smoothstep(0.08, -0.3, dot(N, L));
  color += albedo * night * 0.05;
  color += uAtmosColor * night * 0.018;

  // --- Fresnel atmosphere ----------------------------------------------------
  float rim = pow(1.0 - NdotV, 3.4);
  color += uAtmosColor * rim * (0.30 + uGlow * 0.42);

  // Energy pulse on progress change / completion.
  color += uAtmosColor * uPulse * (0.16 + rim * 0.5);

  color *= ao;
  gl_FragColor = vec4(color, 1.0);
}
`;

/** Thin animated cloud shell rendered on a slightly larger sphere. */
export const CLOUD_VERT = /* glsl */ `
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

export const CLOUD_FRAG = /* glsl */ `
precision highp float;
varying vec3 vLocal;
varying vec3 vNormalW;
varying vec3 vViewW;

uniform float uTime;
uniform vec3  uLightDir;
uniform vec3  uTint;
uniform float uOpacity;

${GLSL_NOISE}

void main() {
  vec3 p = normalize(vLocal);
  // Two counter-drifting layers so cloud motion never looks like a spinning texture.
  float a = fbm(p * 2.6 + vec3(uTime * 0.010, 0.0, 0.0), 5, 2.0, 0.5);
  float b = fbm(p * 4.1 - vec3(uTime * 0.006, uTime * 0.003, 0.0), 4, 2.0, 0.5);
  float density = smoothstep(0.12, 0.62, a * 0.65 + b * 0.35);

  float NdotL = max(dot(normalize(vNormalW), normalize(uLightDir)), 0.0);
  float lit = pow(NdotL, 0.75);

  // Fade clouds at the silhouette so the shell never shows a hard edge.
  float facing = pow(max(dot(normalize(vNormalW), normalize(vViewW)), 0.0), 0.55);

  float alpha = density * uOpacity * facing * (0.18 + lit * 0.9);
  if (alpha < 0.004) discard;
  gl_FragColor = vec4(uTint * (0.35 + lit * 0.8), alpha);
}
`;
