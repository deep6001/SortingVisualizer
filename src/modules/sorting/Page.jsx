import { lazy, Suspense, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shuffle, Swords } from 'lucide-react';
import meta from './meta';
import { sortingRunners } from './algorithms';
import useAlgo from '../../core/useAlgo';
import usePlayer from '../../core/usePlayer';
import { presets, trace } from '../../core/arrayTracer';
import { blip } from '../../core/audio';
import VisualizerLayout from '../../core/ui/VisualizerLayout';
import ViewToggle from '../../core/ui/ViewToggle';
import { Button, Segmented, Slider } from '../../core/ui/controls';
import ArrayBars2D from '../../core/viz/ArrayBars2D';
import { arrayLegend } from '../../core/viz/arrayState';

const ArrayBars3D = lazy(() => import('../../core/viz/ArrayBars3D'));
const ArrayBarsPhysics = lazy(() => import('../../core/viz/ArrayBarsPhysics'));

const LIMIT = { '2d': 150, '3d': 64, physics: 40 };

const presetOptions = [
  { value: 'random', label: 'Random' },
  { value: 'nearly', label: 'Nearly sorted' },
  { value: 'reversed', label: 'Reversed' },
  { value: 'few', label: 'Few unique' },
];

const parseList = (text) =>
  text
    .split(/[\s,]+/)
    .map(Number)
    .filter((x) => Number.isFinite(x) && x > 0)
    .map((x) => Math.min(999, Math.round(x)));

export default function SortingPage() {
  const algo = useAlgo(meta);
  const runner = sortingRunners[algo.id];
  const [view, setView] = useState('3d');
  const [size, setSize] = useState(() => (window.innerWidth < 640 ? 14 : 28));
  const [preset, setPreset] = useState('random');
  const [input, setInput] = useState(() => presets.random(size));
  const [custom, setCustom] = useState('');

  const regenerate = (n = size, p = preset) => setInput(presets[p](n));

  const steps = useMemo(() => trace(input, runner.run), [input, runner]);
  const player = usePlayer(steps, {
    initialSpeed: 12,
    onStep: (s) => {
      const i = s?.swp?.[0] ?? s?.wr ?? s?.cmp?.[0];
      if (i != null) blip(s.a[i] / s.max, { type: s.swp || s.wr != null ? 'square' : 'triangle', gain: 0.03 });
    },
  });
  const step = player.step;

  const changeView = (v) => {
    setView(v);
    if (size > LIMIT[v]) {
      setSize(LIMIT[v]);
      regenerate(LIMIT[v]);
    }
  };

  const stage =
    view === '2d' ? (
      <ArrayBars2D step={step} />
    ) : (
      <Suspense fallback={<StageLoading />}>
        {view === '3d' ? <ArrayBars3D step={step} /> : <ArrayBarsPhysics step={step} />}
      </Suspense>
    );

  return (
    <VisualizerLayout
      module={meta}
      algo={algo}
      player={player}
      stage={stage}
      stageBar={<ViewToggle value={view} onChange={changeView} />}
      code={runner.code}
      line={step?.line}
      message={step?.msg}
      legend={arrayLegend}
      stats={[
        { label: 'Comparisons', value: step?.stats.cmp ?? 0, tone: 'text-amber' },
        { label: 'Swaps', value: step?.stats.swaps ?? 0, tone: 'text-coral' },
        { label: 'Writes', value: step?.stats.writes ?? 0 },
        { label: 'Elements', value: input.length },
      ]}
      controls={
        <>
          <Slider
            label="Elements"
            value={size}
            min={4}
            max={LIMIT[view]}
            onChange={(n) => {
              setSize(n);
              regenerate(n);
            }}
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-mist">Starting order</span>
            <Segmented
              size="sm"
              label="Starting order"
              value={preset}
              options={presetOptions}
              onChange={(p) => {
                setPreset(p);
                regenerate(size, p);
              }}
            />
          </div>
          <form
            className="flex flex-1 items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const list = parseList(custom).slice(0, LIMIT[view]);
              if (list.length > 1) {
                setInput(list);
                setSize(list.length);
              }
            }}
          >
            <label className="flex min-w-[160px] flex-1 flex-col gap-1.5 text-xs text-mist">
              Your own numbers
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="e.g. 42 7 19 88 3"
                className="h-9 rounded-md border border-input bg-background/60 px-3 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm text-paper placeholder:text-mist/60 focus:border-primary/60"
              />
            </label>
            <Button type="submit">Use</Button>
          </form>
          <Button onClick={() => regenerate()}>
            <Shuffle size={14} /> Shuffle
          </Button>
          <Link
            to="/race"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-amber/50 px-3 text-sm text-amber hover:bg-amber/10"
          >
            <Swords size={14} /> Race algorithms
          </Link>
        </>
      }
    />
  );
}

export function StageLoading() {
  return <div className="absolute inset-0 grid place-items-center text-sm text-mist">Loading 3D scene…</div>;
}
