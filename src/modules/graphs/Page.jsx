import { lazy, Suspense, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import meta from './meta';
import { graphRunners, runGraph } from './algorithms';
import { makeGraph, nodeName } from './graph';
import { GROUP_COLORS, graphLegend, fmtDist } from './visual';
import Graph2D from './Graph2D';
import useAlgo from '../../core/useAlgo';
import usePlayer from '../../core/usePlayer';
import { blip } from '../../core/audio';
import VisualizerLayout from '../../core/ui/VisualizerLayout';
import ViewToggle from '../../core/ui/ViewToggle';
import { Button, Select, Slider, cx } from '../../core/ui/controls';

const Graph3D = lazy(() => import('./Graph3D'));

const toneClass = {
  amber: 'border-amber/60 bg-amber/15 text-amber',
  mint: 'border-mint/50 bg-mint/10 text-mint',
  coral: 'border-coral/50 bg-coral/10 text-coral line-through decoration-coral/60',
  violet: 'border-violet/50 bg-violet/10 text-violet',
};

export default function GraphsPage() {
  const algo = useAlgo(meta);
  const runner = graphRunners[algo.id];
  const [view, setView] = useState('3d');
  const [size, setSize] = useState(() => (window.innerWidth < 640 ? 8 : 10));
  const [nonce, setNonce] = useState(0);
  const [start, setStart] = useState(0);

  const maxN = runner.maxNodes ?? 16;
  const n = Math.min(size, maxN);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const graph = useMemo(() => makeGraph(n, runner.kind), [n, runner.kind, nonce]);
  const s = Math.min(start, n - 1);
  const steps = useMemo(() => runGraph(runner, graph, s), [runner, graph, s]);
  const player = usePlayer(steps, {
    initialSpeed: 3,
    onStep: (st) => {
      const i = st?.ns.findIndex((x, k) => (st.hn?.[k] ?? x) === 'current');
      if (i >= 0) blip(i / graph.n, { type: st.he ? 'square' : 'triangle', gain: 0.03 });
    },
  });
  const step = player.step;
  const pick = runner.start ? setStart : undefined;

  const stage = (
    <>
      <div className={cx('absolute inset-0', step?.matrix && 'md:right-[min(46%,420px)]', view === '2d' && 'pt-10')}>
        {view === '2d' ? (
          <Graph2D graph={graph} step={step} start={s} onPick={pick} />
        ) : (
          <Suspense fallback={<StageLoading />}>
            <Graph3D graph={graph} step={step} start={s} onPick={pick} />
          </Suspense>
        )}
      </div>
      {step?.matrix && <MatrixPanel m={step.matrix} n={graph.n} />}
      {step?.strips?.length > 0 && <Strips strips={step.strips} />}
    </>
  );

  return (
    <VisualizerLayout
      module={meta}
      algo={algo}
      player={player}
      stage={stage}
      stageBar={<ViewToggle value={view} onChange={setView} modes={['2d', '3d']} />}
      code={runner.code}
      line={step?.line}
      message={step?.msg}
      legend={graphLegend(algo.id)}
      stats={[...runner.stats.map((x) => ({ label: x.label, value: step?.stats[x.key] ?? 0, tone: x.tone })), { label: 'Nodes / edges', value: `${graph.n} / ${graph.edges.length}` }]}
      controls={
        <>
          <Slider
            label={runner.maxNodes ? `Nodes (max ${maxN} here)` : 'Nodes'}
            value={n}
            min={6}
            max={maxN}
            onChange={setSize}
          />
          {runner.start && (
            <Select
              label="Start node"
              value={s}
              onChange={(v) => setStart(Number(v))}
              options={Array.from({ length: n }, (_, i) => ({ value: i, label: nodeName(i) }))}
            />
          )}
          <Button onClick={() => setNonce((x) => x + 1)}>
            <RefreshCw size={14} /> New graph
          </Button>
          <p className="max-w-xs text-xs text-mist">
            {graph.kind === 'undirected' && 'Undirected, weighted graph.'}
            {graph.kind === 'dag' && 'Directed acyclic graph: every edge points left to right.'}
            {graph.kind === 'directed' && 'Directed graph with random edge directions, so cycles appear.'}
            {graph.kind === 'negative' && 'Directed graph with some negative weights (in coral) but no negative cycle.'}
            {runner.start && ' Click a node to make it the start.'}
            {view === '3d' && ' Drag nodes to pull them around.'}
          </p>
        </>
      }
    />
  );
}

function Strips({ strips }) {
  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex flex-col gap-1.5">
      {strips.map((s) => (
        <div key={s.label} className="flex min-w-0 items-center gap-2 rounded bg-deep/75 px-2 py-1 backdrop-blur">
          <span className="w-36 shrink-0 text-[11px] text-mist">{s.label}</span>
          <div className="scroll-thin flex min-h-[22px] min-w-0 flex-1 gap-1 overflow-x-auto">
            {s.items.length === 0 && <span className="self-center text-[11px] text-mist/60">empty</span>}
            {s.items.map((it, i) => (
              <span
                key={i}
                className={cx('shrink-0 rounded border px-1.5 py-px font-mono text-[11px]', toneClass[it.tone] ?? 'border-line text-mist')}
                style={it.group != null ? { borderColor: GROUP_COLORS[it.group], color: GROUP_COLORS[it.group] } : undefined}
              >
                {it.t}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MatrixPanel({ m, n }) {
  const { d, k, i, j, hit } = m;
  return (
    <div className="absolute inset-x-3 top-12 z-10 max-h-[45%] overflow-auto rounded-lg border border-white/10 bg-black/85 shadow-lg p-2 backdrop-blur md:inset-x-auto md:bottom-3 md:right-3 md:max-h-none md:w-[min(46%,410px)]">
      <p className="mb-1 text-[11px] text-mist">
        dist[i][j]{k >= 0 && <span className="text-violet"> · via {nodeName(k)}</span>}
      </p>
      <table className="w-full border-collapse font-mono text-[11px] tabular-nums">
        <thead>
          <tr>
            <th className="w-6" />
            {Array.from({ length: n }, (_, c) => (
              <th key={c} className={cx('px-0.5 py-0.5 font-normal', c === k ? 'text-violet' : c === j ? 'text-amber' : 'text-mist')}>
                {nodeName(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {d.map((row, r) => (
            <tr key={r}>
              <th className={cx('pr-1 text-right font-normal', r === k ? 'text-violet' : r === i ? 'text-amber' : 'text-mist')}>{nodeName(r)}</th>
              {row.map((v, c) => {
                const cur = r === i && c === j;
                const feed = (r === i && c === k) || (r === k && c === j);
                return (
                  <td
                    key={c}
                    className={cx(
                      'border border-line/60 px-0.5 py-0.5 text-center transition-colors',
                      cur && hit && 'bg-coral/30 text-paper',
                      cur && !hit && 'bg-amber/25 text-paper',
                      !cur && feed && 'bg-violet/20 text-violet',
                      !cur && !feed && (r === k || c === k) && 'bg-violet/5',
                      !cur && !feed && (v === Infinity ? 'text-line' : 'text-paper/80'),
                    )}
                  >
                    {fmtDist(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StageLoading() {
  return <div className="absolute inset-0 grid place-items-center text-sm text-mist">Loading 3D scene…</div>;
}
