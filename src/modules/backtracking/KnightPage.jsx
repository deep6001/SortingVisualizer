import { lazy, Suspense, useMemo, useRef, useState } from 'react';
import { ChessKnight } from 'lucide-react';
import usePlayer from '../../core/usePlayer';
import { blip } from '../../core/audio';
import { palette } from '../../core/theme';
import VisualizerLayout from '../../core/ui/VisualizerLayout';
import ViewToggle from '../../core/ui/ViewToggle';
import { Segmented, Slider } from '../../core/ui/controls';
import { MAX_STEPS, knightCode, solveKnight, trailOf } from './solvers';
import { Field, StageLoading } from './shared';
import { tile, useElementSize } from './util';

const Knight3D = lazy(() => import('./Knight3D'));

const legend = [
  { color: palette.amber, label: 'Knight' },
  { color: palette.violet, label: 'Next options (onward moves)' },
  { color: palette.sky, label: 'Visited, with move number' },
  { color: palette.coral, label: 'Erased on backtrack' },
  { color: palette.mint, label: 'Complete tour' },
];

export default function KnightPage({ meta, algo }) {
  const [view, setView] = useState('2d');
  const [n, setN] = useState(6);
  const [start, setStart] = useState(0);
  const [warnsdorff, setWarnsdorff] = useState(true);
  const run = useMemo(() => solveKnight(n, start, { warnsdorff }), [n, start, warnsdorff]);
  const player = usePlayer(run.steps, {
    initialSpeed: 5,
    onStep: (s) => {
      if (s?.kind === 'move') blip((s.order[s.cur] || 1) / (n * n), { gain: 0.03 });
      else if (s?.kind === 'back') blip(0.05, { type: 'square', gain: 0.02 });
    },
  });
  const step = player.step;

  const stage =
    view === '2d' ? (
      <KnightBoard n={n} step={step} onPick={setStart} />
    ) : (
      <Suspense fallback={<StageLoading />}>
        <Knight3D n={n} step={step} index={player.index} />
      </Suspense>
    );

  return (
    <VisualizerLayout
      module={meta}
      algo={algo}
      player={player}
      stage={stage}
      stageBar={<ViewToggle value={view} onChange={setView} modes={['2d', '3d']} />}
      code={knightCode}
      line={step?.line}
      message={step?.msg}
      legend={legend}
      stats={[
        { label: 'Moves made', value: step?.stats.moves ?? 0, tone: 'text-amber' },
        { label: 'Backtracks', value: step?.stats.backtracks ?? 0, tone: 'text-coral' },
        { label: 'Squares covered', value: `${step ? step.order.filter(Boolean).length : 0} / ${n * n}`, tone: 'text-mint' },
        { label: 'Board', value: `${n} × ${n}` },
      ]}
      controls={
        <>
          <Slider
            label="Board size"
            value={n}
            display={`${n} × ${n}`}
            min={5}
            max={8}
            onChange={(v) => {
              setN(v);
              setStart(0);
            }}
          />
          <Field label="Move order">
            <Segmented
              size="sm"
              label="Move order"
              value={warnsdorff ? 'w' : 'plain'}
              onChange={(v) => setWarnsdorff(v === 'w')}
              options={[
                { value: 'w', label: 'Warnsdorff heuristic' },
                { value: 'plain', label: 'Plain backtracking' },
              ]}
            />
          </Field>
          <p className="max-w-xs self-center text-xs text-mist">
            {run.capped ? (
              <span className="text-coral">Plain backtracking needs more than {MAX_STEPS.toLocaleString()} steps here, so the animation stops early.</span>
            ) : (
              'Click a square in 2D to start the tour there.'
            )}
          </p>
        </>
      }
    />
  );
}

function KnightBoard({ n, step, onPick }) {
  const box = useRef(null);
  const { width, height } = useElementSize(box);
  if (!step) return null;
  const size = Math.max(180, Math.min(width, height));
  const cell = size / n;
  const done = step.kind === 'done' || (step.kind === 'end' && step.order.every(Boolean));
  const cands = new Map((step.cands ?? []).map((c, k) => [c.i, { ...c, first: k === 0 }]));
  const center = (i) => [(i % n) * cell + cell / 2, Math.floor(i / n) * cell + cell / 2];
  const trail = trailOf(step.order);
  const erased = step.kind === 'back' ? step.from : null;

  return (
    <div className="absolute inset-0 flex px-4 pb-12 pt-14">
      <div ref={box} className="flex flex-1 items-center justify-center">
        {width > 0 && (
          <div className="relative border border-line" style={{ width: size, height: size }}>
            <div className="grid h-full w-full" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
              {Array.from({ length: n * n }, (_, i) => {
                const k = step.order[i];
                const cand = cands.get(i);
                let overlay = null;
                if (cand) overlay = cand.first ? 'rgba(182,156,255,0.4)' : 'rgba(182,156,255,0.18)';
                else if (i === erased) overlay = 'rgba(255,107,107,0.35)';
                else if (k) overlay = done ? 'rgba(94,226,176,0.2)' : 'rgba(129, 140, 248,0.14)';
                return (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Start at square ${i + 1}`}
                    onClick={() => onPick(i)}
                    className="relative flex items-center justify-center font-mono tabular-nums"
                    style={{ background: tile(Math.floor(i / n), i % n) }}
                  >
                    {overlay && <span className="absolute inset-0" style={{ background: overlay }} />}
                    {k > 0 && i !== step.cur && (
                      <span className="relative" style={{ fontSize: cell * 0.3, color: done ? palette.mint : palette.paper }}>
                        {k}
                      </span>
                    )}
                    {cand && (
                      <span className="absolute bottom-0.5 right-1 font-mono text-violet" style={{ fontSize: Math.max(9, cell * 0.2) }}>
                        {cand.deg}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <svg className="pointer-events-none absolute inset-0" width={size} height={size}>
              {trail.slice(1).map((i, k) => {
                const [x1, y1] = center(trail[k]);
                const [x2, y2] = center(i);
                return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke={done ? palette.mint : palette.sky} strokeOpacity={0.55} strokeWidth={Math.max(1.5, cell * 0.05)} strokeLinecap="round" />;
              })}
            </svg>
            {step.cur != null && (
              <ChessKnight
                className="pointer-events-none absolute transition-[left,top] duration-200"
                size={cell * 0.66}
                strokeWidth={1.6}
                style={{
                  left: center(step.cur)[0] - cell * 0.33,
                  top: center(step.cur)[1] - cell * 0.33,
                  color: done ? palette.mint : palette.amber,
                  filter: `drop-shadow(0 0 8px ${done ? palette.mint : palette.amber})`,
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
