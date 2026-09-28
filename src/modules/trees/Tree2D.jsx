import { AnimatePresence, motion } from 'motion/react';
import { palette } from '../../core/theme';
import { IDLE_EDGE, edgeTone, toneStyle } from './tones';

const W = 1000;
const H = 540;
const spring = { type: 'spring', stiffness: 140, damping: 20 };

/** Screen geometry for a tree step; `reserve` leaves room at the bottom for strips. */
function geometry(step, reserve) {
  const width = Math.max(1, step.width);
  const slot = Math.min(72, (W - 80) / width);
  const gap = Math.min(92, (H - reserve - 80) / Math.max(1, step.depth));
  const r = Math.max(10, Math.min(22, slot * 0.42, gap * 0.32));
  return { r, at: (x, d) => [W / 2 + (x - (width - 1) / 2) * slot, 48 + d * gap] };
}

/** SVG tree whose nodes glide to new spots between steps (so AVL rotations visibly move). */
export default function Tree2D({ step, reserve = 60 }) {
  if (!step) return null;
  const { r, at } = geometry(step, reserve);
  const byId = new Map(step.nodes.map((n) => [n.id, n]));
  const fs = Math.max(10, r * 0.72);
  const ghostNode = step.ghost && byId.get(step.ghost.at);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" role="img" aria-label="Tree">
      <AnimatePresence>
        {step.edges.map((e) => {
          const a = byId.get(e.from);
          const b = byId.get(e.to);
          if (!a || !b) return null;
          const [x1, y1] = at(a.x, a.d);
          const [x2, y2] = at(b.x, b.d);
          return (
            <motion.line
              key={`${e.from}-${e.to}`}
              initial={{ x1, y1, x2, y2, opacity: 0 }}
              animate={{ x1, y1, x2, y2, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={spring}
              stroke={edgeTone[e.tone] ?? IDLE_EDGE}
              strokeWidth={e.tone === 'idle' ? 2 : 3}
              style={{ transition: 'stroke .2s' }}
            />
          );
        })}
      </AnimatePresence>

      <AnimatePresence>
        {step.nodes.map((n) => {
          const [x, y] = at(n.x, n.d);
          const st = toneStyle[n.tone] ?? toneStyle.idle;
          return (
            <motion.g
              key={n.id}
              initial={{ x, y, scale: 0, opacity: 0 }}
              animate={{ x, y, scale: 1, opacity: 1 }}
              exit={{ scale: 0.2, opacity: 0, transition: { duration: 0.35 } }}
              transition={spring}
            >
              {n.ring && <circle r={r + 4} fill="none" stroke={st.stroke} strokeWidth={1.5} />}
              <circle
                r={r}
                fill={st.fill}
                stroke={st.stroke}
                strokeWidth={2.5}
                style={{ transition: 'fill .2s, stroke .2s', filter: st.glow ? `drop-shadow(0 0 9px ${st.stroke})` : undefined }}
              />
              <text y={fs * 0.36} textAnchor="middle" fontSize={fs} fontWeight={700} fill={st.text} className="select-none">
                {n.label}
              </text>
              {n.badge && (
                <text x={r + 4} y={-r + 4} fontSize={Math.max(10, fs * 0.72)} className="font-mono" fill={n.badgeTone === 'coral' ? palette.coral : palette.mist}>
                  {n.badge}
                </text>
              )}
              {n.sub && (
                <text y={r + fs * 0.95} textAnchor="middle" fontSize={Math.max(9, fs * 0.62)} className="font-mono" fill={palette.mist}>
                  {n.sub}
                </text>
              )}
            </motion.g>
          );
        })}
      </AnimatePresence>

      <AnimatePresence>
        {ghostNode && (
          <motion.g
            key="ghost"
            initial={{ opacity: 0, x: at(ghostNode.x, ghostNode.d)[0] - r * 2.1, y: at(ghostNode.x, ghostNode.d)[1] - r * 1.5 }}
            animate={{ opacity: 1, x: at(ghostNode.x, ghostNode.d)[0] - r * 2.1, y: at(ghostNode.x, ghostNode.d)[1] - r * 1.5 }}
            exit={{ opacity: 0 }}
            transition={spring}
          >
            <circle r={r * 0.85} fill={palette.violet} style={{ filter: `drop-shadow(0 0 8px ${palette.violet})` }} />
            <text y={fs * 0.32} textAnchor="middle" fontSize={fs * 0.85} fontWeight={700} fill={palette.ink}>
              {step.ghost.label}
            </text>
          </motion.g>
        )}
      </AnimatePresence>

      {!step.nodes.length && (
        <text x={W / 2} y={H / 2 - 40} textAnchor="middle" fontSize={18} fill={palette.mist}>
          Empty. Insert a key to start.
        </text>
      )}
    </svg>
  );
}
