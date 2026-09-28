import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowDownToLine, Waves } from 'lucide-react';
import Scene, { palette } from '../../core/three/Scene';
import { BOX, nodeName } from './graph';
import { edgeLook, fmtDist, nodeColor, nodeState } from './visual';

const NODE_R = 0.42;
// force model: Coulomb repulsion between all nodes, Hooke springs on edges,
// a weak pull to the centre (and toward z = 0 so labels stay readable), velocity damping
const K_REPEL = 9;
const K_SPRING = 3;
const REST = 2.6;
const K_CENTER = 0.25;
const K_FLAT = 0.4;
const DAMPING = 1.8;
const GRAVITY = 14;
const CENTER_Y = 4.2;
const IDLE_EDGE = '#54547C';

const up = new THREE.Vector3(0, 1, 0);
const va = new THREE.Vector3();
const vb = new THREE.Vector3();
const dir = new THREE.Vector3();
const hit = new THREE.Vector3();
const tmp = new THREE.Color();

function initSim(graph) {
  const n = graph.n;
  const p = new Float32Array(n * 3);
  const midY = BOX.top + (BOX.h - BOX.top - BOX.bottom) / 2;
  graph.pos.forEach(([x, y], i) => {
    p[i * 3] = ((x - BOX.w / 2) / BOX.w) * 13;
    p[i * 3 + 1] = CENTER_Y + ((midY - y) / BOX.w) * 13;
    p[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
  });
  return { p, v: new Float32Array(n * 3), f: new Float32Array(n * 3), pin: -1 };
}

function simulate(sim, graph, dt, gravity) {
  const { p, v, f } = sim;
  const n = graph.n;
  f.fill(0);
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const dx = p[i * 3] - p[j * 3];
      const dy = p[i * 3 + 1] - p[j * 3 + 1];
      const dz = p[i * 3 + 2] - p[j * 3 + 2];
      const d2 = Math.max(0.04, dx * dx + dy * dy + dz * dz);
      const d = Math.sqrt(d2);
      const s = K_REPEL / d2 / d;
      f[i * 3] += dx * s;
      f[i * 3 + 1] += dy * s;
      f[i * 3 + 2] += dz * s;
      f[j * 3] -= dx * s;
      f[j * 3 + 1] -= dy * s;
      f[j * 3 + 2] -= dz * s;
    }
  for (const { u, v: w } of graph.edges) {
    const dx = p[w * 3] - p[u * 3];
    const dy = p[w * 3 + 1] - p[u * 3 + 1];
    const dz = p[w * 3 + 2] - p[u * 3 + 2];
    const d = Math.max(0.01, Math.hypot(dx, dy, dz));
    const s = (K_SPRING * (d - REST)) / d;
    f[u * 3] += dx * s;
    f[u * 3 + 1] += dy * s;
    f[u * 3 + 2] += dz * s;
    f[w * 3] -= dx * s;
    f[w * 3 + 1] -= dy * s;
    f[w * 3 + 2] -= dz * s;
  }
  const damp = Math.exp(-DAMPING * dt);
  for (let i = 0; i < n; i++) {
    const k = i * 3;
    if (i === sim.pin) {
      v[k] = v[k + 1] = v[k + 2] = 0;
      continue;
    }
    f[k] -= p[k] * K_CENTER;
    f[k + 2] -= p[k + 2] * K_FLAT;
    f[k + 1] += gravity ? -GRAVITY : (CENTER_Y - p[k + 1]) * K_CENTER;
    for (let a = 0; a < 3; a++) {
      v[k + a] = Math.max(-25, Math.min(25, (v[k + a] + f[k + a] * dt) * damp));
      p[k + a] += v[k + a] * dt;
    }
    // floor: bounce and rub
    if (p[k + 1] < NODE_R) {
      p[k + 1] = NODE_R;
      if (v[k + 1] < 0) v[k + 1] *= -0.45;
      v[k] *= 0.92;
      v[k + 2] *= 0.92;
    }
  }
}

