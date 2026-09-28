import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { BallCollider, CuboidCollider, Physics, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { Bomb, Hammer, Waves } from 'lucide-react';
import Scene, { palette } from '../three/Scene';
import { arrayLayout, sampleMotion, useSlotMotion, AuxRow, Pointers } from './ArrayBars3D';
import { roleColor, roleOf, withSortedSet } from './arrayState';

const q = new THREE.Quaternion();
const identity = new THREE.Quaternion();
const v3 = new THREE.Vector3();

/**
 * Bars as rigid bodies. While "held" they are kinematic and follow the algorithm;
 * released, they become dynamic and obey gravity, collisions and friction.
 */
function PhysicsBar({ i, v, max, step, layout, held, kick }) {
  const body = useRef();
  const mat = useRef();
  const motion = useSlotMotion(step, i, layout);
  const role = roleOf(i, step);
  const h = layout.h(v, max);
  const w = layout.width;
  const [spawn] = useState(() => ({
    position: [layout.x(i), 10 + Math.random() * 8, (Math.random() - 0.5) * 2],
    rotation: [Math.random(), Math.random(), Math.random()],
  }));

  useEffect(() => {
    if (!kick || held || !body.current) return;
    body.current.wakeUp();
    body.current.applyImpulse({ x: (Math.random() - 0.5) * 3, y: 4 + Math.random() * 6, z: (Math.random() - 0.5) * 6 }, true);
    body.current.applyTorqueImpulse({ x: Math.random() - 0.5, y: Math.random() - 0.5, z: Math.random() - 0.5 }, true);
  }, [kick, held]);

  useFrame((_, dt) => {
    const b = body.current;
    if (!b) return;
    const hot = role === 'swap' || role === 'write' || role === 'compare';
    mat.current.color.set(roleColor[role]);
    mat.current.emissive.set(roleColor[role]);
    mat.current.emissiveIntensity = hot ? 2.2 : role === 'sorted' ? 0.35 : 0.1;
    if (!held) return;
    const { x, lift, z } = sampleMotion(motion, layout.x(i), dt);
    const cur = b.translation();
    const k = 1 - Math.exp(-dt * 10);
    v3.set(cur.x, cur.y, cur.z).lerp({ x, y: h / 2 + lift, z }, k);
    b.setNextKinematicTranslation(v3);
    const r = b.rotation();
    q.set(r.x, r.y, r.z, r.w).slerp(identity, k);
    b.setNextKinematicRotation(q);
  });

  return (
    <RigidBody
      ref={body}
      type={held ? 'kinematicPosition' : 'dynamic'}
      colliders={false}
      position={spawn.position}
      rotation={spawn.rotation}
      friction={0.8}
      restitution={0.15}
    >
      <CuboidCollider args={[w / 2, h / 2, w / 2]} mass={0.2 + v / 100} />
      <mesh castShadow receiveShadow scale={[w, h, w]}>
        <boxGeometry />
        <meshStandardMaterial ref={mat} roughness={0.35} metalness={0.25} toneMapped={false} />
      </mesh>
    </RigidBody>
  );
}

function WreckingBall({ from }) {
  return (
    <RigidBody
      colliders={false}
      position={[from, 2.5, 7]}
      linearVelocity={[-from * 0.9, 1.5, -22]}
      ccd
      mass={30}
      restitution={0.3}
    >
      <BallCollider args={[1.1]} mass={40} />
      <mesh castShadow>
        <sphereGeometry args={[1.1, 48, 48]} />
        <meshStandardMaterial color="#373751" metalness={0.9} roughness={0.2} emissive={palette.coral} emissiveIntensity={0.25} />
      </mesh>
    </RigidBody>
  );
}

function Ground() {
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[60, 0.5, 60]} position={[0, -0.5, 0]} friction={1} />
    </RigidBody>
  );
}

export default function ArrayBarsPhysics({ step }) {
  withSortedSet(step);
  const n = step?.a.length ?? 0;
  const layout = useMemo(() => arrayLayout(n), [n]);
  // start released so the bars rain down, then catch them
  const [held, setHeld] = useState(false);
  const [kick, setKick] = useState(0);
  const [balls, setBalls] = useState([]);

  useEffect(() => {
    setHeld(false);
    const t = setTimeout(() => setHeld(true), 2200);
    return () => clearTimeout(t);
  }, [n]);

  if (!step) return null;
  const max = step.max || Math.max(1, ...step.a);

  const wreck = () => {
    setHeld(false);
    setBalls((b) => [...b.slice(-2), { id: Date.now(), from: (Math.random() - 0.5) * 16 }]);
  };
  const quake = () => {
    setHeld(false);
    setKick((k) => k + 1);
  };
  const rebuild = () => {
    setBalls([]);
    setHeld(true);
  };

  return (
    <>
      <Scene camera={{ position: [0, 10, 24], fov: 42 }} target={[0, 3, 0]} fitWidth={layout.spacing * n}>
        <Physics gravity={[0, -9.81, 0]} timeStep="vary">
          <Ground />
          {step.a.map((v, i) => (
            <PhysicsBar key={`${n}-${i}`} i={i} v={v} max={max} step={step} layout={layout} held={held} kick={kick} />
          ))}
          {balls.map((b) => (
            <WreckingBall key={b.id} from={b.from} />
          ))}
        </Physics>
        {held && <Pointers step={step} layout={layout} max={max} />}
        <AuxRow step={step} />
      </Scene>
      <div className="absolute right-3 top-3 z-10 flex gap-2">
        <PhysicsButton onClick={wreck} icon={<Bomb size={14} />} label="Wrecking ball" />
        <PhysicsButton onClick={quake} icon={<Waves size={14} />} label="Quake" />
        <PhysicsButton onClick={rebuild} icon={<Hammer size={14} />} label="Rebuild" active={!held} />
      </div>
    </>
  );
}

function PhysicsButton({ onClick, icon, label, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium backdrop-blur-md transition-colors ${
        active ? 'border-mint/50 bg-mint/15 text-mint shadow-[0_0_16px_-4px_rgb(52_211_153/0.7)]' : 'border-white/10 bg-black/50 text-foreground hover:border-indigo-400/50 hover:bg-indigo-500/10'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
