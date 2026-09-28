import { AnimatePresence, motion } from 'motion/react';
import { palette } from '../../core/theme';
import { roleColor } from './colors';

const NW = 100; // node width: value cell 60 + next cell 40
const VW = 60;
const NH = 46;
const GAP = 56;
const PITCH = NW + GAP;
const ROW_Y = 130;
const DETACHED_Y = ROW_Y + 115;
const H = 340;
const spring = { type: 'spring', stiffness: 260, damping: 28 };

/** Node positions for a step: the row follows step.order, the detached node drops below. */
function layoutList(step) {
  const n = step.order.length;
  const W = 80 + Math.max(n, 6) * PITCH;
  const x0 = (W - (n * PITCH - GAP)) / 2;
  const pos = {};
  step.order.forEach((id, i) => {
    pos[id] = { x: x0 + i * PITCH, y: id === step.detached ? DETACHED_Y : ROW_Y };
  });
  return { pos, W };
}

function arrowPath(a, b) {
  const sx = a.x + VW + (NW - VW) / 2;
  const sy = a.y + NH / 2;
  const bx = b.x + VW / 2;
  if (b.y === a.y && b.x > a.x && b.x - a.x <= PITCH + 1) {
    return `M${sx} ${sy} C${sx + 20} ${sy} ${b.x - 20} ${sy} ${b.x - 3} ${sy}`;
  }
  if (b.y < a.y) return `M${sx} ${a.y} C${sx} ${a.y - 45} ${bx} ${b.y + NH + 45} ${bx} ${b.y + NH + 3}`;
  if (b.y > a.y) return `M${sx} ${a.y + NH} C${sx} ${a.y + NH + 45} ${bx} ${b.y - 45} ${bx} ${b.y - 3}`;
  // same row, skipping ahead or pointing back: loop underneath
  return `M${sx} ${a.y + NH} C${sx} ${a.y + NH + 70} ${bx} ${b.y + NH + 70} ${bx} ${b.y + NH + 3}`;
}

const ptrColor = (name) => (name === 'head' ? palette.violet : name === 'fast' ? palette.coral : palette.amber);

export default function LinkedList2D({ step }) {
  if (!step) return null;
  const { pos, W } = layoutList(step);
  const byNode = {};
  const nulls = [];
  Object.entries(step.ptrs).forEach(([name, id]) => {
    if (id && pos[id]) (byNode[id] ??= []).push(name);
    else if (name !== 'node') nulls.push(name);
  });

  return (
    <div className="absolute inset-0 px-3 pb-5 pt-12">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          {[
            ['idle', palette.mist],
            ['hot', palette.coral],
          ].map(([k, c]) => (
            <marker key={k} id={`ll-arrow-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" fill={c} />
            </marker>
          ))}
        </defs>

        {nulls.length > 0 && (
          <text x={16} y={28} fontSize={14} fill={palette.mist} className="font-mono">
            {nulls.map((n) => `${n} = null`).join('   ')}
          </text>
        )}

        {/* next pointers */}
        {step.order.map((id) => {
          const node = step.nodes[id];
          const a = pos[id];
          if (!node || !node.next || !pos[node.next]) return null;
          const hot = step.edge === id;
          return (
            <motion.path
              key={`e-${id}`}
              initial={false}
              animate={{ d: arrowPath(a, pos[node.next]) }}
              transition={spring}
              fill="none"
              stroke={hot ? palette.coral : palette.mist}
              strokeWidth={hot ? 3 : 1.8}
              markerEnd={`url(#ll-arrow-${hot ? 'hot' : 'idle'})`}
              style={hot ? { filter: `drop-shadow(0 0 5px ${palette.coral})` } : undefined}
            />
          );
        })}

        <AnimatePresence>
          {step.order.map((id) => {
            const node = step.nodes[id];
            if (!node) return null;
            const p = pos[id];
            const role = step.hl[id];
            const c = role ? roleColor[role] : palette.sky;
            const labels = byNode[id] ?? [];
            return (
              <motion.g
                key={id}
                initial={{ opacity: 0, x: p.x, y: p.y + 60 }}
                animate={{ opacity: 1, x: p.x, y: p.y }}
                exit={{ opacity: 0, y: p.y + 70 }}
                transition={spring}
              >
                <rect width={NW} height={NH} rx={6} fill={role ? `${c}2a` : palette.panel} stroke={c} strokeWidth={role ? 2.5 : 1.5} />
                <line x1={VW} y1={0} x2={VW} y2={NH} stroke={c} strokeWidth={1.5} />
                <text x={VW / 2} y={NH / 2 + 1} textAnchor="middle" dominantBaseline="middle" fontSize={17} fill={palette.paper} className="font-mono">
                  {node.v}
                </text>
                {node.next ? (
                  <circle cx={VW + (NW - VW) / 2} cy={NH / 2} r={4} fill={step.edge === id ? palette.coral : palette.mist} />
                ) : (
                  <line x1={VW + 6} y1={NH - 6} x2={NW - 6} y2={6} stroke={palette.mist} strokeWidth={1.5} />
                )}
                <text x={VW + (NW - VW) / 2} y={NH + 14} textAnchor="middle" fontSize={9} fill={palette.mist}>
                  next
                </text>
                {labels.map((name, k) => (
                  <text
                    key={name}
                    x={NW / 2}
                    y={-12 - k * 17}
                    textAnchor="middle"
                    fontSize={14}
                    fontWeight={600}
                    fill={ptrColor(name)}
                    className="font-mono"
                  >
                    {name}
                    {k === 0 ? ' ▼' : ''}
                  </text>
                ))}
              </motion.g>
            );
          })}
        </AnimatePresence>

        {step.order.length === 0 && (
          <text x={W / 2} y={ROW_Y + NH / 2} textAnchor="middle" fontSize={16} fill={palette.mist}>
            head = null (empty list)
          </text>
        )}
      </svg>
    </div>
  );
}
