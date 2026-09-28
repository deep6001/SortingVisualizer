import { lazy, Suspense, useMemo, useState } from 'react';
import { Dices, SearchX, Shuffle } from 'lucide-react';
import meta from './meta';
import { distinctValues, missingTarget, presentTarget, searchRunners } from './algorithms';
import useAlgo from '../../core/useAlgo';
import usePlayer from '../../core/usePlayer';
import { trace } from '../../core/arrayTracer';
import { blip } from '../../core/audio';
import { palette } from '../../core/theme';
import VisualizerLayout from '../../core/ui/VisualizerLayout';
import ViewToggle from '../../core/ui/ViewToggle';
import { Button, NumberInput, Slider } from '../../core/ui/controls';
import ArrayBars2D from '../../core/viz/ArrayBars2D';

const ArrayBars3D = lazy(() => import('../../core/viz/ArrayBars3D'));

const LIMIT = { '2d': 64, '3d': 40 };

const legend = [
  { color: palette.amber, label: 'Checking' },
  { color: palette.violet, label: 'Probe / best start' },
  { color: palette.mint, label: 'Found' },
  { color: '#26263A', label: 'Ruled out' },
];

export default function SearchingPage() {
  const algo = useAlgo(meta);
  const runner = searchRunners[algo.id];
  const [view, setView] = useState('2d');
  const [size, setSize] = useState(() => (window.innerWidth < 640 ? 14 : 30));
  const [pool, setPool] = useState(() => distinctValues(size));
  const [target, setTarget] = useState(() => pool[Math.floor(pool.length * 0.7)]);
  const [sumTarget, setSumTarget] = useState(() => presentTarget(pool, true));
  const [k, setK] = useState(4);

  // the same values serve every algorithm; the sorted ones just see them in order
  const input = useMemo(() => (runner.sorted ? [...pool].sort((x, y) => x - y) : pool), [pool, runner.sorted]);
  const goal = Number(runner.usesSum ? sumTarget : target) || 0;

  const { steps, answer } = useMemo(() => {
    let answer;
    const steps = trace(input, (t) => (answer = runner.run(t, goal, { k })), { finish: false });
    return { steps, answer };
  }, [input, runner, goal, k]);

  const player = usePlayer(steps, {
    initialSpeed: 4,
    onStep: (s) => {
      const i = s?.found ?? s?.cmp?.[0];
      if (i != null) blip(s.a[i] / s.max, { type: s.found != null ? 'sine' : 'triangle', gain: 0.04 });
    },
  });
  const step = player.step;

  const regenerate = (n = size) => {
    const p = distinctValues(n);
    setPool(p);
    setTarget(presentTarget(p));
    setSumTarget(presentTarget(p, true));
  };

  const changeView = (v) => {
    setView(v);
    if (size > LIMIT[v]) {
      setSize(LIMIT[v]);
      regenerate(LIMIT[v]);
    }
  };

  const vars = step?.marks?.vars ?? {};
  const stats = [{ label: 'Comparisons', value: step?.stats.cmp ?? 0, tone: 'text-amber' }];
  if (runner.usesK) {
    stats.push({ label: 'Window sum', value: vars.sum ?? '–' }, { label: 'Best sum', value: vars.best ?? '–', tone: 'text-mint' });
  } else if (runner.usesSum) {
    stats.push({ label: 'Target sum', value: goal }, { label: 'Current sum', value: vars.sum ?? '–' });
  } else {
    stats.push({ label: 'Target', value: goal });
  }
  stats.push({ label: 'Result', value: player.done ? describe(answer, runner, k) : '…', tone: player.done ? 'text-mint' : undefined });
  if (!runner.usesK && !runner.usesSum) stats.push({ label: 'Elements', value: input.length });

  const stage =
    view === '2d' ? (
      <ArrayBars2D step={step} />
    ) : (
      <Suspense fallback={<StageLoading />}>
        <ArrayBars3D step={step} />
      </Suspense>
    );

  const sums = runner.usesSum;
  return (
    <VisualizerLayout
      module={meta}
      algo={algo}
      player={player}
      stage={stage}
      stageBar={
        <>
          <ViewToggle value={view} onChange={changeView} modes={['2d', '3d']} />
          <span className="inline-flex h-8 items-center rounded-md border border-line bg-deep/70 px-2.5 text-xs text-mist backdrop-blur">
            {runner.sorted ? 'Needs sorted input' : 'Works on any order'}
          </span>
        </>
      }
      code={runner.code}
      line={step?.line}
      message={step?.msg}
      legend={legend}
      stats={stats}
      controls={
        <>
          <Slider
            label="Elements"
            value={size}
            min={runner.usesK ? 6 : 4}
            max={LIMIT[view]}
            onChange={(n) => {
              setSize(n);
              setK((w) => Math.min(w, n));
              regenerate(n);
            }}
          />
          {runner.usesK ? (
            <Slider label="Window size k" value={k} min={1} max={Math.min(12, input.length)} onChange={setK} />
          ) : (
            <>
              <NumberInput
                label={sums ? 'Target sum' : 'Target'}
                value={sums ? sumTarget : target}
                min={0}
                max={999}
                onChange={sums ? setSumTarget : setTarget}
              />
              <Button onClick={() => (sums ? setSumTarget : setTarget)(presentTarget(input, sums))}>
                <Dices size={14} /> Pick a present value
              </Button>
              <Button onClick={() => (sums ? setSumTarget : setTarget)(missingTarget(input, sums))}>
                <SearchX size={14} /> Pick a missing value
              </Button>
            </>
          )}
          <Button onClick={() => regenerate()}>
            <Shuffle size={14} /> Shuffle
          </Button>
          {runner.sorted && (
            <p className="basis-full text-xs text-mist">
              This algorithm relies on the array being sorted, so the same values are shown in ascending order.
            </p>
          )}
        </>
      }
    />
  );
}

function describe(answer, runner, k) {
  if (runner.usesK) return answer ? `${answer.start}..${answer.start + k - 1}` : '–';
  if (runner.usesSum) return answer ? `Indices ${answer[0]}, ${answer[1]}` : 'No pair';
  return answer >= 0 ? `Index ${answer}` : 'Not found';
}

function StageLoading() {
  return <div className="absolute inset-0 grid place-items-center text-sm text-mist">Loading 3D scene…</div>;
}
