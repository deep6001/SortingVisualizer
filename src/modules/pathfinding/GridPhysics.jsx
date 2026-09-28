import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { BallCollider, CuboidCollider, Physics, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { CloudRain, RotateCcw, Trash2 } from 'lucide-react';
import Scene from '../../core/three/Scene';
import { palette } from '../../core/theme';
import { WALL } from './grid.js';
import { Beacons, GridCells, PathTube, WALL_H, cellXZ, usePathCurve } from './gridParts3D';

const R = 0.32;
const SPEED = 3.2; // cells per second
const marbleColors = [palette.sky, palette.amber, palette.coral, palette.violet, palette.mint];
const q = new THREE.Quaternion();
const axis = new THREE.Vector3();

/** Merge each row's walls into horizontal runs so the maze needs far fewer colliders. */
function wallRuns(base, W, H) {
  const runs = [];
  for (let r = 0; r < H; r++) {
    let c = 0;
    while (c < W) {
      if (base[r * W + c] !== WALL) {
        c++;
        continue;
      }
      const c0 = c;
      while (c < W && base[r * W + c] === WALL) c++;
      runs.push([r, c0, c - c0]);
    }
  }
  return runs;
}

function Walls({ base, W, H }) {
  const runs = useMemo(() => wallRuns(base, W, H), [base, W, H]);
  const key = useMemo(() => runs.map((r) => r.join('.')).join(','), [runs]);
  return (
    <RigidBody key={key} type="fixed" colliders={false} friction={0.4} restitution={0.4}>
      <CuboidCollider args={[W / 2 + 2, 0.5, H / 2 + 2]} position={[0, -0.5, 0]} friction={0.9} />
      {/* invisible rim so marbles stay on the board */}
      <CuboidCollider args={[W / 2 + 1, 2, 0.5]} position={[0, 2, -H / 2 - 0.5]} />
      <CuboidCollider args={[W / 2 + 1, 2, 0.5]} position={[0, 2, H / 2 + 0.5]} />
      <CuboidCollider args={[0.5, 2, H / 2 + 1]} position={[-W / 2 - 0.5, 2, 0]} />
      <CuboidCollider args={[0.5, 2, H / 2 + 1]} position={[W / 2 + 0.5, 2, 0]} />
      {runs.map(([r, c0, len]) => (
        <CuboidCollider
          key={`${r}.${c0}`}
          args={[len / 2, WALL_H / 2, 0.5]}
          position={[c0 + len / 2 - W / 2, WALL_H / 2, r - (H - 1) / 2]}
        />
      ))}
    </RigidBody>
  );
}

/** The solver ball: kinematic, so it follows the found path exactly and shoves any marbles aside. */
function Roller({ W, H, path, run, lap, start }) {
  const body = useRef();
  const s = useRef({ d: 0, rot: new THREE.Quaternion() });
  useEffect(() => {
    s.current.d = 0;
  }, [path, run, lap]);

  useFrame((_, dt) => {
    const b = body.current;
    if (!b) return;
    const st = s.current;
    let x;
    let z;
    if (run && path.length > 1) {
      const step = Math.min(dt * SPEED, path.length - 1 - st.d);
      st.d += step;
      const k = Math.min(path.length - 2, Math.floor(st.d));
      const f = st.d - k;
      const [ax, az] = cellXZ(W, H, path[k]);
      const [bx, bz] = cellXZ(W, H, path[k + 1]);
      x = ax + (bx - ax) * f;
      z = az + (bz - az) * f;
      // roll: rotate about (up × direction) by distance / radius
      axis.set(bz - az, 0, -(bx - ax)).normalize();
      st.rot.premultiply(q.setFromAxisAngle(axis, step / R));
    } else {
      [x, z] = cellXZ(W, H, start);
    }
    b.setNextKinematicTranslation({ x, y: R + 0.02, z });
    b.setNextKinematicRotation(st.rot);
  });

  const [x0, z0] = cellXZ(W, H, start);
  return (
    <RigidBody ref={body} type="kinematicPosition" colliders={false} position={[x0, R, z0]}>
      <BallCollider args={[R]} />
      <mesh castShadow>
        <sphereGeometry args={[R, 32, 32]} />
        <meshStandardMaterial color={palette.mint} emissive={palette.mint} emissiveIntensity={1.4} roughness={0.2} toneMapped={false} />
      </mesh>
      {/* a band so the rolling is visible */}
      <mesh>
        <torusGeometry args={[R * 1.005, R * 0.12, 8, 32]} />
        <meshStandardMaterial color={palette.deep} />
      </mesh>
    </RigidBody>
  );
}

function Marble({ m }) {
  return (
    <RigidBody colliders={false} position={m.p} linearVelocity={m.v} restitution={0.55} friction={0.3} ccd>
      <BallCollider args={[0.2]} mass={0.2} />
      <mesh castShadow>
        <sphereGeometry args={[0.2, 20, 20]} />
        <meshStandardMaterial color={m.c} emissive={m.c} emissiveIntensity={0.5} roughness={0.25} metalness={0.2} />
      </mesh>
    </RigidBody>
  );
}

export default function GridPhysics({ board, base, overlay, path, pathN, finished }) {
  const { W, H } = board;
  const [marbles, setMarbles] = useState([]);
  const [lap, setLap] = useState(0);
  const curve = usePathCurve(W, H, path, pathN, 0.08);

  const drop = () => {
    const open = [];
    for (let i = 0; i < base.length; i++) if (base[i] !== WALL) open.push(i);
    const now = Date.now();
    const fresh = Array.from({ length: 14 }, (_, k) => {
      const [x, z] = cellXZ(W, H, open[Math.floor(Math.random() * open.length)]);
      return {
        id: `${now}-${k}`,
        p: [x + (Math.random() - 0.5) * 0.3, 4 + Math.random() * 5, z + (Math.random() - 0.5) * 0.3],
        v: [(Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2],
        c: marbleColors[k % marbleColors.length],
      };
    });
    setMarbles((ms) => [...ms, ...fresh].slice(-84));
  };

  return (
    <>
      <Scene camera={{ position: [0, 24, 21], fov: 42 }} target={[0, 0, 0.5]} fitWidth={W}>
        <Physics gravity={[0, -9.81, 0]} timeStep="vary">
          <Walls base={base} W={W} H={H} />
          <Roller W={W} H={H} path={path} run={finished} lap={lap} start={board.start} />
          {marbles.map((m) => (
            <Marble key={m.id} m={m} />
          ))}
        </Physics>
        <GridCells W={W} H={H} base={base} overlay={overlay} flat />
        <Beacons W={W} H={H} start={board.start} goal={board.goal} />
        <PathTube curve={curve} n={pathN} />
      </Scene>
      <div className="absolute right-3 top-3 z-10 flex flex-wrap justify-end gap-2">
        <StageButton onClick={drop} icon={<CloudRain size={14} />} label="Drop balls" />
        {marbles.length > 0 && <StageButton onClick={() => setMarbles([])} icon={<Trash2 size={14} />} label="Clear balls" />}
        {finished && <StageButton onClick={() => setLap((l) => l + 1)} icon={<RotateCcw size={14} />} label="Roll again" />}
      </div>
      {!finished && (
        <p className="pointer-events-none absolute inset-x-0 top-14 z-10 text-center text-xs text-mist">
          {path.length ? 'Play the search to the end and the ball rolls the path.' : 'No path yet. The ball waits at the start.'}
        </p>
      )}
    </>
  );
}

function StageButton({ onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-line bg-deep/70 px-2.5 text-xs text-paper backdrop-blur transition-colors hover:border-sky/60"
    >
      {icon}
      {label}
    </button>
  );
}
