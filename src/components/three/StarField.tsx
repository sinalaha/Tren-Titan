"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function Stars({ count = 1500 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null);
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const neonColors = [
      [0, 0.83, 1],
      [0.66, 0.33, 0.97],
      [1, 0.18, 0.33],
      [1, 1, 1]
    ] as const;
    for (let i = 0; i < count; i += 1) {
      pos[i * 3] = (Math.random() - 0.5) * 200;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 200;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 200;
      const c = neonColors[Math.floor(Math.random() * neonColors.length)] ?? neonColors[0];
      col[i * 3] = c[0];
      col[i * 3 + 1] = c[1];
      col[i * 3 + 2] = c[2];
    }
    return [pos, col];
  }, [count]);

  useFrame((_, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.01;
      mesh.current.rotation.x += delta * 0.003;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.3} vertexColors transparent opacity={0.8} sizeAttenuation />
    </points>
  );
}

export function StarField() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 50], fov: 75 }}>
        <Stars />
      </Canvas>
    </div>
  );
}
