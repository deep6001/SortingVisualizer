import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { Hammer, Wind } from 'lucide-react';
import Scene from '../../core/three/Scene';
import { palette } from '../../core/theme';
import { roleColor } from './colors';
import { StageButton } from './ui';

// rapier body types (same numbering as @react-three/rapier's rigidBodyTypeMap)
const DYNAMIC = 0;
const KINEMATIC = 2;

const DIMS = {
  stack: { w: 1.9, h: 0.72, d: 1.4 },
  queue: { w: 1.1, h: 1.1, d: 1.2 },
};
const BASE_Y = 0.24; // top of the stack platform
const BELT = { y: 1.8, len: 15, spacing: 1.38 };
const slotX = (i) => -BELT.len / 2 + 0.9 + i * BELT.spacing;
const LEAVE_MS = 2600;
const NONE = [];

const tmpV = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();
const identity = new THREE.Quaternion();

function homeOf(mode, slot, dims) {
  return mode === 'stack'
    ? [0, BASE_Y + dims.h / 2 + slot * (dims.h + 0.004), 0]
    : [slotX(slot), BELT.y + dims.h / 2, 0];
}

function Crate({ entry, slot, role, mode, dims, topple, restack, isTop }) {
  const body = useRef();
  const anim = useRef(null);
  const [spawn] = useState(() =>
    mode === 'stack'
      ? [(Math.random() - 0.5) * 0.05, entry.spawnY, (Math.random() - 0.5) * 0.05]
      : [slotX(Math.max(0, slot)), BELT.y + 3.4, 0],
  );

  // eject when the item leaves the structure
  useEffect(() => {
    const b = body.current;
    if (!entry.leaving || !b) return;
    anim.current = null;
    b.setBodyType(DYNAMIC, true);
    if (mode === 'stack') {
      const side = Math.random() < 0.5 ? -1 : 1;
      const m = b.mass();
      b.applyImpulse({ x: side * 5.5 * m, y: 7.5 * m, z: (Math.random() - 0.3) * 3 * m }, true);
      b.applyTorqueImpulse({ x: (Math.random() - 0.5) * m, y: side * 0.6 * m, z: -side * 1.4 * m }, true);
    }
  }, [entry.leaving, mode]);

  // knock the pile over: higher crates get a bigger shove
  useEffect(() => {
    const b = body.current;
    if (!topple || !b || entry.leaving) return;
    anim.current = null;
    b.setBodyType(DYNAMIC, true);
    const m = b.mass();
    const y = b.translation().y;
    b.applyImpulse({ x: (0.8 + y * 0.45) * m, y: 0.4 * m, z: (Math.random() - 0.5) * 0.8 * m }, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topple]);

  // fly back to the home slot, bottom crates first, then hand control back to physics
  useEffect(() => {
    const b = body.current;
    if (!restack || !b || entry.leaving || slot < 0) return;
    const p = b.translation();
    const r = b.rotation();
    anim.current = { t: -slot * 0.07, from: new THREE.Vector3(p.x, p.y, p.z), fromQ: new THREE.Quaternion(r.x, r.y, r.z, r.w) };
    b.setBodyType(KINEMATIC, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restack]);

  useFrame((_, dt) => {
    const b = body.current;
    if (!b) return;
    const a = anim.current;
    if (a) {
      a.t += dt * 1.5;
      const e = THREE.MathUtils.smoothstep(Math.max(0, Math.min(1, a.t)), 0, 1);
      const [hx, hy, hz] = homeOf(mode, slot, dims);
      tmpV.set(hx, hy, hz).sub(a.from).multiplyScalar(e).add(a.from);
      tmpV.y += Math.sin(Math.PI * e) * 1.6;
      b.setNextKinematicTranslation(tmpV);
      b.setNextKinematicRotation(tmpQ.copy(a.fromQ).slerp(identity, e));
      if (a.t >= 1) {
        anim.current = null;
        b.setBodyType(DYNAMIC, true);
        b.setLinvel({ x: 0, y: 0, z: 0 }, true);
        b.setAngvel({ x: 0, y: 0, z: 0 }, true);
      }
      return;
    }
    if (mode !== 'queue') return;
    // conveyor: crates resting on the belt are carried toward their slot
    const p = b.translation();
    const v = b.linvel();
    const onBelt = p.y > BELT.y && p.y < BELT.y + dims.h + 0.35 && p.x > -BELT.len / 2 - 0.2;
    if (!onBelt) return;
    if (entry.leaving) {
      b.setLinvel({ x: -3.2, y: v.y, z: v.z }, true);
    } else if (slot >= 0) {
      const vx = THREE.MathUtils.clamp((slotX(slot) - p.x) * 3, -3.5, 3.5);
      b.setLinvel({ x: vx, y: v.y, z: -p.z * 2 }, true);
    }
  });

  const r = entry.leaving ? 'out' : role;
  const color = roleColor[r ?? 'idle'];
  const hot = r && r !== 'idle';
  const label = String(entry.v);
  const font = Math.min(mode === 'stack' ? 0.36 : 0.42, (dims.w * 1.6) / Math.max(3, label.length));

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={spawn}
      friction={0.9}
      restitution={0.05}
      linearDamping={0.05}
      angularDamping={0.3}
    >
      <CuboidCollider args={[dims.w / 2, dims.h / 2, dims.d / 2]} />
      <RoundedBox args={[dims.w, dims.h, dims.d]} radius={0.06} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hot ? 1.6 : 0.08}
          roughness={0.45}
          metalness={0.1}
          toneMapped={false}
        />
      </RoundedBox>
      <Text
        position={[0, entry.sub ? dims.h * 0.14 : 0, dims.d / 2 + 0.01]}
        fontSize={font}
        color={palette.ink}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
      {entry.sub && (
        <Text position={[0, -dims.h * 0.24, dims.d / 2 + 0.01]} fontSize={font * 0.72} color={palette.ink} anchorX="center" anchorY="middle">
          {entry.sub}
        </Text>
      )}
      {isTop && (
        <Text position={[dims.w / 2 + 0.25, 0, 0]} fontSize={0.3} color={palette.violet} anchorX="left" anchorY="middle">
          ← top
        </Text>
      )}
    </RigidBody>
  );
}

