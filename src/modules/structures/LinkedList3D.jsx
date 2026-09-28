import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';
import Scene from '../../core/three/Scene';
import { palette } from '../../core/theme';
import { roleColor } from './colors';

const PITCH = 3.3;
const BH = 1.1; // block height
const up = new THREE.Vector3(0, 1, 0);

function place(step) {
  const n = step.order.length;
  const pos = {};
  step.order.forEach((id, i) => {
    pos[id] = [(i - (n - 1) / 2) * PITCH, 0, id === step.detached ? 2.8 : 0];
  });
  return pos;
}

function Node({ v, at, role, labels }) {
  const group = useRef();
  const [start] = useState(at); // only the first position; later moves are damped in useFrame
  const color = role ? roleColor[role] : palette.sky;
  const hot = !!role;
  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    g.position.x = THREE.MathUtils.damp(g.position.x, at[0], 8, dt);
    g.position.z = THREE.MathUtils.damp(g.position.z, at[2], 8, dt);
  });
  return (
    <group ref={group} position={start}>
      <RoundedBox args={[1.6, BH, 1.2]} radius={0.08} position={[-0.4, BH / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hot ? 2 : 0.1} roughness={0.4} toneMapped={false} />
      </RoundedBox>
      <RoundedBox args={[0.75, BH, 1.2]} radius={0.08} position={[0.83, BH / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#2D2D42" roughness={0.6} />
      </RoundedBox>
      <Text position={[-0.4, BH / 2, 0.61]} fontSize={0.5} color={palette.ink} anchorX="center" anchorY="middle">
        {String(v)}
      </Text>
      <Text position={[0.83, BH / 2, 0.61]} fontSize={0.2} color={palette.mist} anchorX="center" anchorY="middle">
        next
      </Text>
      {labels.map((name, k) => (
        <Text
          key={name}
          position={[-0.4, 3.5 + k * 0.5, 0]}
          fontSize={0.42}
          color={name === 'head' ? palette.violet : name === 'fast' ? palette.coral : palette.amber}
          anchorX="center"
          anchorY="bottom"
        >
          {k === 0 ? `${name} ▼` : name}
        </Text>
      ))}
    </group>
  );
}

function Link({ from, to, hot }) {
  const { curve, tip, quat } = useMemo(() => {
    const s = new THREE.Vector3(from[0] + 0.83, BH, from[2]);
    const e = new THREE.Vector3(to[0] - 0.4, BH + 0.05, to[2]);
    const h = 1.1 + Math.abs(e.x - s.x) * 0.12 + (e.x < s.x ? 0.9 : 0);
    const c = new THREE.CubicBezierCurve3(s, s.clone().add({ x: 0, y: h, z: 0 }), e.clone().add({ x: 0, y: h, z: 0 }), e);
    const dir = c.getTangent(1).normalize();
    return { curve: c, tip: e.clone().sub(dir.clone().multiplyScalar(0.18)), quat: new THREE.Quaternion().setFromUnitVectors(up, dir) };
  }, [from, to]);
  const color = hot ? palette.coral : palette.sky;
  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 48, hot ? 0.075 : 0.05, 10, false]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hot ? 3 : 1.3} toneMapped={false} />
      </mesh>
      <mesh position={tip} quaternion={quat}>
        <coneGeometry args={[0.16, 0.36, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hot ? 3 : 1.3} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function LinkedList3D({ step }) {
  const pos = useMemo(() => (step ? place(step) : {}), [step]);
  if (!step) return null;
  const n = step.order.length;
  const byNode = {};
  const nulls = [];
  Object.entries(step.ptrs).forEach(([name, id]) => {
    if (id && pos[id]) (byNode[id] ??= []).push(name);
    else if (name !== 'node') nulls.push(name);
  });

  return (
    <>
      <Scene camera={{ position: [0, 7, 15], fov: 42 }} target={[0, 1.4, 0]} fitWidth={Math.max(4, n) * PITCH}>
        {step.order.map((id) => {
          const node = step.nodes[id];
          if (!node) return null;
          return <Node key={id} v={node.v} at={pos[id]} role={step.hl[id]} labels={byNode[id] ?? []} />;
        })}
        {step.order.map((id) => {
          const node = step.nodes[id];
          if (!node?.next || !pos[node.next]) return null;
          return <Link key={`${id}-${node.next}`} from={pos[id]} to={pos[node.next]} hot={step.edge === id} />;
        })}
        {step.order.map((id) => {
          const node = step.nodes[id];
          if (!node || node.next) return null;
          const p = pos[id];
          return (
            <Text key={`null-${id}`} position={[p[0] + 1.75, 0.35, p[2]]} fontSize={0.3} color={palette.mist} anchorX="left">
              null
            </Text>
          );
        })}
      </Scene>
      {nulls.length > 0 && (
        <p className="pointer-events-none absolute right-3 top-3 z-10 rounded bg-deep/70 px-2 py-1 font-mono text-xs text-mist">
          {nulls.map((x) => `${x} = null`).join('  ')}
        </p>
      )}
    </>
  );
}
