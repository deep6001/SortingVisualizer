import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import Scene, { palette } from '../../core/three/Scene';
import { edgeTone, toneStyle } from './tones';

const GAP = 1.6;
const up = new THREE.Vector3(0, 1, 0);
const dir = new THREE.Vector3();
const tmp = new THREE.Color();

function geometry(step) {
  const width = Math.max(1, step?.width ?? 1);
  const depth = step?.depth ?? 0;
  const slot = Math.min(1.5, 22 / width);
  const top = 1.3 + depth * GAP;
  return {
    span: width * slot,
    top,
    r: Math.min(0.45, slot * 0.4),
    at: (x, d) => [(x - (width - 1) / 2) * slot, top - d * GAP, 0],
  };
}

// 3D colour for a tone: the fill for solid tones, the outline colour for quiet ones
const toneColor = (tone) => {
  const s = toneStyle[tone] ?? toneStyle.idle;
  return s.fill === palette.panel || s.fill === palette.deep || tone === 'done' ? s.stroke : s.fill;
};

function Node3D({ n, target, r, posMap }) {
  const g = useRef();
  const mat = useRef();
  const tgt = useRef(target);
  tgt.current = target;
  const cur = useRef(null);
  const grow = useRef(0);
  const st = toneStyle[n.tone] ?? toneStyle.idle;

  useFrame((_, dt) => {
    if (!g.current) return;
    if (!cur.current) cur.current = new THREE.Vector3(...tgt.current);
    const c = cur.current;
    c.x = THREE.MathUtils.damp(c.x, tgt.current[0], 6, dt);
    c.y = THREE.MathUtils.damp(c.y, tgt.current[1], 6, dt);
    c.z = THREE.MathUtils.damp(c.z, tgt.current[2], 6, dt);
    posMap.set(n.id, c);
    grow.current = Math.min(1, grow.current + dt * 4);
    g.current.position.copy(c);
    g.current.scale.setScalar(1 - (1 - grow.current) ** 3);
    const k = Math.min(1, dt * 12);
    tmp.set(toneColor(n.tone));
    mat.current.color.lerp(tmp, k);
    mat.current.emissive.lerp(tmp, k);
    mat.current.emissiveIntensity = THREE.MathUtils.lerp(mat.current.emissiveIntensity, st.glow ? 2.2 : n.tone === 'idle' ? 0.12 : 0.5, k);
    mat.current.opacity = n.tone === 'dim' ? 0.35 : 1;
  });

  const fs = r * 0.85;
  return (
    <group ref={g} scale={0}>
      <mesh castShadow>
        <sphereGeometry args={[r, 32, 32]} />
        <meshStandardMaterial ref={mat} color={palette.sky} roughness={0.3} metalness={0.2} transparent toneMapped={false} />
      </mesh>
      <Billboard>
        {n.ring && (
          <mesh>
            <ringGeometry args={[r + 0.06, r + 0.11, 40]} />
            <meshBasicMaterial color={palette.mint} toneMapped={false} />
          </mesh>
        )}
        <Text position={[0, 0, r + 0.02]} fontSize={fs} color={palette.ink} anchorX="center" anchorY="middle">
          {n.label}
        </Text>
        {n.badge && (
          <Text position={[r + 0.12, r * 0.9, 0]} fontSize={fs * 0.7} color={n.badgeTone === 'coral' ? palette.coral : palette.mist} anchorX="left" anchorY="middle" outlineWidth={0.02} outlineColor={palette.deep}>
            {n.badge}
          </Text>
        )}
        {n.sub && (
          <Text position={[0, -r - fs * 0.55, 0]} fontSize={fs * 0.6} color={palette.mist} anchorX="center" anchorY="middle" outlineWidth={0.02} outlineColor={palette.deep}>
            {n.sub}
          </Text>
        )}
      </Billboard>
    </group>
  );
}

function Edge3D({ e, r, posMap }) {
  const mesh = useRef();
  const mat = useRef();
  useFrame((_, dt) => {
    const a = posMap.get(e.from);
    const b = posMap.get(e.to);
    const m = mesh.current;
    if (!m) return;
    m.visible = !!(a && b);
    if (!m.visible) return;
    dir.subVectors(b, a);
    const len = dir.length();
    if (len < 1e-4) return;
    dir.divideScalar(len);
    const L = Math.max(0.01, len - 2 * r);
    m.position.copy(a).addScaledVector(dir, len / 2);
    m.quaternion.setFromUnitVectors(up, dir);
    const w = e.tone === 'idle' ? 0.035 : 0.06;
    m.scale.set(w, L, w);
    tmp.set(edgeTone[e.tone] ?? edgeTone.idle);
    mat.current.color.lerp(tmp, Math.min(1, dt * 12));
    mat.current.emissive.lerp(tmp, Math.min(1, dt * 12));
    mat.current.emissiveIntensity = e.tone === 'idle' ? 0.3 : 1.6;
  });
  return (
    <mesh ref={mesh} visible={false}>
      <cylinderGeometry args={[1, 1, 1, 10]} />
      <meshStandardMaterial ref={mat} color={edgeTone.idle} toneMapped={false} />
    </mesh>
  );
}

