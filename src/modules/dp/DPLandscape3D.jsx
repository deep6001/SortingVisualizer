import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import Scene, { palette } from '../../core/three/Scene';
import { fmt } from './algorithms';
import { heatOf } from './util';

const MAX_H = 4.5;
const tmp = new THREE.Color();
const skyDim = new THREE.Color(palette.sky).multiplyScalar(0.35);
const sky = new THREE.Color(palette.sky);

const heightOf = (v, range) => (v == null || v === Infinity ? 0.06 : 0.2 + heatOf(v, range) * MAX_H);

/** One table cell as a column; height eases toward the value, colour toward its role. */
function Column({ x, z, v, range, role, blocked, label }) {
  const group = useRef();
  const mesh = useRef();
  const mat = useRef();
  const text = useRef();
  const target = blocked ? 0.35 : heightOf(v, range);

  useFrame((_, dt) => {
    if (!mesh.current) return;
    const h = THREE.MathUtils.damp(mesh.current.scale.y, target, 10, dt);
    mesh.current.scale.y = h;
    mesh.current.position.y = h / 2;
    if (text.current) text.current.position.y = h + 0.02;
    if (role === 'cur') tmp.set(palette.amber);
    else if (role === 'dep') tmp.set(palette.violet);
    else if (role === 'path') tmp.set(palette.mint);
    else if (blocked) tmp.set(palette.line);
    else if (v == null) tmp.set('#262639');
    else tmp.copy(skyDim).lerp(sky, heatOf(v, range));
    mat.current.color.lerp(tmp, Math.min(1, dt * 14));
    mat.current.emissive.lerp(tmp, Math.min(1, dt * 14));
    const glow = role === 'cur' ? 2.4 : role === 'path' ? 1.8 : role === 'dep' ? 1.4 : v == null ? 0 : 0.12;
    mat.current.emissiveIntensity = THREE.MathUtils.damp(mat.current.emissiveIntensity, glow, 12, dt);
  });

  return (
    <group ref={group} position={[x, 0, z]}>
      <mesh ref={mesh} scale={[0.82, 0.06, 0.82]} castShadow receiveShadow>
        <boxGeometry />
        <meshStandardMaterial ref={mat} color="#262639" roughness={0.4} metalness={0.2} toneMapped={false} />
      </mesh>
      {label && v != null && !blocked && (
        <Text ref={text} rotation-x={-Math.PI / 2} fontSize={0.3} color={role === 'cur' || role === 'path' ? palette.deep : palette.paper} anchorX="center" anchorY="middle">
          {fmt(v)}
        </Text>
      )}
    </group>
  );
}

function Landscape({ result, step }) {
  const { rows, cols, rowHeads, colHeads, range, blocked } = result;
  const x = (c) => c - (cols - 1) / 2;
  const z = (r) => r - (rows - 1) / 2;
  const deps = useMemo(() => new Set((step?.deps ?? []).map((p) => p.join())), [step]);
  const path = useMemo(() => new Set((step?.path ?? []).map((p) => p.join())), [step]);
  if (!step) return null;
  const cur = step.cur?.join();
  const showLabels = rows * cols <= 220;

  const linePts = (step.path ?? []).map(([r, c]) => [x(c), heightOf(step.t[r][c], range) + 0.25, z(r)]);

  return (
    <group>
      {step.t.map((row, r) =>
        row.map((v, c) => {
          const k = `${r},${c}`;
          const role = k === cur ? 'cur' : deps.has(k) ? 'dep' : path.has(k) ? 'path' : 'idle';
          return <Column key={k} x={x(c)} z={z(r)} v={v} range={range} role={role} blocked={blocked?.has(k)} label={showLabels} />;
        }),
      )}
      {colHeads.map((h, c) => (
        <Text key={`c${c}`} position={[x(c), 0.35, z(0) - 1]} fontSize={0.36} color={step.cur?.[1] === c ? palette.amber : palette.mist}>
          {h.label}
        </Text>
      ))}
      {rowHeads.map((h, r) => (
        <Text key={`r${r}`} position={[x(0) - 0.9, 0.35, z(r)]} fontSize={0.34} anchorX="right" color={step.cur?.[0] === r ? palette.amber : palette.mist}>
          {h.label}
        </Text>
      ))}
      {linePts.length > 1 && <Line points={linePts} color={palette.mint} lineWidth={4} toneMapped={false} />}
      {linePts.length > 0 && (
        <mesh position={linePts[linePts.length - 1]}>
          <sphereGeometry args={[0.14, 20, 20]} />
          <meshStandardMaterial color={palette.mint} emissive={palette.mint} emissiveIntensity={2.5} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

/** The DP table as a landscape of columns: height is the cell value. */
export default function DPLandscape3D({ result, step }) {
  const depth = result.rows;
  return (
    <Scene camera={{ position: [0, 7 + depth * 0.5, 9 + depth * 0.9], fov: 42 }} target={[0, 1, 0]} fitWidth={result.cols + 3}>
      <Landscape result={result} step={step} />
    </Scene>
  );
}
