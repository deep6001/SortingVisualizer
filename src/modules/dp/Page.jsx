import { lazy, Suspense, useMemo, useState } from 'react';
import { Eraser, Plus, Shuffle, X } from 'lucide-react';
import meta from './meta';
import { dpRunners, fmt } from './algorithms';
import useAlgo from '../../core/useAlgo';
import usePlayer from '../../core/usePlayer';
import { blip } from '../../core/audio';
import { palette } from '../../core/theme';
import VisualizerLayout from '../../core/ui/VisualizerLayout';
import ViewToggle from '../../core/ui/ViewToggle';
import { Button, Segmented, Slider } from '../../core/ui/controls';
import DPTable2D from './DPTable2D';
import { heatOf } from './util';

const DPLandscape3D = lazy(() => import('./DPLandscape3D'));

const runnerFor = {
  fibonacci: 'fib',
  'coin-change': 'coins',
  knapsack: 'knapsack',
  lcs: 'lcs',
  'edit-distance': 'edit',
  lis: 'lis',
  'unique-paths': 'paths',
  kadane: 'kadane',
};

const legend = [
  { color: palette.amber, label: 'Computing' },
  { color: palette.violet, label: 'Reads from' },
  { color: palette.sky, label: 'Filled (brighter = larger)' },
  { color: palette.mint, label: 'Traceback / answer' },
];

const MAX_STR = 12;
const MAX_LIST = 12;
const parseList = (text, lo, hi) =>
  text
    .split(/[\s,]+/)
    .filter((s) => s !== '' && s !== '-')
    .map(Number)
    .filter(Number.isFinite)
    .map((x) => Math.max(lo, Math.min(hi, Math.round(x))))
    .slice(0, MAX_LIST);
const cleanWord = (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, MAX_STR);

export default function DPPage() {
  const algo = useAlgo(meta);
  return <DPVisualizer key={algo.id} algo={algo} />;
}

function DPVisualizer({ algo }) {
  const runner = dpRunners[runnerFor[algo.id]];
  const [view, setView] = useState('2d');
  const [input, setInput] = useState(() => runner.defaults());
  // bumped on Random so uncontrolled text fields pick up the new values
  const [ver, setVer] = useState(0);

  const result = useMemo(() => runner.run(input), [runner, input]);
  const player = usePlayer(result.steps, {
    initialSpeed: 4,
    onStep: (s) => {
      const c = s?.cur;
      if (c) blip(heatOf(s.t[c[0]][c[1]], result.range), { gain: 0.03, type: s.path.length ? 'sine' : 'triangle' });
    },
  });
  const step = player.step;
  const code = runner.codeFor ? runner.codeFor(input) : runner.code;

  const randomize = () => {
    setInput(runner.random(input));
    setVer((v) => v + 1);
  };

  const togglePathCell = (r, c) => {
    if ((r === 0 && c === 0) || (r === input.R - 1 && c === input.C - 1)) return;
    const k = `${r},${c}`;
    setInput((p) => ({ ...p, blocked: p.blocked.includes(k) ? p.blocked.filter((x) => x !== k) : [...p.blocked, k] }));
  };

  const stage =
    view === '2d' ? (
      <DPTable2D result={result} step={step} onCellClick={algo.id === 'unique-paths' ? togglePathCell : undefined} />
    ) : (
      <Suspense fallback={<StageLoading />}>
        <DPLandscape3D result={result} step={step} />
      </Suspense>
    );

  const answer = step?.done ? fmt(result.out.value) : '…';

  return (
    <VisualizerLayout
      module={meta}
      algo={algo}
      player={player}
      stage={stage}
      stageBar={<ViewToggle value={view} onChange={setView} modes={['2d', '3d']} />}
      code={code}
      line={step?.line}
      message={step?.msg}
      legend={legend}
      stats={[
        { label: 'Cells filled', value: `${step?.stats.cells ?? 0} / ${result.rows * result.cols}`, tone: 'text-sky' },
        { label: 'Table lookups', value: step?.stats.reads ?? 0, tone: 'text-violet' },
        { label: 'Table size', value: `${result.rows} × ${result.cols}` },
        { label: 'Answer', value: answer, tone: 'text-mint' },
      ]}
      controls={
        <>
          <Inputs id={algo.id} input={input} setInput={setInput} ver={ver} />
          <Button onClick={randomize}>
            <Shuffle size={14} /> Random
          </Button>
        </>
      }
    />
  );
}