function Ghost3D({ ghost, target, r }) {
  const g = useRef();
  const tgt = useRef(target);
  tgt.current = target;
  useFrame((_, dt) => {
    if (!g.current) return;
    const p = g.current.position;
    if (p.lengthSq() === 0) p.set(...tgt.current);
    p.x = THREE.MathUtils.damp(p.x, tgt.current[0], 7, dt);
    p.y = THREE.MathUtils.damp(p.y, tgt.current[1], 7, dt);
  });
  return (
    <group ref={g}>
      <mesh>
        <sphereGeometry args={[r * 0.75, 24, 24]} />
        <meshStandardMaterial color={palette.violet} emissive={palette.violet} emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <Billboard>
        <Text position={[0, 0, r * 0.77]} fontSize={r * 0.7} color={palette.ink} anchorX="center" anchorY="middle">
          {String(ghost.label)}
        </Text>
      </Billboard>
    </group>
  );
}

/** A removed node, handed to rapier: it drops, bounces on the floor and disappears. */
function Faller({ f, onDone }) {
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const t = setTimeout(() => done.current(), 4500);
    return () => clearTimeout(t);
  }, []);
  return (
    <RigidBody
      position={f.p}
      colliders="ball"
      restitution={0.55}
      friction={0.6}
      linearVelocity={[(Math.random() - 0.5) * 4, 2.5, 1.5 + Math.random() * 2]}
      angularVelocity={[Math.random() * 4, Math.random() * 4, Math.random() * 4]}
    >
      <mesh castShadow>
        <sphereGeometry args={[f.r, 24, 24]} />
        <meshStandardMaterial color={palette.coral} emissive={palette.coral} emissiveIntensity={1.2} toneMapped={false} />
      </mesh>
      <Text position={[0, 0, f.r + 0.02]} fontSize={f.r * 0.85} color={palette.ink} anchorX="center" anchorY="middle">
        {f.label}
      </Text>
    </RigidBody>
  );
}

function TreeContent({ step, geo }) {
  const posMap = useRef(new Map()).current;
  const prev = useRef(new Map());
  const [fallers, setFallers] = useState([]);

  // nodes that were marked for removal and are now gone get a physics body at their last position
  useEffect(() => {
    const now = new Set(step.nodes.map((n) => n.id));
    const drop = [];
    for (const [id, n] of prev.current) {
      if (now.has(id)) continue;
      const p = posMap.get(id);
      if (p && n.tone === 'remove') drop.push({ key: `${id}-${performance.now()}`, p: p.toArray(), label: n.label, r: geo.r });
      posMap.delete(id);
    }
    prev.current = new Map(step.nodes.map((n) => [n.id, n]));
    if (drop.length) setFallers((f) => [...f.slice(-8), ...drop]);
  }, [step, posMap, geo.r]);

  const ghostNode = step.ghost && step.nodes.find((n) => n.id === step.ghost.at);
  return (
    <>
      {step.edges.map((e) => (
        <Edge3D key={`${e.from}-${e.to}`} e={e} r={geo.r} posMap={posMap} />
      ))}
      {step.nodes.map((n) => (
        <Node3D key={n.id} n={n} r={geo.r} target={geo.at(n.x, n.d)} posMap={posMap} />
      ))}
      {ghostNode && (
        <Ghost3D ghost={step.ghost} r={geo.r} target={[geo.at(ghostNode.x, ghostNode.d)[0] - geo.r * 2.2, geo.at(ghostNode.x, ghostNode.d)[1] + geo.r * 1.4, 0]} />
      )}
      <Physics gravity={[0, -9.81, 0]}>
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[40, 0.5, 40]} position={[0, -0.5, 0]} />
        </RigidBody>
        {fallers.map((f) => (
          <Faller key={f.key} f={f} onDone={() => setFallers((all) => all.filter((x) => x !== f))} />
        ))}
      </Physics>
    </>
  );
}

export default function Tree3D({ step }) {
  const geo = geometry(step);
  if (!step) return null;
  return (
    <Scene camera={{ position: [0, 5, 17], fov: 42 }} target={[0, geo.top / 2 + 0.3, 0]} fitWidth={Math.max(8, geo.span)}>
      <TreeContent step={step} geo={geo} />
    </Scene>
  );
}
