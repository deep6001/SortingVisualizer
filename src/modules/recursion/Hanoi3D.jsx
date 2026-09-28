import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { CuboidCollider, CylinderCollider, Physics, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import Scene from '../../core/three/Scene';
import { palette } from '../../core/theme';
import { PEG } from './algorithms';

// rapier body types (same numbering as @react-three/rapier's rigidBodyTypeMap)
const DYNAMIC = 0;
const KINEMATIC = 2;

const DH = 0.42; // disk thickness
const BASE_TOP = 0.4;
const HOLE = 0.2;
const radius = (d) => 0.45 + d * 0.3;

function hanoiLayout(n) {
  const spacing = 2 * radius(n) + 0.9;
  return {
    spacing,
    pegX: [-spacing, 0, spacing],
    liftY: BASE_TOP + n * DH + 1.4,
    pegH: n * DH + 1,
  };
}

const diskColor = (d, n) => new THREE.Color(palette.sky).lerp(new THREE.Color(palette.violet), n > 1 ? (d - 1) / (n - 1) : 0);

/** Where each disk rests in a step: { [disk]: [x, y, z] } */
function targets(step, layout) {
  const out = {};
  step.pegs.forEach((peg, p) =>
    peg.forEach((d, k) => {
      out[d] = [layout.pegX[p], BASE_TOP + k * DH + DH / 2, 0];
    }),
  );
  return out;
}

/** Lift straight up, hop across in a shallow arc, lower straight down. s in 0..1. */
function arcPoint(from, to, liftY, s, out) {
  const up = Math.max(0, liftY - from.y);
  const across = Math.abs(to.x - from.x);
  const down = Math.max(0, liftY - to.y);
  const total = up + across + down || 1;
  const e = s < 0.5 ? 4 * s * s * s : 1 - (-2 * s + 2) ** 3 / 2;
  const u = e * total;
  if (u <= up) return out.set(from.x, from.y + u, 0);
  if (u <= up + across) {
    const k = across ? (u - up) / across : 1;
    return out.set(THREE.MathUtils.lerp(from.x, to.x, k), liftY + Math.sin(Math.PI * k) * 0.6, 0);
  }
  return out.set(to.x, liftY - (u - up - across), 0);
}

function useDiskGeometry(d) {
  return useMemo(() => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, radius(d), 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, HOLE, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const bevel = 0.05;
    const g = new THREE.ExtrudeGeometry(shape, { depth: DH - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 48 });
    g.rotateX(-Math.PI / 2);
    g.translate(0, -(DH - 2 * bevel) / 2, 0);
    return g;
  }, [d]);
}

const pv = new THREE.Vector3();
const AMBER = new THREE.Color(palette.amber);
const MINT = new THREE.Color(palette.mint);
const qv = new THREE.Quaternion();
const identity = new THREE.Quaternion();

