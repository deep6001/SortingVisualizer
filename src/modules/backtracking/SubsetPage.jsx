import { useMemo, useState } from 'react';
import { Shuffle } from 'lucide-react';
import usePlayer from '../../core/usePlayer';
import { blip } from '../../core/audio';
import { palette } from '../../core/theme';
import VisualizerLayout from '../../core/ui/VisualizerLayout';
import { Button, Segmented, Slider } from '../../core/ui/controls';
import { layoutTree, solveSubset, subsetCode } from './solvers';
import { Field } from './shared';

const legend = [
  { color: palette.amber, label: 'Current node' },
  { color: palette.sky, label: 'On the current path' },
  { color: palette.coral, label: 'Pruned' },
  { color: palette.mint, label: 'Hits the target' },
];

const MAX_ITEMS = 6;
const rand = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
const parseItems = (t) =>
  t
    .split(/[\s,]+/)
    .map(Number)
    .filter((x) => Number.isFinite(x) && x > 0)
    .map((x) => Math.min(30, Math.round(x)))
    .slice(0, MAX_ITEMS);

export default function SubsetPage({ meta, algo }) {
  const [items, setItems] = useState([3, 34, 4, 12, 5, 2]);
  const [target, setTarget] = useState(9);
  const [all, setAll] = useState(false);
  const [ver, setVer] = useState(0);
  const run = useMemo(() => solveSubset(items, target, { all }), [items, target, all]);
  const layout = useMemo(() => layoutTree(run.nodes), [run]);
  const player = usePlayer(run.steps, {
    initialSpeed: 4,
    onStep: (s) => {
      if (s?.kind === 'visit') blip(0.2 + (run.nodes[s.cur].depth / items.length) * 0.7, { gain: 0.03 });
      else if (s?.kind === 'prune') blip(0.05, { type: 'square', gain: 0.02 });
      else if (s?.kind === 'solution') blip(1, { duration: 0.2, gain: 0.05 });
    },
  });
  const step = player.step;

  const randomize = () => {
    const next = Array.from({ length: rand(4, MAX_ITEMS) }, () => rand(1, 15));
    setItems(next);
    setTarget(Math.max(1, next.filter(() => Math.random() < 0.5).reduce((a, b) => a + b, 0) || next[0]));
    setVer((v) => v + 1);
  };

  return (
    <VisualizerLayout
      module={meta}
      algo={algo}
      player={player}
      stage={<DecisionTree run={run} layout={layout} step={step} items={items} target={target} />}
      code={subsetCode}
      line={step?.line}
      message={step?.msg}
      legend={legend}
      stats={[
        { label: 'Nodes visited', value: step?.stats.nodes ?? 0, tone: 'text-amber' },
        { label: 'Pruned', value: step?.stats.pruned ?? 0, tone: 'text-coral' },
        { label: 'Subsets found', value: step?.stats.solutions ?? 0, tone: 'text-mint' },
        { label: 'Full tree', value: `${2 ** (items.length + 1) - 1} nodes` },
      ]}
      controls={
        <>
          <label className="flex min-w-[200px] flex-col gap-1.5 text-xs text-mist">
            Numbers (up to {MAX_ITEMS}, 1–30)
            <input
              key={ver}
              defaultValue={items.join(' ')}
              onChange={(e) => {
                const next = parseItems(e.target.value);
                if (next.length) setItems(next);
              }}
              className="h-9 rounded-md border border-input bg-background/60 px-3 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm text-paper focus:border-primary/60"
            />
          </label>
          <Slider label="Target" value={target} min={1} max={60} onChange={setTarget} />
          <Field label="Search">
            <Segmented
              size="sm"
              label="Search"
              value={all ? 'all' : 'first'}
              onChange={(v) => setAll(v === 'all')}
              options={[
                { value: 'first', label: 'Stop at first' },
                { value: 'all', label: 'Find all' },
              ]}
            />
          </Field>
          <Button onClick={randomize}>
            <Shuffle size={14} /> Random
          </Button>
        </>
      }
    />
  );
}

const DX = 56;
const DY = 74;
const R = 17;

function DecisionTree({ run, layout, step, items, target }) {
  if (!step) return null;
  const { nodes } = run;
  const visible = nodes.slice(0, step.count);
  const onPath = new Set(step.pathIds);
  // solution nodes and their ancestors draw mint
  const good = new Set();
  visible.forEach((nd) => {
    if (step.status[nd.id] !== 'solution') return;
    for (let id = nd.id; id != null; id = nodes[id].parent) good.add(id);
  });
  const W = layout.width * DX + 120;
  const H = (items.length + 1) * DY + 40;
  const px = (id) => 110 + layout.x[id] * DX + DX / 2;
  const py = (d) => 30 + d * DY;

  return (
    <div className="absolute inset-0 px-2 pb-12 pt-14">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        {items.map((v, d) => (
          <text key={d} x={8} y={py(d) + DY / 2 + 4} className="font-mono" fontSize={13} fill={palette.mist}>
            use {v}?
          </text>
        ))}
        <text x={W - 10} y={20} textAnchor="end" fontSize={14} fill={palette.paper} className="font-display">
          target {target}
        </text>
        {visible.map((nd) => {
          if (nd.parent == null) return null;
          const p = nodes[nd.parent];
          const st = step.status[nd.id];
          const color = good.has(nd.id) ? palette.mint : st === 'pruned' ? palette.coral : onPath.has(nd.id) ? palette.sky : palette.line;
          const x1 = px(p.id);
          const y1 = py(p.depth) + R;
          const x2 = px(nd.id);
          const y2 = py(nd.depth) - R;
          return (
            <g key={`e${nd.id}`}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={onPath.has(nd.id) || good.has(nd.id) ? 2.5 : 1.5} strokeDasharray={nd.edge === 'out' ? '5 4' : undefined} />
              <text x={(x1 + x2) / 2 + (nd.edge === 'in' ? -8 : 8)} y={(y1 + y2) / 2} textAnchor={nd.edge === 'in' ? 'end' : 'start'} fontSize={11} fill={nd.edge === 'in' ? palette.sky : palette.mist} className="font-mono">
                {nd.edge === 'in' ? `+${nd.item}` : 'skip'}
              </text>
            </g>
          );
        })}
        {visible.map((nd) => {
          const st = step.status[nd.id];
          const isCur = nd.id === step.cur;
          let fill = palette.panel;
          let stroke = palette.line;
          let text = palette.mist;
          if (onPath.has(nd.id)) [fill, stroke, text] = ['#313148', palette.sky, palette.paper];
          if (st === 'pruned') [fill, stroke, text] = ['#3a1f2a', palette.coral, palette.coral];
          if (st === 'solution' || good.has(nd.id)) [fill, stroke, text] = [st === 'solution' ? palette.mint : '#173d36', palette.mint, st === 'solution' ? palette.deep : palette.mint];
          if (isCur && st !== 'solution') [fill, stroke, text] = [palette.amber, palette.amber, palette.deep];
          return (
            <g key={`n${nd.id}`} transform={`translate(${px(nd.id)},${py(nd.depth)})`}>
              {isCur && <circle r={R + 6} fill="none" stroke={st === 'solution' ? palette.mint : palette.amber} strokeOpacity={0.4} strokeWidth={4} />}
              <circle r={R} fill={fill} stroke={stroke} strokeWidth={2} />
              <text y={4.5} textAnchor="middle" fontSize={13} fontWeight={600} fill={text} className="font-mono">
                {nd.sum}
              </text>
              {st === 'pruned' && (
                <text y={R + 14} textAnchor="middle" fontSize={11} fill={palette.coral}>
                  ✕
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
