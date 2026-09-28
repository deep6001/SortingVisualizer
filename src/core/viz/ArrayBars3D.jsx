import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import Scene, { palette } from '../three/Scene';
import { roleColor, roleOf, withSortedSet } from './arrayState';

export const HEIGHT = 8;

/** Slot geometry shared by the 3D and physics views. */
export function arrayLayout(n) {
  const spacing = Math.min(1.1, 28 / Math.max(1, n));
  return {
    spacing,
    width: spacing * 0.78,
    x: (i) => (i - (n - 1) / 2) * spacing,
    h: (v, max) => 0.15 + (v / max) * HEIGHT,
  };
}

/**
 * Per-slot motion: when a slot takes part in a swap it starts at its partner's x
 * and arcs home, passing the partner in front/behind so the exchange reads in 3D.
 */
export function useSlotMotion(step, i, layout) {
  const m = useRef({ p: 1, fromX: layout.x(i), side: 1, snap: true });
  const swp = step?.swp;
  useEffect(() => {
    if (swp && swp.includes(i)) {
      const partner = swp[0] === i ? swp[1] : swp[0];
      m.current = { p: 0, fromX: layout.x(partner), side: i < partner ? 1 : -1, snap: true };
    }
  }, [step, swp, i, layout]);
  return m;
}

export function sampleMotion(m, homeX, dt, speed = 7) {
  const s = m.current;
  s.p = Math.min(1, s.p + dt * speed);
  const e = 1 - (1 - s.p) ** 3;
  return {
    x: THREE.MathUtils.lerp(s.fromX, homeX, e),
    lift: Math.sin(Math.PI * s.p) * 1.2,
    z: Math.sin(Math.PI * s.p) * 1.1 * s.side,
  };
}

const tmpColor = new THREE.Color();

function Bar({ i, v, max, step, layout, showLabel }) {
  const mesh = useRef();
  const mat = useRef();
  const label = useRef();
  const motion = useSlotMotion(step, i, layout);
  const role = roleOf(i, step);
  const target = layout.h(v, max);

  useFrame((_, dt) => {
    if (!mesh.current) return;
    const { x, lift, z } = sampleMotion(motion, layout.x(i), dt);
    // a swapped-in bar is a different element, so it arrives at full height
    const sy = motion.current.snap ? target : THREE.MathUtils.damp(mesh.current.scale.y, target, 14, dt);
    motion.current.snap = false;
    mesh.current.scale.set(layout.width, sy, layout.width);
    mesh.current.position.set(x, sy / 2 + lift, z);
    if (label.current) label.current.position.set(x, sy + lift + 0.45, z);
    const hot = role === 'swap' || role === 'write' || role === 'compare' || role === 'found';
    tmpColor.set(roleColor[role]);
    mat.current.color.lerp(tmpColor, Math.min(1, dt * 18));
    mat.current.emissive.lerp(tmpColor, Math.min(1, dt * 18));
    mat.current.emissiveIntensity = THREE.MathUtils.damp(mat.current.emissiveIntensity, hot ? 2.2 : role === 'sorted' ? 0.35 : 0.12, 12, dt);
    mat.current.opacity = role === 'out' ? 0.55 : 1;
  });

  return (
    <>
      <mesh ref={mesh} castShadow receiveShadow>
        <boxGeometry />
        <meshStandardMaterial ref={mat} color={roleColor[role]} roughness={0.35} metalness={0.25} transparent toneMapped={false} />
      </mesh>
      {showLabel && (
        <Text ref={label} fontSize={0.36} color={palette.paper} anchorX="center" anchorY="bottom">
          {String(v)}
        </Text>
      )}
    </>
  );
}

export function RangePlate({ step, layout }) {
  const r = step?.marks?.range;
  if (!r) return null;
  const x0 = layout.x(r[0]) - layout.spacing / 2;
  const x1 = layout.x(r[1]) + layout.spacing / 2;
  return (
    <mesh rotation-x={-Math.PI / 2} position={[(x0 + x1) / 2, 0.01, 0]}>
      <planeGeometry args={[x1 - x0, 2.2]} />
      <meshBasicMaterial color={palette.sky} transparent opacity={0.12} />
    </mesh>
  );
}

export function Pointers({ step, layout, max }) {
  const ptr = step?.marks?.ptr;
  if (!ptr) return null;
  return Object.entries(ptr).map(([name, idx]) =>
    idx == null || idx < 0 || idx >= step.a.length ? null : (
      <group key={name} position={[layout.x(idx), layout.h(step.a[idx], max) + 1.3, 0]}>
        <mesh rotation-x={Math.PI}>
          <coneGeometry args={[0.18, 0.4, 16]} />
          <meshStandardMaterial color={palette.amber} emissive={palette.amber} emissiveIntensity={2} toneMapped={false} />
        </mesh>
        <Text position={[0, 0.5, 0]} fontSize={0.4} color={palette.amber}>
          {name}
        </Text>
      </group>
    ),
  );
}

export function AuxRow({ step }) {
  const aux = step?.marks?.aux;
  if (!aux) return null;
  const n = aux.values.length;
  const sp = Math.min(0.6, 20 / n);
  const max = Math.max(1, ...aux.values);
  return (
    <group position={[0, 0, -3.2]}>
      {aux.values.map((v, i) => {
        const h = 0.05 + (v / max) * 2.5;
        const hot = i === aux.hi;
        return (
          <mesh key={i} position={[(i - (n - 1) / 2) * sp, h / 2, 0]}>
            <boxGeometry args={[sp * 0.8, h, sp * 0.8]} />
            <meshStandardMaterial
              color={hot ? palette.amber : palette.violet}
              emissive={hot ? palette.amber : palette.violet}
              emissiveIntensity={hot ? 2 : 0.2}
              toneMapped={false}
            />
          </mesh>
        );
      })}
      <Text position={[-(n * sp) / 2 - 0.3, 0.4, 0]} anchorX="right" fontSize={0.35} color={palette.mist}>
        {aux.label}
      </Text>
    </group>
  );
}

export function ArrayBars3DContent({ step }) {
  withSortedSet(step);
  const n = step?.a.length ?? 0;
  const layout = useMemo(() => arrayLayout(n), [n]);
  if (!step) return null;
  const max = step.max || Math.max(1, ...step.a);
  return (
    <group>
      {step.a.map((v, i) => (
        <Bar key={i} i={i} v={v} max={max} step={step} layout={layout} showLabel={n <= 32} />
      ))}
      <RangePlate step={step} layout={layout} />
      <Pointers step={step} layout={layout} max={max} />
      <AuxRow step={step} />
    </group>
  );
}

export default function ArrayBars3D({ step }) {
  const n = step?.a.length ?? 1;
  return (
    <Scene camera={{ position: [0, 9, 22], fov: 42 }} target={[0, 3, 0]} fitWidth={arrayLayout(n).spacing * n}>
      <ArrayBars3DContent step={step} />
    </Scene>
  );
}
