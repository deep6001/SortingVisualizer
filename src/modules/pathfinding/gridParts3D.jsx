import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { palette } from '../../core/theme';
import { CLOSED, OPEN, PATH, WALL, WEIGHT } from './grid.js';

export const WALL_H = 1.1;

/** World x / z of cell i, with the grid centred on the origin and 1 unit per cell. */
export const cellXZ = (W, H, i) => [(i % W) - (W - 1) / 2, Math.floor(i / W) - (H - 1) / 2];

const hdr = (hex, k) => new THREE.Color(hex).multiplyScalar(k);

const tileColor = {
  empty: new THREE.Color('#252537'),
  weight: new THREE.Color('#40405F'),
  [OPEN]: hdr(palette.amber, 2.2),
  [CLOSED]: new THREE.Color('#56567F'),
  [PATH]: hdr(palette.mint, 1.5),
  cur: hdr(palette.paper, 2.5),
  curMaze: hdr(palette.coral, 2.5),
};

function tileHeight(kind, o, isCur) {
  let h = kind === WEIGHT ? 0.42 : 0.08;
  if (o === CLOSED) h += 0.14;
  if (o === OPEN) h += 0.24;
  if (o === PATH) h += 0.26;
  if (isCur) h += 0.35;
  return h;
}

const tmp = new THREE.Object3D();
const col = new THREE.Color();

/**
 * Every cell as two instanced meshes: a floor tile that rises and lights up with its
 * search state, and a wall block that grows or sinks as walls are drawn or carved.
 */
export function GridCells({ W, H, base, overlay, cur = -1, maze = false, flat = false }) {
  const n = W * H;
  const tiles = useRef();
  const walls = useRef();
  const hTile = useMemo(() => new Float32Array(n), [n]);
  const hWall = useMemo(() => new Float32Array(n), [n]);
  const settled = useRef(false);

  useLayoutEffect(() => {
    const m = tiles.current;
    for (let i = 0; i < n; i++) {
      const o = overlay[i];
      if (i === cur) col.copy(maze ? tileColor.curMaze : tileColor.cur);
      else if (o) col.copy(tileColor[o]);
      else col.copy(base[i] === WEIGHT ? tileColor.weight : tileColor.empty);
      m.setColorAt(i, col);
    }
    m.instanceColor.needsUpdate = true;
    settled.current = false;
  }, [base, overlay, cur, maze, n, flat]);

  // ease every block toward its target height; stop touching matrices once all have settled
  useFrame((_, dt) => {
    if (settled.current) return;
    const k = 1 - Math.exp(-dt * 12);
    let worst = 0;
    for (let i = 0; i < n; i++) {
      const [x, z] = cellXZ(W, H, i);
      const tt = flat ? 0.06 : tileHeight(base[i], overlay[i], i === cur);
      const tw = base[i] === WALL ? WALL_H : 0;
      hTile[i] += (tt - hTile[i]) * k;
      hWall[i] += (tw - hWall[i]) * k;
      worst = Math.max(worst, Math.abs(tt - hTile[i]), Math.abs(tw - hWall[i]));
      tmp.position.set(x, hTile[i] / 2, z);
      tmp.scale.set(0.9, Math.max(0.001, hTile[i]), 0.9);
      tmp.updateMatrix();
      tiles.current.setMatrixAt(i, tmp.matrix);
      const h = Math.max(0.0001, hWall[i]);
      tmp.position.set(x, h / 2, z);
      tmp.scale.set(h < 0.01 ? 0.0001 : 1, h, h < 0.01 ? 0.0001 : 1);
      tmp.updateMatrix();
      walls.current.setMatrixAt(i, tmp.matrix);
    }
    tiles.current.instanceMatrix.needsUpdate = true;
    walls.current.instanceMatrix.needsUpdate = true;
    if (worst < 0.002) settled.current = true;
  });

  return (
    <group>
      <instancedMesh key={`t${n}`} ref={tiles} args={[undefined, undefined, n]} frustumCulled={false} receiveShadow>
        <boxGeometry />
        <meshStandardMaterial roughness={0.55} metalness={0.1} toneMapped={false} />
      </instancedMesh>
      <instancedMesh key={`w${n}`} ref={walls} args={[undefined, undefined, n]} frustumCulled={false} castShadow receiveShadow>
        <boxGeometry />
        <meshStandardMaterial color="#4E4E72" roughness={0.5} metalness={0.15} />
      </instancedMesh>
    </group>
  );
}

/** Glowing start (violet) and goal (mint) beacons. */
export function Beacons({ W, H, start, goal }) {
  return [
    [start, palette.violet],
    [goal, palette.mint],
  ].map(([i, c], k) => {
    const [x, z] = cellXZ(W, H, i);
    return (
      <group key={k} position={[x, 0, z]}>
        <mesh position-y={0.6}>
          <cylinderGeometry args={[0.3, 0.36, 1.2, 24]} />
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={2} toneMapped={false} />
        </mesh>
        <mesh position-y={0.04} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.42, 0.5, 32]} />
          <meshBasicMaterial color={hdr(c, 2)} toneMapped={false} />
        </mesh>
      </group>
    );
  });
}

/** Smooth curve through the first `n` cells of the path, or null. */
export function usePathCurve(W, H, path, n, y = 0.62) {
  return useMemo(() => {
    if (n < 2) return null;
    const pts = path.slice(0, n).map((i) => {
      const [x, z] = cellXZ(W, H, i);
      return new THREE.Vector3(x, y, z);
    });
    return new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  }, [W, H, path, n, y]);
}

export function PathTube({ curve, n }) {
  const geo = useMemo(() => curve && new THREE.TubeGeometry(curve, Math.min(1200, n * 8), 0.1, 8, false), [curve, n]);
  useEffect(() => () => geo?.dispose(), [geo]);
  if (!geo) return null;
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial color={hdr(palette.mint, 2.4)} toneMapped={false} />
    </mesh>
  );
}

/** A small bright sphere that loops along the finished path. */
export function Runner({ curve }) {
  const ref = useRef();
  const u = useRef(0);
  useEffect(() => {
    u.current = 0;
  }, [curve]);
  useFrame((_, dt) => {
    if (!curve || !ref.current) return;
    const len = curve.getLength();
    u.current = (u.current + (dt * 6) / Math.max(1, len)) % 1.15; // brief rest at the goal
    ref.current.position.copy(curve.getPointAt(Math.min(1, u.current)));
    ref.current.position.y += 0.12;
  });
  if (!curve) return null;
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.24, 24, 24]} />
      <meshStandardMaterial color={palette.paper} emissive={palette.mint} emissiveIntensity={3} toneMapped={false} />
    </mesh>
  );
}
