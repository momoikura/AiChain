import * as THREE from "three";
import { TAU } from "./constants";

/**
 * Geometry factories and material helpers.
 *
 * Geometries here are pure functions of their arguments and are cached at module
 * scope where they carry no per-instance state, so several cinematic instances
 * on one page share GPU buffers instead of each uploading their own.
 */

/**
 * Flat ring band in the XY plane carrying the attributes the orbit/trail shaders
 * need: aAngle (0..1 clockwise from 12 o'clock) and aRadial (0 inner, 1 outer).
 */
export function makeRingGeometry(innerR: number, outerR: number, segments = 240): THREE.BufferGeometry {
  const positions = new Float32Array((segments + 1) * 2 * 3);
  const angles = new Float32Array((segments + 1) * 2);
  const radials = new Float32Array((segments + 1) * 2);
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const phi = t * TAU;
    // sin/cos swapped so t=0 lands at 12 o'clock and t increases clockwise,
    // matching the SVG ring this replaces.
    const sx = Math.sin(phi);
    const sy = Math.cos(phi);

    const a = i * 2;
    const b = a + 1;

    positions[a * 3] = sx * innerR;
    positions[a * 3 + 1] = sy * innerR;
    positions[a * 3 + 2] = 0;

    positions[b * 3] = sx * outerR;
    positions[b * 3 + 1] = sy * outerR;
    positions[b * 3 + 2] = 0;

    angles[a] = t;
    angles[b] = t;
    radials[a] = 0;
    radials[b] = 1;

    if (i < segments) {
      indices.push(a, b, a + 2, b, b + 2, a + 2);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aAngle", new THREE.BufferAttribute(angles, 1));
  geo.setAttribute("aRadial", new THREE.BufferAttribute(radials, 1));
  geo.setIndex(indices);
  geo.computeBoundingSphere();
  return geo;
}

/** Starfield on a shell at `radius`, with per-star seed and size. */
export function makeStarfieldGeometry(count: number, radius: number): THREE.BufferGeometry {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // Uniform sphere sampling — naive lat/long clusters badly at the poles.
    const u = Math.random() * 2 - 1;
    const theta = Math.random() * TAU;
    const s = Math.sqrt(1 - u * u);
    const r = radius * (0.85 + Math.random() * 0.15);

    positions[i * 3] = s * Math.cos(theta) * r;
    positions[i * 3 + 1] = s * Math.sin(theta) * r;
    positions[i * 3 + 2] = u * r;

    seeds[i] = Math.random();
    // Heavily skewed toward tiny stars; a few bright ones carry the composition.
    sizes[i] = Math.pow(Math.random(), 2.6) * 2.1 + 0.35;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geo.computeBoundingSphere();
  return geo;
}

/** Orbiting dust / micro-debris. Position.y is the only used component; the
 *  shader derives x/z from aRadius + aSeed so drift costs no CPU. */
export function makeDustGeometry(count: number): THREE.BufferGeometry {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const sizes = new Float32Array(count);
  const radii = new Float32Array(count);
  const speeds = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = 0;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
    positions[i * 3 + 2] = 0;

    seeds[i] = Math.random();
    sizes[i] = Math.pow(Math.random(), 2.0) * 1.6 + 0.25;
    radii[i] = 1.15 + Math.random() * 1.75;
    // Inner particles orbit faster — crude Keplerian falloff, but it reads right.
    speeds[i] = (0.16 + Math.random() * 0.22) / (0.55 + radii[i] * 0.3);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute("aRadius", new THREE.BufferAttribute(radii, 1));
  geo.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4);
  return geo;
}

