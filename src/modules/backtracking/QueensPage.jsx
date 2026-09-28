import { lazy, Suspense, useMemo, useState } from 'react';
import usePlayer from '../../core/usePlayer';
import { blip } from '../../core/audio';
import { palette } from '../../core/theme';
import VisualizerLayout from '../../core/ui/VisualizerLayout';
import ViewToggle from '../../core/ui/ViewToggle';
import { Segmented, Slider } from '../../core/ui/controls';
import { MAX_STEPS, queensCode, solveQueens } from './solvers';
import Queens2D from './Queens2D';
import { Field, StageLoading } from './shared';

const Queens3D = lazy(() => import('./Queens3D'));
const QueensPhysics = lazy(() => import('./QueensPhysics'));

const legend = [
  { color: palette.sky, label: 'Queen' },
  { color: palette.amber, label: 'Just placed / trying' },
  { color: palette.coral, label: 'Attacked line / removed' },
  { color: palette.mint, label: 'Solution' },
];

export default function QueensPage({ meta, algo }) {
  const [view, setView] = useState('3d');
  const [n, setN] = useState(() => (window.innerWidth < 640 ? 6 : 8));
  const [all, setAll] = useState(false);
  const run = useMemo(() => solveQueens(n, { all }), [n, all]);
  const player = usePlayer(run.steps, {
    initialSpeed: 4,
    onStep: (s) => {
      if (s?.kind === 'place') blip(0.3 + (s.at[0] / n) * 0.6, { gain: 0.04 });
      else if (s?.kind === 'conflict') blip(0.1, { type: 'square', gain: 0.02 });
      else if (s?.kind === 'solution') blip(1, { duration: 0.2, gain: 0.05 });
    },
  });
  const step = player.step;

  const stage =
    view === '2d' ? (
      <Queens2D n={n} step={step} />
    ) : (
      <Suspense fallback={<StageLoading />}>
        {view === '3d' ? <Queens3D n={n} step={step} index={player.index} /> : <QueensPhysics key={n} n={n} step={step} index={player.index} />}
      </Suspense>
    );

  return (
    <VisualizerLayout
      module={meta}
      algo={algo}
      player={player}
      stage={stage}
      stageBar={<ViewToggle value={view} onChange={setView} />}
      code={queensCode}
      line={step?.line}
      message={step?.msg}
      legend={legend}
      stats={[
        { label: 'Placements', value: step?.stats.placements ?? 0, tone: 'text-amber' },
        { label: 'Backtracks', value: step?.stats.backtracks ?? 0, tone: 'text-coral' },
        { label: 'Solutions found', value: step?.stats.solutions ?? 0, tone: 'text-mint' },
        { label: 'Board', value: `${n} × ${n}` },
      ]}
      controls={
        <>
          <Slider label="Board size" value={n} display={`${n} × ${n}`} min={4} max={10} onChange={setN} />
          <Field label="Search">
            <Segmented
              size="sm"
              label="Search"
              value={all ? 'all' : 'first'}
              onChange={(v) => setAll(v === 'all')}
              options={[
                { value: 'first', label: 'First solution' },
                { value: 'all', label: 'Find all solutions' },
              ]}
            />
          </Field>
          {run.capped && (
            <p className="max-w-xs self-center text-xs text-coral">
              This search is longer than {MAX_STEPS.toLocaleString()} steps, so the animation stops early.
            </p>
          )}
        </>
      }
    />
  );
}