function Disk({ d, n, target, moving, index, layout, dur, physics, done }) {
  const group = useRef();
  const body = useRef();
  const mat = useRef();
  const geometry = useDiskGeometry(d);
  const [spawn] = useState(target);
  const last = useRef(target);
  const anim = useRef(null);
  const base = useMemo(() => diskColor(d, n), [d, n]);

  const current = () => {
    if (physics) {
      const t = body.current?.translation();
      return t ? new THREE.Vector3(t.x, t.y, t.z) : new THREE.Vector3(...last.current);
    }
    return group.current ? group.current.position.clone() : new THREE.Vector3(...last.current);
  };

  useEffect(() => {
    const prev = last.current;
    last.current = target;
    const changed = prev[0] !== target[0] || prev[1] !== target[1];
    if (moving) {
      anim.current = { from: current(), to: new THREE.Vector3(...target), s: 0 };
      if (physics) body.current?.setBodyType(KINEMATIC, true);
      return;
    }
    if (!changed) return;
    // jumped by scrubbing: teleport instead of animating
    anim.current = null;
    if (physics && body.current) {
      const b = body.current;
      b.setBodyType(DYNAMIC, true);
      b.setTranslation({ x: target[0], y: target[1], z: target[2] }, true);
      b.setRotation(identity, true);
      b.setLinvel({ x: 0, y: 0, z: 0 }, true);
      b.setAngvel({ x: 0, y: 0, z: 0 }, true);
    } else if (group.current) {
      group.current.position.set(...target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target[0], target[1], index]);

  useFrame((_, dt) => {
    const a = anim.current;
    const hot = !!a || moving;
    if (mat.current) {
      mat.current.color.copy(done ? MINT : hot ? AMBER : base);
      mat.current.emissive.copy(mat.current.color);
      mat.current.emissiveIntensity = THREE.MathUtils.damp(mat.current.emissiveIntensity, hot ? 2 : done ? 0.5 : 0.12, 10, dt);
    }
    if (!a) return;
    a.s = Math.min(1, a.s + dt / dur);
    arcPoint(a.from, a.to, layout.liftY, a.s, pv);
    if (physics) {
      const b = body.current;
      if (!b) return;
      // let go just above the landing spot so gravity drops it the last bit
      const release = a.s > 0.5 && pv.x === a.to.x && pv.y - a.to.y < 0.3;
      if (release || a.s >= 1) {
        anim.current = null;
        b.setBodyType(DYNAMIC, true);
        b.setLinvel({ x: 0, y: -1, z: 0 }, true);
        b.setAngvel({ x: 0, y: 0, z: 0 }, true);
        return;
      }
      b.setNextKinematicTranslation(pv);
      const r = b.rotation();
      b.setNextKinematicRotation(qv.set(r.x, r.y, r.z, r.w).slerp(identity, Math.min(1, dt * 12)));
    } else if (group.current) {
      group.current.position.copy(pv);
      if (a.s >= 1) anim.current = null;
    }
  });

  const mesh = (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial ref={mat} color={base} roughness={0.35} metalness={0.2} toneMapped={false} />
    </mesh>
  );

  if (!physics) {
    return (
      <group ref={group} position={spawn}>
        {mesh}
      </group>
    );
  }
  return (
    <RigidBody ref={body} colliders={false} position={spawn} friction={1} restitution={0} angularDamping={2} linearDamping={0.2}>
      <CylinderCollider args={[DH / 2, radius(d)]} />
      {mesh}
    </RigidBody>
  );
}

function Stand({ n, layout, physics, active }) {
  const width = layout.spacing * 3;
  const depth = 2 * radius(n) + 0.6;
  return (
    <>
      {physics && (
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[width / 2, BASE_TOP / 2, depth / 2]} position={[0, BASE_TOP / 2, 0]} friction={1} />
          <CuboidCollider args={[40, 0.5, 40]} position={[0, -0.5, 0]} />
        </RigidBody>
      )}
      <mesh position={[0, BASE_TOP / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[width, BASE_TOP, depth]} />
        <meshStandardMaterial color="#262638" roughness={0.7} />
      </mesh>
      {layout.pegX.map((x, p) => (
        <group key={p}>
          {/* pegs are visual only: disks never collide with them */}
          <mesh position={[x, BASE_TOP + layout.pegH / 2, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, layout.pegH, 16]} />
            <meshStandardMaterial
              color={active.includes(p) ? palette.amber : palette.mist}
              emissive={active.includes(p) ? palette.amber : '#000000'}
              emissiveIntensity={active.includes(p) ? 0.8 : 0}
              metalness={0.6}
              roughness={0.3}
              toneMapped={false}
            />
          </mesh>
          <Text position={[x, 0.2, depth / 2 + 0.02]} fontSize={0.34} color={palette.paper} anchorX="center" anchorY="middle">
            {PEG[p]}
          </Text>
        </group>
      ))}
    </>
  );
}

export default function Hanoi3D({ step, index, speed, physics, n }) {
  const layout = useMemo(() => hanoiLayout(n), [n]);
  const tg = useMemo(() => (step ? targets(step, layout) : {}), [step, layout]);
  const dur = Math.min(0.9, Math.max(0.16, 2.2 / speed));
  const done = step?.pegs[2].length === n;
  const top = step?.stack[step.stack.length - 1];
  const active = top ? [top.from, top.to] : [];

  const disks = Array.from({ length: n }, (_, i) => i + 1).map((d) => (
    <Disk
      key={d}
      d={d}
      n={n}
      target={tg[d]}
      moving={step?.move?.disk === d}
      index={index}
      layout={layout}
      dur={dur}
      physics={physics}
      done={done}
    />
  ));

  return (
    <Scene camera={{ position: [0, 7, 14], fov: 45 }} target={[0, 1.6, 0]} fitWidth={layout.spacing * 3 + 1}>
      {physics ? (
        <Physics gravity={[0, -9.81, 0]} timeStep="vary">
          <Stand n={n} layout={layout} physics active={active} />
          {disks}
        </Physics>
      ) : (
        <>
          <Stand n={n} layout={layout} active={active} />
          {disks}
        </>
      )}
    </Scene>
  );
}
