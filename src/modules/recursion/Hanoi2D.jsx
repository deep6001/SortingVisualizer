import { motion } from 'motion/react';
import { palette } from '../../core/theme';
import { PEG } from './algorithms';

const W = 800;
const BASE_Y = 330;
const PEG_X = [150, 400, 650];
const DH = 24;

const mix = (a, b, t) => {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`;
};

export default function Hanoi2D({ step, n, speed }) {
  if (!step) return null;
  const maxW = 230;
  const width = (d) => 40 + ((maxW - 40) * (d - 1)) / Math.max(1, n - 1);
  const liftY = BASE_Y - n * DH - 50;
  const dur = Math.min(0.7, Math.max(0.12, 1.8 / speed));
  const done = step.pegs[2].length === n;
  const top = step.stack[step.stack.length - 1];

  const disks = [];
  step.pegs.forEach((peg, p) =>
    peg.forEach((d, k) => {
      disks.push({ d, x: PEG_X[p] - width(d) / 2, y: BASE_Y - (k + 1) * DH });
    }),
  );

  return (
    <div className="absolute inset-0 px-4 pb-5 pt-12">
      <svg viewBox={`0 0 ${W} 380`} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        <rect x={20} y={BASE_Y} width={W - 40} height={14} rx={3} fill={palette.line} />
        {PEG_X.map((x, p) => {
          const hot = top && (top.from === p || top.to === p);
          return (
            <g key={p}>
              <rect x={x - 4} y={BASE_Y - n * DH - 30} width={8} height={n * DH + 30} rx={3} fill={hot ? palette.amber : palette.mist} opacity={hot ? 0.9 : 0.5} />
              <text x={x} y={BASE_Y + 34} textAnchor="middle" fontSize={16} fill={palette.paper} className="font-display">
                {PEG[p]}
              </text>
            </g>
          );
        })}
        {disks.map(({ d, x, y }) => {
          const moving = step.move?.disk === d;
          const color = done ? palette.mint : moving ? palette.amber : mix(palette.sky, palette.violet, n > 1 ? (d - 1) / (n - 1) : 0);
          const w = width(d);
          let animate = { x, y };
          let transition = { type: 'spring', stiffness: 300, damping: 30 };
          if (moving) {
            const fromX = PEG_X[step.move.from] - w / 2;
            const fromY = BASE_Y - (step.pegs[step.move.from].length + 1) * DH;
            animate = { x: [fromX, fromX, x, x], y: [fromY, liftY, liftY, y] };
            transition = { duration: dur, times: [0, 0.3, 0.7, 1], ease: 'easeInOut' };
          }
          return (
            <motion.g key={d} initial={false} animate={animate} transition={transition}>
              <rect
                width={w}
                height={DH - 3}
                rx={8}
                fill={color}
                style={moving ? { filter: `drop-shadow(0 0 8px ${palette.amber})` } : undefined}
              />
              <text x={w / 2} y={(DH - 3) / 2 + 1} textAnchor="middle" dominantBaseline="middle" fontSize={12} fill={palette.ink} fontWeight={700}>
                {d}
              </text>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
