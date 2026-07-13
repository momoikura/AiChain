"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

/**
 * Holographic crypto planet — a rotating point-cloud globe with wireframe
 * lattice, network arcs, an atmosphere shell and a drifting particle field.
 * Pure react-three-fiber (no drei). Additive blending fakes bloom cheaply.
 *
 * Perf: DPR capped at 1.5, point counts scale down on small screens, and the
 * whole thing is lazy-loaded (ssr:false) behind a fallback by HeroGlobe.
 */

const GREEN = new THREE.Color("#00ff41");
const CYAN = new THREE.Color("#00ffe0");

/** Even points on a sphere via the Fibonacci spiral. */
function fibonacciSphere(n: number, radius: number): Float32Array {
  const arr = new Float32Array(n * 3);
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    arr[i * 3] = Math.cos(theta) * r * radius;
    arr[i * 3 + 1] = y * radius;
    arr[i * 3 + 2] = Math.sin(theta) * r * radius;
  }
  return arr;
}

function randomField(n: number, spread: number): Float32Array {
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i++) arr[i] = (Math.random() - 0.5) * spread;
  return arr;
}

/** A few great-circle-ish arcs between random surface nodes. */
function buildArcs(surface: Float32Array, count: number): THREE.BufferGeometry[] {
  const geos: THREE.BufferGeometry[] = [];
  const total = surface.length / 3;
  for (let i = 0; i < count; i++) {
    const a = (Math.random() * total) | 0;
    const b = (Math.random() * total) | 0;
    const va = new THREE.Vector3(surface[a * 3], surface[a * 3 + 1], surface[a * 3 + 2]);
    const vb = new THREE.Vector3(surface[b * 3], surface[b * 3 + 1], surface[b * 3 + 2]);
    const mid = va.clone().add(vb).multiplyScalar(0.5).setLength(1.55);
    const curve = new THREE.QuadraticBezierCurve3(va, mid, vb);
    geos.push(new THREE.BufferGeometry().setFromPoints(curve.getPoints(36)));
  }
  return geos;
}

/** Slowly rotating HUD targeting ring around the planet. */
function HudRing() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, d) => {
    if (ref.current) ref.current.rotation.z += d * 0.35;
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2.3, 0, 0]}>
      <ringGeometry args={[1.46, 1.49, 96]} />
      <meshBasicMaterial
        color={CYAN}
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

/** Floating wireframe data cubes orbiting the globe. */
function DataCubes({ count = 7 }: { count?: number }) {
  const g = useRef<THREE.Group>(null);
  const cubes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        const r = 1.4 + (i % 2) * 0.16;
        return {
          pos: [Math.cos(a) * r, (Math.random() - 0.5) * 0.9, Math.sin(a) * r] as [number, number, number],
          size: 0.045 + Math.random() * 0.035,
          color: i % 2 ? CYAN : GREEN,
        };
      }),
    [count]
  );
  useFrame((_, d) => {
    if (g.current) g.current.rotation.y += d * 0.28;
  });
  return (
    <group ref={g}>
      {cubes.map((c, i) => (
        <mesh key={i} position={c.pos} rotation={[i, i * 0.5, 0]}>
          <boxGeometry args={[c.size, c.size, c.size]} />
          <meshBasicMaterial color={c.color} wireframe transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function Globe({ quality }: { quality: number }) {
  const group = useRef<THREE.Group>(null);
  const surfaceCount = Math.floor(1600 * quality);
  const starCount = Math.floor(1400 * quality);

  const surface = useMemo(() => fibonacciSphere(surfaceCount, 1), [surfaceCount]);
  const stars = useMemo(() => randomField(starCount, 9), [starCount]);
  const wire = useMemo(() => new THREE.IcosahedronGeometry(1.001, 4), []);
  const arcs = useMemo(() => buildArcs(surface, 14), [surface]);

  useFrame((state, delta) => {
    if (!group.current) return;
    // Slow auto-spin + subtle parallax toward pointer.
    group.current.rotation.y += delta * 0.12;
    const px = state.pointer.x * 0.25;
    const py = state.pointer.y * 0.2;
    group.current.rotation.x += (py - group.current.rotation.x) * 0.04;
    group.current.position.x += (px - group.current.position.x) * 0.04;
  });

  return (
    <group ref={group}>
      {/* Surface node cloud */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[surface, 3]}
            count={surface.length / 3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.02}
          color={GREEN}
          transparent
          opacity={0.9}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Wireframe lattice */}
      <lineSegments>
        <wireframeGeometry args={[wire]} />
        <lineBasicMaterial color={GREEN} transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>

      {/* Network arcs */}
      {arcs.map((g, i) => (
        <primitive key={i} object={new THREE.Line(g, new THREE.LineBasicMaterial({ color: i % 3 === 0 ? CYAN : GREEN, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }))} />
      ))}

      {/* Atmosphere shell */}
      <mesh>
        <sphereGeometry args={[1.18, 32, 32]} />
        <meshBasicMaterial color={GREEN} transparent opacity={0.035} side={THREE.BackSide} />
      </mesh>

      {/* Drifting particle field */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars, 3]} count={stars.length / 3} />
        </bufferGeometry>
        <pointsMaterial size={0.014} color={GREEN} transparent opacity={0.4} sizeAttenuation depthWrite={false} />
      </points>

      {/* HUD ring + orbiting data cubes */}
      <HudRing />
      <DataCubes />
    </group>
  );
}

export default function GlobeScene({ quality = 1 }: { quality?: number }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 3.4], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.4} />
      <Globe quality={quality} />
      {/* Real volumetric bloom — makes the additive green nodes glow. The page
          background is black, so the composer's opaque pass is invisible. */}
      <EffectComposer>
        <Bloom
          intensity={1.15}
          luminanceThreshold={0.08}
          luminanceSmoothing={0.9}
          mipmapBlur
          radius={0.75}
        />
      </EffectComposer>
    </Canvas>
  );
}
