import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import Scene, { palette } from '../../core/three/Scene';
import { attackLine } from './solvers';
import { queenGeometry } from './pieces';
import { cellPos, queenRole, roleColor } from './util';

/** Board tiles; the attacked line glows coral. Tiles sit just below y = 0. */
export function BoardTiles({ n, step }) {
  const hot = new Set(step?.conflict ? attackLine(n, step.at, step.conflict.kind) : []);
  return (
    <group>
      <mesh position={[0, -0.26, 0]} receiveShadow>
        <boxGeometry args={[n + 0.7, 0.3, n + 0.7]} />
        <meshStandardMaterial color="#0B0B0F" roughness={0.6} metalness={0.3} />
      </mesh>
      {Array.from({ length: n * n }, (_, i) => {
        const r = Math.floor(i / n);
        const c = i % n;
        const [x, z] = cellPos(n, r, c);
        const lit = hot.has(i) || (step?.kind === 'dead' && step.row === r);
        return (
          <mesh key={i} position={[x, -0.06, z]} receiveShadow>
            <boxGeometry args={[1, 0.12, 1]} />
            <meshStandardMaterial
              color={lit ? palette.coral : (r + c) % 2 ? '#252536' : '#4B4B6F'}
              emissive={lit ? palette.coral : '#000000'}
              emissiveIntensity={lit ? 0.8 : 0}
              roughness={0.5}
              metalness={0.15}
              toneMapped={!lit}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export function QueenMaterial({ color, glow, opacity = 1 }) {
  return (
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={glow}
      roughness={0.3}
      metalness={0.35}
      transparent={opacity < 1}
      opacity={opacity}
      toneMapped={false}
    />
  );
}

/** A placed queen: falls in from above with a small bounce. */
function DroppingQueen({ x, z, role }) {
  const ref = useRef();
  const s = useRef({ y: 3.2, vy: 0 });
  useFrame((_, dt) => {
    const m = s.current;
    const d = Math.min(dt, 1 / 30);
    m.vy -= 30 * d;
    m.y += m.vy * d;
    if (m.y < 0) {
      m.y = 0;
      m.vy = Math.abs(m.vy) > 2 ? -m.vy * 0.28 : 0;
    }
    if (ref.current) ref.current.position.y = m.y;
  });
  return (
    <mesh ref={ref} geometry={queenGeometry()} position={[x, 3.2, z]} castShadow>
      <QueenMaterial color={roleColor[role]} glow={role === 'idle' ? 0.35 : 2} />
    </mesh>
  );
}

/**
 * A queen that is not staying: 'conflict' drops toward the attacked square, stalls, then is lifted away;
 * 'lift' rises straight off a square on backtrack.
 */
export function GhostQueen({ x, z, mode }) {
  const ref = useRef();
  const mat = useRef();
  const t = useRef(0);
  const start = mode === 'lift' ? 0 : 1.6;
  useFrame((_, dt) => {
    t.current += dt;
    const s = t.current;
    if (!ref.current) return;
    let y;
    let fade = 0.9;
    if (mode === 'lift') {
      y = s * s * 9;
      fade = 0.9 - s * 1.6;
    } else if (s < 0.25) y = start - (s / 0.25) * 1.25;
    else if (s < 0.45) y = 0.35;
    else {
      y = 0.35 + (s - 0.45) ** 2 * 10;
      fade = 0.8 - (s - 0.45) * 1.8;
    }
    ref.current.position.y = y;
    if (mat.current) mat.current.opacity = Math.max(0, fade);
  });
  const color = mode === 'lift' ? palette.coral : palette.amber;
  return (
    <mesh ref={ref} geometry={queenGeometry()} position={[x, start, z]}>
      <meshStandardMaterial ref={mat} color={color} emissive={color} emissiveIntensity={1.8} transparent opacity={0.9} toneMapped={false} />
    </mesh>
  );
}

export function AttackBeam({ n, step }) {
  if (step?.kind !== 'conflict') return null;
  const [ax, az] = cellPos(n, ...step.conflict.by);
  const [bx, bz] = cellPos(n, ...step.at);
  return <Line points={[[ax, 0.55, az], [bx, 0.55, bz]]} color={palette.coral} lineWidth={3} dashed dashSize={0.2} gapSize={0.12} toneMapped={false} />;
}

export default function Queens3D({ n, step, index }) {
  if (!step) return null;
  const ghost = step.kind === 'conflict' || step.kind === 'remove' ? step.at : null;
  return (
    <Scene camera={{ position: [0, n * 0.85 + 4, n * 0.95 + 4], fov: 42 }} target={[0, 0, 0]} fitWidth={n + 2} floorY={-0.42}>
      <BoardTiles n={n} step={step} />
      {step.q.map((c, r) => {
        if (c < 0) return null;
        const [x, z] = cellPos(n, r, c);
        return <DroppingQueen key={`${r}-${c}`} x={x} z={z} role={queenRole(step, r)} />;
      })}
      {ghost && <GhostQueen key={index} x={cellPos(n, ...ghost)[0]} z={cellPos(n, ...ghost)[1]} mode={step.kind === 'remove' ? 'lift' : 'conflict'} />}
      <AttackBeam n={n} step={step} />
    </Scene>
  );
}
