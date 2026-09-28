import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Text } from '@react-three/drei';
import Scene, { palette } from '../../core/three/Scene';
import { knightBaseGeometry } from './pieces';
import { trailOf } from './solvers';

const pos = (n, i) => [(i % n) - (n - 1) / 2, Math.floor(i / n) - (n - 1) / 2];

function PieceMaterial({ color }) {
  return <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.6} roughness={0.3} metalness={0.35} toneMapped={false} />;
}

/** Lathe base plus a blocky head; hops in an arc from `from` to `to` whenever `hop` changes. */
function Knight({ n, from, to, hop, color }) {
  const ref = useRef();
  const m = useRef({ p: 1, a: pos(n, to), b: pos(n, to) });

  useEffect(() => {
    const a = from != null && from !== to ? pos(n, from) : pos(n, to);
    m.current = { p: from != null && from !== to ? 0 : 1, a, b: pos(n, to) };
  }, [hop, from, to, n]);

  useFrame((_, dt) => {
    const s = m.current;
    s.p = Math.min(1, s.p + dt * 3.2);
    const e = s.p < 0.5 ? 2 * s.p * s.p : 1 - (-2 * s.p + 2) ** 2 / 2;
    if (!ref.current) return;
    ref.current.position.set(s.a[0] + (s.b[0] - s.a[0]) * e, Math.sin(Math.PI * s.p) * 1.3, s.a[1] + (s.b[1] - s.a[1]) * e);
    ref.current.rotation.y = Math.atan2(s.b[0] - s.a[0], s.b[1] - s.a[1]) || 0;
  });

  return (
    <group ref={ref}>
      <mesh geometry={knightBaseGeometry()} castShadow>
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.5, -0.04]} rotation-x={0.25} castShadow>
        <boxGeometry args={[0.28, 0.46, 0.26]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.7, 0.1]} rotation-x={1.15} castShadow>
        <boxGeometry args={[0.24, 0.42, 0.22]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[0.07, 0.86, -0.06]} castShadow>
        <coneGeometry args={[0.05, 0.16, 8]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[-0.07, 0.86, -0.06]} castShadow>
        <coneGeometry args={[0.05, 0.16, 8]} />
        <PieceMaterial color={color} />
      </mesh>
    </group>
  );
}

export default function Knight3D({ n, step, index }) {
  if (!step) return null;
  const done = step.kind === 'done' || (step.kind === 'end' && step.order.every(Boolean));
  const cands = new Map((step.cands ?? []).map((c, k) => [c.i, { ...c, first: k === 0 }]));
  const trail = trailOf(step.order).map((i) => [pos(n, i)[0], 0.06, pos(n, i)[1]]);
  const erased = step.kind === 'back' ? step.from : null;
  const trailColor = done ? palette.mint : palette.sky;

  return (
    <Scene camera={{ position: [0, n + 3, n + 4], fov: 42 }} target={[0, 0, 0]} fitWidth={n + 2} floorY={-0.42}>
      <mesh position={[0, -0.26, 0]} receiveShadow>
        <boxGeometry args={[n + 0.7, 0.3, n + 0.7]} />
        <meshStandardMaterial color="#0B0B0F" roughness={0.6} metalness={0.3} />
      </mesh>
      {Array.from({ length: n * n }, (_, i) => {
        const [x, z] = pos(n, i);
        const cand = cands.get(i);
        const light = (Math.floor(i / n) + (i % n)) % 2 === 0;
        let color = light ? '#4B4B6F' : '#252536';
        let glow = 0;
        if (cand) [color, glow] = [palette.violet, cand.first ? 0.9 : 0.35];
        else if (i === erased) [color, glow] = [palette.coral, 0.8];
        const k = step.order[i];
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position-y={-0.06} receiveShadow>
              <boxGeometry args={[1, 0.12, 1]} />
              <meshStandardMaterial color={color} emissive={glow ? color : '#000000'} emissiveIntensity={glow} roughness={0.5} toneMapped={!glow} />
            </mesh>
            {k > 0 && i !== step.cur && (
              <Text position-y={0.02} rotation-x={-Math.PI / 2} fontSize={0.34} color={done ? palette.mint : palette.paper} anchorX="center" anchorY="middle">
                {String(k)}
              </Text>
            )}
            {cand && (
              <Text position={[0.3, 0.02, 0.3]} rotation-x={-Math.PI / 2} fontSize={0.22} color={palette.violet}>
                {String(cand.deg)}
              </Text>
            )}
          </group>
        );
      })}
      {trail.length > 1 && <Line points={trail} color={trailColor} lineWidth={2.5} transparent opacity={0.7} toneMapped={false} />}
      {step.cur != null && <Knight n={n} from={step.from} to={step.cur} hop={index} color={done ? palette.mint : palette.amber} />}
    </Scene>
  );
}
