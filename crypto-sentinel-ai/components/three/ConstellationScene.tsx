"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

/**
 * 3D wallet constellation — a rotating network of wallet nodes (color-coded by
 * label) connected by their relationships, with additive glow + bloom. The
 * on-chain-clustering view rendered in space. Auto-spins with mouse parallax.
 *
 * Pure react-three-fiber. Rendered ssr:false on its own page, so it never runs
 * alongside the dashboard globe (one WebGL context at a time).
 */

const COLORS: Record<string, string> = {
  token: "#00ff41",
  smart: "#22d3ff",
  whale: "#b26bff",
  vc: "#ffcf3a",
  exchange: "#ff2957",
  team: "#00ffe0",
};
const TYPE_KEYS = ["smart", "whale", "vc", "exchange", "team"];

function buildNetwork(n: number) {
  const nodes = Array.from({ length: n }, (_, i) => {
    const dir = new THREE.Vector3(
      Math.random() * 2 - 1,
      (Math.random() * 2 - 1) * 0.62,
      Math.random() * 2 - 1
    );
    dir.normalize().multiplyScalar(0.5 + Math.random() * 2.1);
    const hub = i < 5;
    return { pos: dir, type: hub ? "token" : TYPE_KEYS[(Math.random() * TYPE_KEYS.length) | 0], hub };
  });

  const positions = new Float32Array(n * 3);
  const colors = new Float32Array(n * 3);
  nodes.forEach((nd, i) => {
    positions.set([nd.pos.x, nd.pos.y, nd.pos.z], i * 3);
    const c = new THREE.Color(COLORS[nd.type]);
    colors.set([c.r, c.g, c.b], i * 3);
  });

  // Connect each node to its nearest neighbours (hubs fan out more).
  const edge: number[] = [];
  for (let i = 0; i < n; i++) {
    const near = nodes
      .map((nd, j) => ({ j, d: nodes[i].pos.distanceTo(nd.pos) }))
      .filter((o) => o.j !== i)
      .sort((a, b) => a.d - b.d);
    const k = nodes[i].hub ? 5 : 2;
    for (let m = 0; m < k; m++) {
      const a = nodes[i].pos;
      const b = nodes[near[m].j].pos;
      edge.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  }

  const hubs = nodes
    .filter((nd) => nd.hub)
    .map((nd) => [nd.pos.x, nd.pos.y, nd.pos.z] as [number, number, number]);

  return { positions, colors, edgePositions: new Float32Array(edge), hubs };
}

function Network({ quality }: { quality: number }) {
  const group = useRef<THREE.Group>(null);
  const count = Math.floor(64 * quality);
  const { positions, colors, edgePositions, hubs } = useMemo(() => buildNetwork(count), [count]);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.08;
    const px = state.pointer.x * 0.4;
    const py = state.pointer.y * 0.3;
    group.current.rotation.x += (py - group.current.rotation.x) * 0.03;
    group.current.rotation.z += (-px * 0.15 - group.current.rotation.z) * 0.03;
  });

  return (
    <group ref={group}>
      {/* edges */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[edgePositions, 3]} count={edgePositions.length / 3} />
        </bufferGeometry>
        <lineBasicMaterial color="#00ff41" transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>

      {/* nodes */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} count={positions.length / 3} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} count={colors.length / 3} />
        </bufferGeometry>
        <pointsMaterial size={0.06} vertexColors transparent opacity={0.95} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>

      {/* hub glow */}
      {hubs.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshBasicMaterial color="#00ff41" transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export default function ConstellationScene({ quality = 1 }: { quality?: number }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.2], fov: 50 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.4} />
      <Network quality={quality} />
      <EffectComposer>
        <Bloom intensity={1.2} luminanceThreshold={0.06} luminanceSmoothing={0.9} mipmapBlur radius={0.8} />
      </EffectComposer>
    </Canvas>
  );
}