function Inputs({ id, input, setInput, ver }) {
  const patch = (p) => setInput((prev) => ({ ...prev, ...p }));
  switch (id) {
    case 'fibonacci':
      return <Slider label="n" value={input.n} min={2} max={18} onChange={(n) => patch({ n })} />;
    case 'coin-change':
      return (
        <>
          <TextField
            key={`c${ver}`}
            label="Coins (up to 5)"
            initial={input.coins.join(' ')}
            placeholder="e.g. 1 2 5"
            onText={(t) => {
              const cs = [...new Set(parseList(t, 1, 20))].sort((a, b) => a - b).slice(0, 5);
              if (cs.length) patch({ coins: cs });
            }}
          />
          <Slider label="Amount" value={input.amount} min={1} max={20} onChange={(amount) => patch({ amount })} />
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-mist">Question</span>
            <Segmented
              size="sm"
              label="Question"
              value={input.mode}
              onChange={(mode) => patch({ mode })}
              options={[
                { value: 'min', label: 'Fewest coins' },
                { value: 'ways', label: 'Number of ways' },
              ]}
            />
          </div>
        </>
      );
    case 'knapsack':
      return <ItemsEditor input={input} patch={patch} />;
    case 'lcs':
    case 'edit-distance':
      return (
        <>
          <TextField key={`a${ver}`} label={`String A (≤ ${MAX_STR})`} initial={input.a} mono onText={(t) => cleanWord(t) && patch({ a: cleanWord(t) })} />
          <TextField key={`b${ver}`} label={`String B (≤ ${MAX_STR})`} initial={input.b} mono onText={(t) => cleanWord(t) && patch({ b: cleanWord(t) })} />
        </>
      );
    case 'lis':
    case 'kadane': {
      const [lo, hi] = id === 'kadane' ? [-99, 99] : [-99, 999];
      return (
        <TextField
          key={`l${ver}`}
          label={`Array (up to ${MAX_LIST} numbers${id === 'kadane' ? ', negatives welcome' : ''})`}
          initial={input.arr.join(' ')}
          wide
          onText={(t) => {
            const arr = parseList(t, lo, hi);
            if (arr.length) patch({ arr });
          }}
        />
      );
    }
    case 'unique-paths': {
      const resize = (R, C) => patch({ R, C, blocked: input.blocked.filter((k) => k.split(',').every((v, i) => +v < (i ? C : R)) && k !== `${R - 1},${C - 1}`) });
      return (
        <>
          <Slider label="Rows" value={input.R} min={2} max={8} onChange={(R) => resize(R, input.C)} />
          <Slider label="Columns" value={input.C} min={2} max={9} onChange={(C) => resize(input.R, C)} />
          <Button tone="ghost" onClick={() => patch({ blocked: [] })}>
            <Eraser size={14} /> Clear blocks
          </Button>
          <p className="self-center text-xs text-mist">Click a cell in 2D to block or unblock it.</p>
        </>
      );
    }
    default:
      return null;
  }
}

/** Uncontrolled text input; remounted (via key) when the value is replaced from outside. */
function TextField({ label, initial, onText, placeholder, mono, wide }) {
  return (
    <label className={`flex flex-col gap-1.5 text-xs text-mist ${wide ? 'min-w-[220px] flex-1' : 'min-w-[150px]'}`}>
      {label}
      <input
        defaultValue={initial}
        placeholder={placeholder}
        onChange={(e) => onText(e.target.value)}
        className={`h-9 rounded-md border border-input bg-background/60 px-3 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm text-paper placeholder:text-mist/60 focus:border-primary/60 ${mono ? 'font-mono uppercase tracking-wider' : ''}`}
      />
    </label>
  );
}

function ItemsEditor({ input, patch }) {
  const { items, cap } = input;
  const setItem = (i, field, raw) => {
    const n = Math.max(1, Math.min(field === 'w' ? 10 : 30, Math.round(Number(raw) || 1)));
    patch({ items: items.map((it, k) => (k === i ? { ...it, [field]: n } : it)) });
  };
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-mist">Items (weight, value)</span>
        <div className="flex flex-wrap gap-1.5">
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-1 rounded-md border border-line bg-panel px-1.5 py-1 text-xs">
              <span className="text-mist">#{i + 1}</span>
              <input aria-label={`Item ${i + 1} weight`} type="number" min={1} max={10} value={it.w} onChange={(e) => setItem(i, 'w', e.target.value)} className="h-7 w-10 rounded-md border border-input bg-background/60 px-1 text-center tabular-nums text-paper" />
              <input aria-label={`Item ${i + 1} value`} type="number" min={1} max={30} value={it.v} onChange={(e) => setItem(i, 'v', e.target.value)} className="h-7 w-10 rounded-md border border-input bg-background/60 px-1 text-center tabular-nums text-amber" />
              {items.length > 1 && (
                <button type="button" aria-label={`Remove item ${i + 1}`} onClick={() => patch({ items: items.filter((_, k) => k !== i) })} className="text-mist hover:text-coral">
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
          {items.length < 6 && (
            <Button tone="ghost" className="h-9" onClick={() => patch({ items: [...items, { w: 2, v: 3 }] })}>
              <Plus size={14} /> Item
            </Button>
          )}
        </div>
      </div>
      <Slider label="Capacity" value={cap} min={1} max={15} onChange={(c) => patch({ cap: c })} />
    </>
  );
}

function StageLoading() {
  return <div className="absolute inset-0 grid place-items-center text-sm text-mist">Loading 3D scene…</div>;
}
