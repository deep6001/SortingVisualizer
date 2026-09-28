import { useMemo, useState } from 'react';
import { Eraser, Shuffle } from 'lucide-react';
import meta from './meta';
import { floodCode, floodTrace, randomGrid } from './algorithms';
import CallStackPanel from './CallStackPanel';
import usePlayer from '../../core/usePlayer';
import { blip } from '../../core/audio';
import { palette } from '../../core/theme';
import VisualizerLayout from '../../core/ui/VisualizerLayout';
import { Button, Segmented } from '../../core/ui/controls';

const ROWS = 8;
const COLS = 12;
const CELL = 40;

const legend = [
  { color: palette.amber, label: 'Current call / on the stack' },
  { color: palette.mint, label: 'Filled' },
  { color: palette.coral, label: 'Rejected: wall or already filled' },
  { color: palette.violet, label: 'Start cell' },
];

function freshGrid(seed) {
  const g = randomGrid(ROWS, COLS, 0.27);
  g[seed[0] * COLS + seed[1]] = 0;
  return g;
}

function Grid2D({ step, seed, onCell }) {
  if (!step) return null;
  const onPath = new Set(step.path.map(([r, c]) => r * COLS + c));
  const cur = step.cur;
  return (
    <div className="absolute inset-0 px-4 pb-5 pt-12">
      <svg viewBox={`-4 -4 ${COLS * CELL + 8} ${ROWS * CELL + 8}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        {step.grid.map((v, i) => {
          const r = Math.floor(i / COLS);
          const c = i % COLS;
          const isCur = cur && cur[0] === r && cur[1] === c;
          const reject = isCur && (step.verdict === 'wall' || step.verdict === 'filled');
          let fill = palette.panel;
          if (v === 1) fill = palette.line;
          else if (v === 2) fill = `${palette.mint}${onPath.has(i) ? '55' : '99'}`;
          if (isCur && step.verdict === 'fill') fill = palette.amber;
          const stroke = reject ? palette.coral : onPath.has(i) ? palette.amber : '#2C2C41';
          return (
            <rect
              key={i}
              x={c * CELL + 2}
              y={r * CELL + 2}
              width={CELL - 4}
              height={CELL - 4}
              rx={4}
              fill={fill}
              stroke={stroke}
              strokeWidth={reject || onPath.has(i) ? 2.5 : 1}
              className="cursor-pointer"
              style={isCur ? { filter: `drop-shadow(0 0 6px ${reject ? palette.coral : palette.amber})` } : undefined}
              onClick={() => onCell(r, c)}
            />
          );
        })}
        {step.path.map(([r, c], k) => (
          <text key={k} x={c * CELL + CELL / 2} y={r * CELL + CELL / 2 + 1} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill={palette.ink} pointerEvents="none" className="font-mono">
            {k + 1}
          </text>
        ))}
        <circle cx={seed[1] * CELL + CELL / 2} cy={seed[0] * CELL + CELL / 2} r={CELL / 2 - 3} fill="none" stroke={palette.violet} strokeWidth={2} strokeDasharray="4 3" pointerEvents="none" />
      </svg>
    </div>
  );
}

export default function FloodFillPage({ algo }) {
  const [seed, setSeed] = useState([3, 5]);
  const [grid, setGrid] = useState(() => freshGrid([3, 5]));
  const [tool, setTool] = useState('seed');
  const steps = useMemo(() => floodTrace(grid, ROWS, COLS, seed), [grid, seed]);
  const player = usePlayer(steps, {
    initialSpeed: 12,
    onStep: (s) => s?.verdict === 'fill' && blip(s.path.length / 40, { type: 'triangle', gain: 0.03 }),
  });
  const step = player.step;

  const onCell = (r, c) => {
    const i = r * COLS + c;
    if (tool === 'seed') {
      if (grid[i] === 1) setGrid((g) => g.map((v, k) => (k === i ? 0 : v)));
      setSeed([r, c]);
    } else if (!(seed[0] === r && seed[1] === c)) {
      setGrid((g) => g.map((v, k) => (k === i ? 1 - v : v)));
    }
  };

  const frames = (step?.path ?? []).map(([r, c], k) => ({ key: `${k}-${r}-${c}`, label: `fill(${r}, ${c})` }));

  return (
    <VisualizerLayout
      module={meta}
      algo={algo}
      player={player}
      stage={
        <>
          <Grid2D step={step} seed={seed} onCell={onCell} />
          <CallStackPanel frames={frames} max={8} />
        </>
      }
      code={floodCode}
      line={step?.line}
      message={step?.msg}
      legend={legend}
      stats={[
        { label: 'Calls', value: step?.stats.calls ?? 0, tone: 'text-amber' },
        { label: 'Cells filled', value: step?.stats.filled ?? 0, tone: 'text-mint' },
        { label: 'Stack depth', value: step?.stats.depth ?? 0, tone: 'text-violet' },
        { label: 'Max depth', value: step?.stats.maxDepth ?? 0 },
      ]}
      controls={
        <>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-mist">Click a cell to</span>
            <Segmented
              size="sm"
              label="Click tool"
              value={tool}
              options={[
                { value: 'seed', label: 'Set start' },
                { value: 'wall', label: 'Toggle wall' },
              ]}
              onChange={setTool}
            />
          </div>
          <Button onClick={() => setGrid(freshGrid(seed))}>
            <Shuffle size={14} /> New walls
          </Button>
          <Button tone="ghost" onClick={() => setGrid(Array(ROWS * COLS).fill(0))}>
            <Eraser size={14} /> Clear walls
          </Button>
          <p className="max-w-md flex-[2] text-xs text-mist">
            The numbers show the current chain of calls. On an open grid the chain snakes through almost every cell, which is
            why real flood fills often use an explicit stack or a queue instead.
          </p>
        </>
      }
    />
  );
}
