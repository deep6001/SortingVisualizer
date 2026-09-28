import { motion } from 'motion/react';
import { palette } from '../../core/theme';

const SY = 78;
const BH = 26;

const statusColor = {
  active: palette.amber,
  waiting: palette.sky,
  done: palette.mint,
  memo: palette.violet,
};


const boxW = (s) => Math.max(34, String(s).length * 8.2 + 14);

/** A call tree that grows node by node. step.tree holds the final layout; step.count says how much exists yet. */
export default function CallTree2D({ step, sx = 56, footer }) {
  if (!step?.tree) return null;
  const { nodes, x, leaves, depth } = step.tree;
  const W = leaves * sx + 40;
  const H = (depth + 1) * SY + 30;
  const pos = (id) => [20 + sx / 2 + x[id] * sx, 24 + nodes[id].depth * SY];
  const visible = nodes.slice(0, step.count);

  return (
    <div className="absolute inset-0 flex flex-col px-3 pb-5 pt-14">
      <svg viewBox={`0 0 ${W} ${H}`} className="min-h-0 w-full flex-1" preserveAspectRatio="xMidYMin meet">
        {visible.map((n) => {
          if (n.parent == null) return null;
          const [x1, y1] = pos(n.parent);
          const [x2, y2] = pos(n.id);
          const live = step.status[n.id] === 'active' || step.status[n.id] === 'waiting';
          return (
            <g key={`e${n.id}`}>
              <motion.line
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.25 }}
                x1={x1}
                y1={y1 + BH}
                x2={x2}
                y2={y2}
                stroke={live ? palette.amber : palette.line}
                strokeWidth={live ? 2 : 1.4}
              />
              {n.edge && (
                <text x={(x1 + x2) / 2 + (x2 < x1 ? -6 : 6)} y={(y1 + BH + y2) / 2} textAnchor={x2 < x1 ? 'end' : 'start'} fontSize={11} fill={palette.mist} className="font-mono">
                  {n.edge}
                </text>
              )}
            </g>
          );
        })}
        {visible.map((n) => {
          const [cx, cy] = pos(n.id);
          const st = step.status[n.id];
          const c = statusColor[st] ?? palette.sky;
          const w = boxW(n.label);
          const v = step.values[n.id];
          const hot = st === 'active';
          return (
            <motion.g key={n.id} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
              {n.dup && (
                <rect x={cx - w / 2 - 4} y={cy - 4} width={w + 8} height={BH + 8} rx={8} fill="none" stroke={palette.coral} strokeDasharray="4 3" strokeWidth={1.5} />
              )}
              <rect
                x={cx - w / 2}
                y={cy}
                width={w}
                height={BH}
                rx={6}
                fill={st === 'waiting' ? palette.panel : `${c}33`}
                stroke={c}
                strokeWidth={hot ? 2.5 : 1.5}
                style={hot ? { filter: `drop-shadow(0 0 7px ${c})` } : undefined}
              />
              <text x={cx} y={cy + BH / 2 + 1} textAnchor="middle" dominantBaseline="middle" fontSize={13} fill={palette.paper} className="font-mono">
                {n.label}
              </text>
              {v != null && v !== '' && (
                <text x={cx} y={cy + BH + 15} textAnchor="middle" fontSize={12} fontWeight={600} fill={st === 'memo' ? palette.violet : palette.mint} className="font-mono">
                  {v === '✓' ? '✓' : `= ${v}`}
                </text>
              )}
            </motion.g>
          );
        })}
      </svg>
      {footer}
    </div>
  );
}