function StackBase({ capacity, dims, gauge }) {
  const capY = BASE_Y + capacity * dims.h;
  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[1.4, BASE_Y / 2, 1.1]} position={[0, BASE_Y / 2, 0]} friction={1} />
      </RigidBody>
      <mesh position={[0, BASE_Y / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[2.8, BASE_Y, 2.2]} />
        <meshStandardMaterial color={palette.line} roughness={0.8} />
      </mesh>
      {/* capacity gauge behind the pile */}
      {gauge && (
        <>
          <mesh position={[-1.6, capY / 2, -0.9]}>
            <boxGeometry args={[0.05, capY, 0.05]} />
            <meshStandardMaterial color={palette.line} />
          </mesh>
          <mesh position={[-1.2, capY, -0.9]}>
            <boxGeometry args={[0.8, 0.03, 0.03]} />
            <meshBasicMaterial color={palette.coral} />
          </mesh>
          <Text position={[-1.75, capY, -0.9]} fontSize={0.28} color={palette.coral} anchorX="right" anchorY="middle">
            capacity {capacity}
          </Text>
        </>
      )}
    </>
  );
}

function Belt() {
  const stripes = useRef();
  const rollers = useRef();
  useFrame((_, dt) => {
    if (stripes.current) stripes.current.position.x = ((stripes.current.position.x - dt * 1.4) % 1 + 1) % 1 - 1;
    rollers.current?.children.forEach((r) => (r.rotation.y -= dt * 4));
  });
  const n = Math.floor(BELT.len);
  return (
    <group>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[BELT.len / 2, 0.15, 0.95]} position={[0, BELT.y - 0.15, 0]} friction={1.2} />
      </RigidBody>
      <mesh position={[0, BELT.y - 0.16, 0]} receiveShadow castShadow>
        <boxGeometry args={[BELT.len, 0.3, 1.9]} />
        <meshStandardMaterial color="#262638" roughness={0.9} />
      </mesh>
      <group ref={stripes}>
        {Array.from({ length: n }, (_, i) => (
          <mesh key={i} position={[-BELT.len / 2 + 1 + i, BELT.y + 0.002, 0]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[0.08, 1.8]} />
            <meshBasicMaterial color={palette.line} />
          </mesh>
        ))}
      </group>
      <group ref={rollers}>
        {[-BELT.len / 2, BELT.len / 2].map((x) => (
          <mesh key={x} position={[x, BELT.y - 0.16, 0]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.2, 0.2, 2, 16]} />
            <meshStandardMaterial color={palette.mist} metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
      </group>
      {[-BELT.len / 2 + 0.6, BELT.len / 2 - 0.6].flatMap((x) =>
        [-0.8, 0.8].map((z) => (
          <mesh key={`${x}${z}`} position={[x, (BELT.y - 0.3) / 2, z]} castShadow>
            <boxGeometry args={[0.15, BELT.y - 0.3, 0.15]} />
            <meshStandardMaterial color={palette.line} />
          </mesh>
        )),
      )}
      <Text position={[-BELT.len / 2 + 0.2, BELT.y + 2.4, 0]} fontSize={0.4} color={palette.violet} anchorX="left">
        ← front (dequeue)
      </Text>
      <Text position={[BELT.len / 2 - 0.2, BELT.y + 2.4, 0]} fontSize={0.4} color={palette.mist} anchorX="right">
        back (enqueue)
      </Text>
    </group>
  );
}

/**
 * Items as crates in a rapier world. Items that appear drop in from above;
 * items that disappear are ejected and removed a moment later.
 * mode 'stack' piles them on a platform, 'queue' carries them along a conveyor.
 */
export default function CratePhysics({ step, mode = 'stack', capacity = 20, gauge = true }) {
  const items = step?.items ?? NONE;
  const dims = DIMS[mode];
  const [bodies, setBodies] = useState([]);
  const gen = useRef(0);
  const [topple, setTopple] = useState(0);
  const [restack, setRestack] = useState(0);
  const [toppled, setToppled] = useState(false);

  useEffect(() => {
    setBodies((prev) => {
      const ids = new Set(items.map((i) => i.id));
      const now = performance.now();
      let changed = false;
      const next = prev.map((b) => {
        if (b.leaving || ids.has(b.id)) return b;
        changed = true;
        return { ...b, leaving: now };
      });
      const live = new Map(next.filter((b) => !b.leaving).map((b) => [b.id, b]));
      let count = live.size;
      items.forEach((it) => {
        const ex = live.get(it.id);
        if (!ex) {
          changed = true;
          next.push({ key: `${it.id}:${gen.current++}`, id: it.id, v: it.v, sub: it.sub, spawnY: BASE_Y + count++ * dims.h + 2.4 });
        } else if (ex.v !== it.v || ex.sub !== it.sub) {
          changed = true;
          next[next.indexOf(ex)] = { ...ex, v: it.v, sub: it.sub };
        }
      });
      return changed ? next : prev;
    });
  }, [items, dims.h]);

  useEffect(() => {
    const t = setInterval(() => {
      setBodies((prev) => {
        const now = performance.now();
        const next = prev.filter((b) => !b.leaving || now - b.leaving < LEAVE_MS);
        return next.length === prev.length ? prev : next;
      });
    }, 400);
    return () => clearInterval(t);
  }, []);

  const slots = useMemo(() => new Map(items.map((it, i) => [it.id, i])), [items]);
  const topId = mode === 'stack' ? items[items.length - 1]?.id : null;

  const camera =
    mode === 'stack' ? { position: [7, 9, 18], fov: 45 } : { position: [0, 8, 17], fov: 45 };
  const target = mode === 'stack' ? [0, 5, 0] : [0, 2, 0];

  return (
    <>
      <Scene camera={camera} target={target}>
        <Physics gravity={[0, -9.81, 0]} timeStep="vary">
          <RigidBody type="fixed" colliders={false}>
            <CuboidCollider args={[60, 0.5, 60]} position={[0, -0.5, 0]} friction={1} />
          </RigidBody>
          {mode === 'stack' ? <StackBase capacity={capacity} dims={dims} gauge={gauge} /> : <Belt />}
          {bodies.map((b) => (
            <Crate
              key={b.key}
              entry={b}
              slot={b.leaving ? -1 : slots.get(b.id) ?? -1}
              role={step?.hl?.[b.id]}
              mode={mode}
              dims={dims}
              topple={topple}
              restack={restack}
              isTop={!b.leaving && b.id === topId && !toppled}
            />
          ))}
        </Physics>
      </Scene>
      {mode === 'stack' && (
        <div className="absolute right-3 top-3 z-10 flex gap-2">
          <StageButton
            onClick={() => {
              setToppled(true);
              setTopple((t) => t + 1);
            }}
            icon={<Wind size={14} />}
            label="Topple"
          />
          <StageButton
            onClick={() => {
              setToppled(false);
              setRestack((t) => t + 1);
            }}
            icon={<Hammer size={14} />}
            label="Restack"
            active={toppled}
          />
        </div>
      )}
    </>
  );
}
