import { useMemo, useRef, useState } from 'react';
import { DoorOpen, Eraser, Rat, Shuffle } from 'lucide-react';
import usePlayer from '../../core/usePlayer';
import { blip } from '../../core/audio';
import { palette } from '../../core/theme';
import VisualizerLayout from '../../core/ui/VisualizerLayout';
import { Button, Slider } from '../../core/ui/controls';
import { mazeCode, randomMaze, solveMaze } from './solvers';
import { useElementSize } from './util';

const legend = [
  { color: palette.amber, label: 'Rat' },
  { color: palette.sky, label: 'Current path' },
  { color: palette.coral, label: 'Dead end / blocked' },
  { color: palette.mint, label: 'Escape route' },
  { color: palette.line, label: 'Wall' },
];

export default function MazePage({ meta, algo }) {
  const [n, setN] = useState(8);
  const [walls, setWalls] = useState(() => randomMaze(8));
  const run = useMemo(() => solveMaze(n, walls), [n, walls]);
  const player = usePlayer(run.steps, {
    initialSpeed: 6,
    onStep: (s) => {
      if (s?.kind === 'move') blip(s.path.length / (n * 2), { gain: 0.03 });
      else if (s?.kind === 'back') blip(0.05, { type: 'square', gain: 0.02 });
    },
  });
  const step = player.step;

  const toggle = (i) => {
    if (i === 0 || i === n * n - 1) return;
    setWalls((w) => w.map((x, k) => (k === i ? !x : x)));
  };

  return (
    <VisualizerLayout
      module={meta}
      algo={algo}
      player={player}
      stage={<MazeGrid n={n} walls={walls} step={step} onToggle={toggle} />}
      code={mazeCode}
      line={step?.line}
      message={step?.msg}
      legend={legend}
      stats={[
        { label: 'Cells visited', value: step?.stats.visits ?? 0, tone: 'text-amber' },
        { label: 'Backtracks', value: step?.stats.backtracks ?? 0, tone: 'text-coral' },
        { label: 'Path length', value: step?.path.length ?? 0, tone: 'text-sky' },
        { label: 'Maze', value: `${n} × ${n}` },
      ]}
      controls={
        <>
          <Slider
            label="Maze size"
            value={n}
            display={`${n} × ${n}`}
            min={5}
            max={12}
            onChange={(v) => {
              setN(v);
              setWalls(randomMaze(v));
            }}
          />
          <Button onClick={() => setWalls(randomMaze(n))}>
            <Shuffle size={14} /> Random maze
          </Button>
          <Button tone="ghost" onClick={() => setWalls(Array(n * n).fill(false))}>
            <Eraser size={14} /> Clear walls
          </Button>
          <p className="self-center text-xs text-mist">Click a cell to add or remove a wall.</p>
        </>
      }
    />
  );
}

function MazeGrid({ n, walls, step, onToggle }) {
  const box = useRef(null);
  const { width, height } = useElementSize(box);
  if (!step) return null;
  const size = Math.max(180, Math.min(width, height));
  const cell = size / n;
  const found = step.kind === 'found' || (step.kind === 'end' && step.path[step.path.length - 1] === n * n - 1);
  const onPath = new Map(step.path.map((i, k) => [i, k]));
  const dead = new Set(step.dead);
  const center = (i) => [(i % n) * cell + cell / 2, Math.floor(i / n) * cell + cell / 2];
  const trail = step.path.map((i) => center(i).join(',')).join(' ');
  const rat = step.cur ?? step.path[step.path.length - 1];

  return (
    <div className="absolute inset-0 flex px-4 pb-12 pt-14">
      <div ref={box} className="flex flex-1 items-center justify-center">
        {width > 0 && (
          <div className="relative border border-line" style={{ width: size, height: size }}>
            <div className="grid h-full w-full" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
              {walls.map((w, i) => {
                let bg = 'rgba(20,36,58,0.6)';
                if (w) bg = `repeating-linear-gradient(45deg, #3B3B56 0 5px, #26263A 5px 10px)`;
                else if (onPath.has(i)) bg = found ? 'rgba(94,226,176,0.35)' : 'rgba(129, 140, 248,0.28)';
                else if (dead.has(i)) bg = 'rgba(255,107,107,0.16)';
                const blocked = step.blockedAt === i;
                return (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Cell ${Math.floor(i / n) + 1}, ${(i % n) + 1}${w ? ' (wall)' : ''}`}
                    onClick={() => onToggle(i)}
                    className="relative border border-deep/60 transition-colors duration-100 hover:brightness-125"
                    style={{ background: bg, boxShadow: blocked ? `inset 0 0 0 2px ${palette.coral}` : 'none' }}
                  >
                    {dead.has(i) && !onPath.has(i) && <span className="absolute inset-0 grid place-items-center text-coral/70" style={{ fontSize: cell * 0.3 }}>✕</span>}
                  </button>
                );
              })}
            </div>
            <svg className="pointer-events-none absolute inset-0" width={size} height={size}>
              {step.path.length > 1 && (
                <polyline points={trail} fill="none" stroke={found ? palette.mint : palette.sky} strokeWidth={Math.max(2, cell * 0.12)} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
              )}
            </svg>
            <DoorOpen className="pointer-events-none absolute" size={cell * 0.55} style={{ left: size - cell / 2 - cell * 0.275, top: size - cell / 2 - cell * 0.275, color: palette.mint }} />
            {rat != null && (
              <Rat
                className="pointer-events-none absolute transition-[left,top] duration-150"
                size={cell * 0.62}
                style={{
                  left: center(rat)[0] - cell * 0.31,
                  top: center(rat)[1] - cell * 0.31,
                  color: found ? palette.mint : palette.amber,
                  filter: `drop-shadow(0 0 6px ${found ? palette.mint : palette.amber})`,
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
