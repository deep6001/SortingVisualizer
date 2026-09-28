import { lazy, Suspense, useMemo, useState } from 'react';
import meta from './meta';
import { PEG, hanoiCode, hanoiTrace } from './algorithms';
import Hanoi2D from './Hanoi2D';
import CallStackPanel from './CallStackPanel';
import usePlayer from '../../core/usePlayer';
import { blip } from '../../core/audio';
import { palette } from '../../core/theme';
import VisualizerLayout from '../../core/ui/VisualizerLayout';
import ViewToggle from '../../core/ui/ViewToggle';
import { Slider } from '../../core/ui/controls';
import { StageLoading } from '../structures/ui';

const Hanoi3D = lazy(() => import('./Hanoi3D'));

const legend = [
  { color: palette.amber, label: 'Disk moving / pegs in use' },
  { color: palette.sky, label: 'Small disk' },
  { color: palette.violet, label: 'Large disk' },
  { color: palette.mint, label: 'Solved' },
];

const note = ['call', '', 'base case', 'first half', 'moving', 'second half', 'return'];

export default function HanoiPage({ algo }) {
  const [view, setView] = useState('physics');
  const [n, setN] = useState(4);
  const steps = useMemo(() => hanoiTrace(n), [n]);
  const player = usePlayer(steps, {
    initialSpeed: 3,
    onStep: (s) => s?.move && blip(1 - s.move.disk / (n + 1), { type: 'triangle', gain: 0.05 }),
  });
  const step = player.step;

  const frames = (step?.stack ?? []).map((f, i) => ({
    key: `${i}-${f.k}-${f.from}-${f.to}`,
    label: `hanoi(${f.k}, ${PEG[f.from]}, ${PEG[f.to]}, ${PEG[f.via]})`,
    note: note[f.at],
  }));

  const stage = (
    <>
      {view === '2d' ? (
        <Hanoi2D step={step} n={n} speed={player.speed} />
      ) : (
        <Suspense fallback={<StageLoading />}>
          <Hanoi3D key={`${n}-${view}`} step={step} index={player.index} speed={player.speed} physics={view === 'physics'} n={n} />
        </Suspense>
      )}
      <CallStackPanel frames={frames} max={9} />
    </>
  );

  return (
    <VisualizerLayout
      module={meta}
      algo={algo}
      player={player}
      stage={stage}
      stageBar={<ViewToggle value={view} onChange={setView} />}
      code={hanoiCode}
      line={step?.line}
      message={step?.msg}
      legend={legend}
      stats={[
        { label: 'Moves made', value: `${step?.stats.moves ?? 0} / ${2 ** n - 1}`, tone: 'text-amber' },
        { label: 'Calls', value: step?.stats.calls ?? 0 },
        { label: 'Stack depth', value: step?.stats.depth ?? 0, tone: 'text-violet' },
        { label: 'Max depth', value: step?.stats.maxDepth ?? 0 },
      ]}
      controls={
        <>
          <Slider label="Disks" value={n} min={3} max={8} onChange={setN} />
          <p className="max-w-md flex-[2] text-xs text-mist">
            To move n disks, first move n − 1 out of the way, move the biggest, then move the n − 1 back on top. That gives
            2ⁿ − 1 moves: {n} disks need {2 ** n - 1}. In Physics view the disks are rigid bodies, released just above their
            landing spot.
          </p>
        </>
      }
    />
  );
}