function GraphSim({ graph, step, start, onPick, gravity, shake }) {
  const sim = useRef(null);
  if (!sim.current) sim.current = initSim(graph);
  const nodes = useRef([]);
  const mats = useRef([]);
  const edges = useRef([]);
  const edgeMats = useRef([]);
  const arrows = useRef([]);
  const arrowMats = useRef([]);
  const weights = useRef([]);
  const drag = useRef(null);
  const { camera, controls, gl } = useThree();

  const look = useMemo(
    () => ({
      nodes: Array.from({ length: graph.n }, (_, i) => {
        const s = nodeState(step, i);
        return { color: nodeColor(step, i), glow: s === 'current' ? 2.4 : s === 'idle' && (step?.group?.[i] ?? -1) < 0 ? 0.15 : 0.7 };
      }),
      edges: graph.edges.map((e) => {
        const l = edgeLook(step, e);
        return {
          color: l.color === palette.line ? IDLE_EDGE : l.color,
          r: l.hot ? 0.075 : l.s === 'tree' ? 0.06 : 0.035,
          glow: l.hot ? 2.4 : l.s === 'idle' && l.color === palette.line ? 0 : l.dim ? 0.3 : 0.8,
        };
      }),
    }),
    [step, graph],
  );

  useEffect(() => {
    if (!shake) return;
    const { v } = sim.current;
    for (let i = 0; i < v.length; i++) v[i] += (Math.random() - 0.5) * 18 + (i % 3 === 1 ? 6 : 0);
  }, [shake]);

  useFrame((_, delta) => {
    const s = sim.current;
    const dt = Math.min(delta, 1 / 30) / 2;
    simulate(s, graph, dt, gravity);
    simulate(s, graph, dt, gravity);
    const k = Math.min(1, delta * 10);
    for (let i = 0; i < graph.n; i++) {
      nodes.current[i]?.position.set(s.p[i * 3], s.p[i * 3 + 1], s.p[i * 3 + 2]);
      const m = mats.current[i];
      if (m) {
        tmp.set(look.nodes[i].color);
        m.color.lerp(tmp, k);
        m.emissive.lerp(tmp, k);
        m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, look.nodes[i].glow, k);
      }
    }
    for (const e of graph.edges) {
      va.fromArray(s.p, e.u * 3);
      vb.fromArray(s.p, e.v * 3);
      dir.subVectors(vb, va);
      const len = dir.length() || 1;
      dir.divideScalar(len);
      // trim so tubes start and end at the sphere surfaces (and leave room for the arrow)
      const a0 = NODE_R;
      const a1 = len - NODE_R - (graph.directed ? 0.36 : 0);
      const L = Math.max(0.01, a1 - a0);
      const mesh = edges.current[e.id];
      const lk = look.edges[e.id];
      if (mesh) {
        mesh.position.copy(va).addScaledVector(dir, a0 + L / 2);
        mesh.quaternion.setFromUnitVectors(up, dir);
        const r = THREE.MathUtils.lerp(mesh.scale.x, lk.r, k);
        mesh.scale.set(r, L, r);
      }
      const arrow = arrows.current[e.id];
      if (arrow) {
        arrow.position.copy(va).addScaledVector(dir, len - NODE_R - 0.18);
        arrow.quaternion.setFromUnitVectors(up, dir);
      }
      for (const m of [edgeMats.current[e.id], arrowMats.current[e.id]]) {
        if (!m) continue;
        tmp.set(lk.color);
        m.color.lerp(tmp, k);
        m.emissive.lerp(tmp, k);
        m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, lk.glow, k);
      }
      weights.current[e.id]?.position.copy(va).addScaledVector(dir, len / 2).add({ x: 0, y: 0.28, z: 0 });
    }
  });

  const release = (e) => {
    const d = drag.current;
    if (!d) return;
    e.target.releasePointerCapture?.(e.pointerId);
    if (!d.moved) onPick?.(d.i);
    drag.current = null;
    sim.current.pin = -1;
    if (controls) controls.enabled = true;
  };

  const handlers = (i) => ({
    onPointerDown: (e) => {
      e.stopPropagation();
      e.target.setPointerCapture(e.pointerId);
      const s = sim.current;
      va.fromArray(s.p, i * 3);
      const normal = camera.getWorldDirection(new THREE.Vector3()).negate();
      drag.current = { i, plane: new THREE.Plane().setFromNormalAndCoplanarPoint(normal, va.clone()), x: e.clientX, y: e.clientY, moved: false };
      s.pin = i;
      if (controls) controls.enabled = false;
      gl.domElement.style.cursor = 'grabbing';
    },
    onPointerMove: (e) => {
      const d = drag.current;
      if (!d || d.i !== i) return;
      e.stopPropagation();
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 4) d.moved = true;
      if (d.moved && e.ray.intersectPlane(d.plane, hit)) {
        hit.y = Math.max(NODE_R, hit.y);
        hit.toArray(sim.current.p, i * 3);
      }
    },
    onPointerUp: (e) => {
      release(e);
      gl.domElement.style.cursor = 'grab';
    },
    onPointerOver: () => (gl.domElement.style.cursor = 'grab'),
    onPointerOut: () => !drag.current && (gl.domElement.style.cursor = ''),
  });

  const edgeLabelColor = (e) => {
    const l = edgeLook(step, e);
    return l.hot || l.s === 'tree' ? l.color : e.w < 0 ? palette.coral : palette.mist;
  };

  return (
    <group>
      {graph.edges.map((e) => (
        <group key={e.id}>
          <mesh ref={(el) => (edges.current[e.id] = el)} scale={[0.035, 1, 0.035]}>
            <cylinderGeometry args={[1, 1, 1, 12]} />
            <meshStandardMaterial ref={(el) => (edgeMats.current[e.id] = el)} color={IDLE_EDGE} roughness={0.5} toneMapped={false} />
          </mesh>
          {graph.directed && (
            <mesh ref={(el) => (arrows.current[e.id] = el)}>
              <coneGeometry args={[0.15, 0.36, 16]} />
              <meshStandardMaterial ref={(el) => (arrowMats.current[e.id] = el)} color={IDLE_EDGE} toneMapped={false} />
            </mesh>
          )}
          <Billboard ref={(el) => (weights.current[e.id] = el)}>
            <Text fontSize={0.3} color={edgeLabelColor(e)} outlineWidth={0.03} outlineColor={palette.deep} anchorX="center" anchorY="middle">
              {String(e.w)}
            </Text>
          </Billboard>
        </group>
      ))}

      {graph.pos.map((_, i) => {
        const d = step?.dist?.[i];
        const label = step?.label?.[i];
        return (
          <group key={i} ref={(el) => (nodes.current[i] = el)}>
            <mesh castShadow {...handlers(i)}>
              <sphereGeometry args={[NODE_R, 32, 32]} />
              <meshStandardMaterial ref={(el) => (mats.current[i] = el)} color={palette.sky} roughness={0.3} metalness={0.2} toneMapped={false} />
            </mesh>
            <Billboard>
              {onPick && i === start && (
                <mesh>
                  <ringGeometry args={[NODE_R + 0.1, NODE_R + 0.17, 40]} />
                  <meshBasicMaterial color={palette.violet} toneMapped={false} />
                </mesh>
              )}
              <Text position={[0, 0, NODE_R + 0.02]} fontSize={0.36} color={palette.ink} anchorX="center" anchorY="middle">
                {nodeName(i)}
              </Text>
              {d != null && (
                <Text position={[0, NODE_R + 0.36, 0]} fontSize={0.34} color={d === Infinity ? palette.mist : palette.paper} outlineWidth={0.03} outlineColor={palette.deep} anchorX="center" anchorY="middle">
                  {fmtDist(d)}
                </Text>
              )}
              {label && (
                <Text position={[0, -NODE_R - 0.3, 0]} fontSize={0.26} color={palette.mist} outlineWidth={0.025} outlineColor={palette.deep} anchorX="center" anchorY="middle">
                  {label}
                </Text>
              )}
            </Billboard>
          </group>
        );
      })}
    </group>
  );
}

/** Live force-directed graph: nodes can be dragged, shaken, or dropped under gravity. */
export default function Graph3D({ graph, step, start, onPick }) {
  const [gravity, setGravity] = useState(false);
  const [shake, setShake] = useState(0);
  return (
    <>
      <Scene camera={{ position: [0, 6.5, 15], fov: 45 }} target={[0, 3.6, 0]}>
        <GraphSim key={graph.id} graph={graph} step={step} start={start} onPick={onPick} gravity={gravity} shake={shake} />
      </Scene>
      <div className="absolute right-3 top-3 z-10 flex gap-2">
        <StageButton onClick={() => setShake((s) => s + 1)} icon={<Waves size={14} />} label="Shake" />
        <StageButton onClick={() => setGravity((g) => !g)} icon={<ArrowDownToLine size={14} />} label="Gravity" active={gravity} />
      </div>
    </>
  );
}

export function StageButton({ onClick, icon, label, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium backdrop-blur-md transition-colors ${
        active ? 'border-mint/50 bg-mint/15 text-mint shadow-[0_0_16px_-4px_rgb(52_211_153/0.7)]' : 'border-white/10 bg-black/50 text-foreground hover:border-indigo-400/50 hover:bg-indigo-500/10'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
