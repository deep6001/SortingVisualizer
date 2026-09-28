import { useMemo, useState } from 'react';
import { Shuffle } from 'lucide-react';
import meta from './meta';
import {
  fibCode,
  fibTrace,
  mergeTreeCode,
  mergeTreeTrace,
  permCode,
  permTrace,
  subsetCode,
  subsetTrace,
} from './algorithms';
import CallTree2D from './CallTree2D';
import CallStackPanel from './CallStackPanel';
import usePlayer from '../../core/usePlayer';
import { blip } from '../../core/audio';
import VisualizerLayout from '../../core/ui/VisualizerLayout';
import { Button, Segmented, Slider, cx } from '../../core/ui/controls';
import { palette } from '../../core/theme';

const treeLegend = [
  { color: palette.amber, label: 'Running' },
  { color: palette.sky, label: 'Waiting on a child' },
  { color: palette.mint, label: 'Returned' },
  { color: palette.violet, label: 'Memo hit' },
  { color: palette.coral, label: 'Repeated work' },
];

const randomInput = (n) => Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 99));

function Strip({ label, items, tone = 'text-mint', empty }) {
  return (
    <div className="mt-2 flex min-h-[28px] flex-wrap items-center gap-1.5 text-xs">
      <span className="text-mist">{label}</span>
      {items.length === 0 && <span className="text-mist/60">{empty}</span>}
      {items.map((x, i) => (
        <span key={i} className={cx('rounded border border-line bg-panel px-1.5 py-0.5 font-mono', tone)}>
          {x}
        </span>
      ))}
    </div>
  );
}

export default function CallTreePage({ algo }) {
  const kind = algo.id;
  const [mode, setMode] = useState('naive');
  const [n, setN] = useState(kind === 'fibonacci' ? 5 : 3);
  const [input, setInput] = useState(() => randomInput(6));

  const maxN = kind === 'fibonacci' ? (mode === 'memo' ? 12 : 8) : kind === 'merge-tree' ? 8 : 4;
  const steps = useMemo(() => {
    if (kind === 'fibonacci') return fibTrace(Math.min(n, maxN), mode === 'memo');
    if (kind === 'permutations') return permTrace(n);
    if (kind === 'subsets') return subsetTrace(n);
    return mergeTreeTrace(input);
  }, [kind, n, mode, input, maxN]);

  const player = usePlayer(steps, {
    initialSpeed: kind === 'merge-tree' ? 3 : 4,
    onStep: (s) => s && blip(Math.min(1, s.stack.length / 8), { type: 'triangle', gain: 0.03 }),
  });
  const step = player.step;
  const nodes = step?.tree?.nodes ?? [];

  const frameLabel = (node) =>
    kind === 'fibonacci'
      ? `fib(${node.label.slice(2, -1)})`
      : kind === 'permutations'
        ? `permute("${node.label === '·' ? '' : node.label}")`
        : kind === 'subsets'
          ? `subsets(${node.depth}, ${node.label})`
          : `mergeSort([${node.label}])`;
  const frames = (step?.stack ?? []).map((id) => ({ key: id, label: frameLabel(nodes[id]) }));

  const code =
    kind === 'fibonacci' ? fibCode[mode] : kind === 'permutations' ? permCode : kind === 'subsets' ? subsetCode : mergeTreeCode;
  const sx = kind === 'subsets' ? 36 + n * 16 : kind === 'merge-tree' ? 60 : kind === 'permutations' ? 50 : 54;

  let footer = null;
  if (kind === 'fibonacci' && mode === 'memo' && step?.table) {
    footer = (
      <Strip
        label="memo:"
        tone="text-violet"
        items={step.table.map((v, i) => `${i}→${v ?? '·'}`)}
      />
    );
  } else if (kind === 'permutations' || kind === 'subsets') {
    footer = <Strip label="output:" items={step?.out ?? []} empty="nothing yet" />;
  }

  const stats = [
    { label: 'Calls', value: step?.stats.calls ?? 0, tone: 'text-amber' },
    { label: 'Stack depth', value: step?.stats.depth ?? 0, tone: 'text-violet' },
  ];
  if (kind === 'fibonacci') {
    stats.push(
      mode === 'memo'
        ? { label: 'Memo hits', value: step?.stats.hits ?? 0, tone: 'text-violet' }
        : { label: 'Repeated calls', value: step?.stats.repeats ?? 0, tone: 'text-coral' },
      { label: 'Result', value: step?.values?.[0] ?? '—', tone: 'text-mint' },
    );
  } else if (kind === 'merge-tree') {
    stats.push({ label: 'Max depth', value: step?.stats.maxDepth ?? 0 }, { label: 'Elements', value: input.length });
  } else {
    stats.push({ label: 'Outputs', value: step?.out.length ?? 0, tone: 'text-mint' }, { label: 'Max depth', value: step?.stats.maxDepth ?? 0 });
  }

  return (
    <VisualizerLayout
      module={meta}
      algo={algo}
      player={player}
      stage={
        <>
          <CallTree2D step={step} sx={sx} footer={footer} />
          <CallStackPanel frames={frames} max={8} />
        </>
      }
      code={code}
      line={step?.line}
      message={step?.msg}
      legend={kind === 'fibonacci' ? treeLegend : treeLegend.slice(0, 3)}
      stats={stats}
      controls={
        <>
          {kind === 'fibonacci' && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-mist">Strategy</span>
              <Segmented
                size="sm"
                label="Strategy"
                value={mode}
                options={[
                  { value: 'naive', label: 'Naive' },
                  { value: 'memo', label: 'Memoized' },
                ]}
                onChange={(m) => {
                  setMode(m);
                  if (m === 'naive') setN((x) => Math.min(x, 8));
                }}
              />
            </div>
          )}
          {kind === 'merge-tree' ? (
            <>
              <Slider
                label="Elements"
                value={input.length}
                min={2}
                max={8}
                onChange={(k) => setInput(randomInput(k))}
              />
              <Button onClick={() => setInput(randomInput(input.length))}>
                <Shuffle size={14} /> Shuffle
              </Button>
            </>
          ) : (
            <Slider
              label={kind === 'fibonacci' ? 'n' : kind === 'permutations' ? 'Letters' : 'Elements'}
              value={Math.min(n, maxN)}
              min={1}
              max={maxN}
              onChange={setN}
            />
          )}
          <p className="max-w-md flex-[2] text-xs text-mist">
            {kind === 'fibonacci'
              ? mode === 'naive'
                ? 'Dashed coral rings mark calls that recompute something already known. Switch to Memoized to see them vanish.'
                : 'Violet nodes are memo lookups: the answer is already saved, so no subtree grows beneath them.'
              : kind === 'merge-tree'
                ? 'Each node shows the slice it was given; the value under it is what it returns, sorted.'
                : 'Each edge is one choice. Walking back up the tree undoes that choice so the next one can be tried.'}
          </p>
        </>
      }
    />
  );
}
