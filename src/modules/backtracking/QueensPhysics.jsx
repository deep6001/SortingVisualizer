import { useEffect, useRef, useState } from 'react';
import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier';
import { RotateCcw } from 'lucide-react';
import Scene, { palette } from '../../core/three/Scene';
import { queenGeometry } from './pieces';
import { AttackBeam, BoardTiles, GhostQueen, QueenMaterial } from './Queens3D';
import { cellPos, queenRole, roleColor } from './util';

const FLOOR = -5;
const MAX_FLYING = 10;
let uid = 0;

/** Queens are dynamic bodies: they drop onto the board and settle; on backtrack they get flung off the table. */
function PhysicsQueen({ n, r, c, flung, role }) {
  const body = useRef();
  const [x, z] = cellPos(n, r, c);
  const [spawnY] = useState(() => 2.4 + Math.random() * 0.6);

  useEffect(() => {
    const b = body.current;
    if (!flung || !b) return;
    b.wakeUp();
    const len = Math.hypot(x, z);
    const [dx, dz] = len < 0.3 ? [Math.random() - 0.5, 1] : [x / len, z / len];
    const m = b.mass();
    b.applyImpulse({ x: dx * 6 * m, y: 5.5 * m, z: dz * 6 * m }, true);
    b.applyTorqueImpulse({ x: (Math.random() - 0.5) * 0.05 * m, y: 0.03 * m, z: (Math.random() - 0.5) * 0.05 * m }, true);
  }, [flung, x, z]);

  const color = flung ? palette.coral : roleColor[role];
  return (
    <RigidBody ref={body} colliders="hull" position={[x, spawnY, z]} restitution={0.15} friction={0.8} angularDamping={0.4}>
      <mesh geometry={queenGeometry()} castShadow>
        <QueenMaterial color={color} glow={role === 'idle' && !flung ? 0.35 : 1.8} />
      </mesh>
    </RigidBody>
  );
}

function Table({ n }) {
  const h = n / 2 + 0.35;
  const legs = [
    [-h + 0.25, -h + 0.25],
    [h - 0.25, -h + 0.25],
    [-h + 0.25, h - 0.25],
    [h - 0.25, h - 0.25],
  ];
  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[h, 0.21, h]} position={[0, -0.21, 0]} friction={0.9} />
        <CuboidCollider args={[60, 0.5, 60]} position={[0, FLOOR - 0.5, 0]} friction={1} />
      </RigidBody>
      {legs.map(([x, z]) => (
        <mesh key={`${x},${z}`} position={[x, (FLOOR - 0.41) / 2, z]} castShadow>
          <boxGeometry args={[0.3, -FLOOR - 0.41, 0.3]} />
          <meshStandardMaterial color="#0B0B0F" roughness={0.7} />
        </mesh>
      ))}
    </>
  );
}

const placedKeys = (step) => step.q.map((c, r) => (c >= 0 ? `${r},${c}` : null)).filter(Boolean);
const makeBody = (key) => {
  const [r, c] = key.split(',').map(Number);
  return { id: ++uid, key, r, c, flung: false };
};

export default function QueensPhysics({ n, step, index }) {
  const [bodies, setBodies] = useState(() => (step ? placedKeys(step).map(makeBody) : []));

  // diff the board against the bodies in play: new queens drop in, removed ones get flung
  useEffect(() => {
    if (!step) return;
    setBodies((prev) => {
      const want = new Set(placedKeys(step));
      const next = prev.map((b) => (!b.flung && !want.has(b.key) ? { ...b, flung: true } : b));
      const live = new Set(next.filter((b) => !b.flung).map((b) => b.key));
      want.forEach((k) => !live.has(k) && next.push(makeBody(k)));
      const flying = next.filter((b) => b.flung);
      const drop = new Set(flying.slice(0, Math.max(0, flying.length - MAX_FLYING)).map((b) => b.id));
      return next.filter((b) => !drop.has(b.id));
    });
  }, [step]);

  if (!step) return null;
  const hover = step.kind === 'conflict' ? step.at : null;
  const roleByRow = (r) => queenRole(step, r);

  return (
    <>
      <Scene camera={{ position: [0, n * 0.85 + 5, n * 0.95 + 6], fov: 42 }} target={[0, -0.5, 0]} fitWidth={n + 4} floorY={FLOOR}>
        <Physics gravity={[0, -9.81, 0]} timeStep="vary">
          <Table n={n} />
          {bodies.map((b) => (
            <PhysicsQueen key={b.id} n={n} r={b.r} c={b.c} flung={b.flung} role={roleByRow(b.r)} />
          ))}
        </Physics>
        <BoardTiles n={n} step={step} />
        {hover && <GhostQueen key={index} x={cellPos(n, ...hover)[0]} z={cellPos(n, ...hover)[1]} mode="conflict" />}
        <AttackBeam n={n} step={step} />
      </Scene>
      <div className="absolute right-3 top-3 z-10">
        <button
          type="button"
          onClick={() => setBodies(placedKeys(step).map(makeBody))}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-deep/70 px-2.5 text-xs text-paper backdrop-blur transition-colors hover:border-sky/60"
        >
          <RotateCcw size={14} /> Reset pieces
        </button>
      </div>
    </>
  );
}
