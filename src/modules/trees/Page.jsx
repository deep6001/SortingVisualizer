import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Dices, Minus, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import meta from './meta';
import { makeSearchTree, traversalCode, traverse } from './bst';
import { heapTree } from './heap';
import { trieTree, words, WORDS } from './trie';
import { segTree } from './segment';
import { record } from './tracer';
import Tree2D from './Tree2D';
import useAlgo from '../../core/useAlgo';
import usePlayer from '../../core/usePlayer';
import { blip } from '../../core/audio';
import { palette } from '../../core/theme';
import VisualizerLayout from '../../core/ui/VisualizerLayout';
import ViewToggle from '../../core/ui/ViewToggle';
import { Button, NumberInput, Segmented, cx } from '../../core/ui/controls';

const Tree3D = lazy(() => import('./Tree3D'));

const bst = makeSearchTree(false);
const structs = { bst, traversals: bst, avl: makeSearchTree(true), heap: heapTree, trie: trieTree, segment: segTree };
const MAX_NODES = 31;

const legend = [
  { color: palette.amber, label: 'Comparing / current' },
  { color: palette.coral, label: 'Removing / rotating' },
  { color: palette.violet, label: 'Key being placed' },
  { color: palette.mint, label: 'Found / inserted' },
];

const orderOptions = [
  { value: 'in', label: 'In-order' },
  { value: 'pre', label: 'Pre-order' },
  { value: 'post', label: 'Post-order' },
  { value: 'level', label: 'Level-order' },
];

const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
function randomKeys(k, taken = []) {
  const used = new Set(taken);
  const out = [];
  while (out.length < k && used.size < 99) {
    const v = randInt(1, 99);
    if (!used.has(v)) {
      used.add(v);
      out.push(v);
    }
  }
  return out;
}
const randomArray = (n = 8) => Array.from({ length: n }, () => randInt(1, 20));
const keysOf = (id, s) => (id === 'heap' ? s.a.map((x) => x.v) : Object.values(s.nodes).map((n) => n.key));

const still = (struct, state, msg) => record((o) => struct.view(state, o), (t) => t.snap(null, msg)).steps;

function initial(id) {
  const S = structs[id];
  if (id === 'segment') {
    const r = segTree.run(null, 'build', randomArray());
    return { state: r.state, trace: { steps: r.steps, code: segTree.code.build } };
  }
  if (id === 'trie') {
    const st = trieTree.build(['car', 'cart', 'cat', 'do', 'dog', 'tea']);
    return { state: st, trace: { steps: still(S, st, 'A trie holding six words. Double rings mark where a word ends.'), code: trieTree.code.insert } };
  }
  if (id === 'heap') {
    const st = heapTree.build(randomKeys(7), 'min');
    return { state: st, trace: { steps: still(S, st, 'A min-heap with 7 values. The array below is how it is really stored.'), code: heapTree.code.insert } };
  }
  const st = S.build(randomKeys(7));
  if (id === 'traversals') return { state: st, trace: { steps: traverse(st, 'in'), code: traversalCode.in } };
  const msg = id === 'avl' ? 'An AVL tree with 7 keys. Numbers beside nodes are balance factors, h is height.' : 'A BST with 7 random keys. Insert, delete or search to see each step.';
  return { state: st, trace: { steps: still(S, st, msg), code: S.code.insert } };
}

export default function TreesPage() {
  const algo = useAlgo(meta);
  const id = algo.id;
  const S = structs[id];
  const [view, setView] = useState('2d');
  const [store, setStore] = useState(() => Object.fromEntries(Object.keys(structs).map((k) => [k, initial(k)])));
  const [key, setKey] = useState(() => randInt(1, 99));
  const [word, setWord] = useState('card');
  const [order, setOrder] = useState('in');
  const [range, setRange] = useState({ l: 2, r: 5, i: 3, v: 10 });
  const autoplay = useRef(false);

  const { state, trace } = store[id];
  const steps = trace.steps;
  const player = usePlayer(steps, {
    initialSpeed: 2.5,
    onStep: (s) => {
      const hot = s?.nodes.find((n) => n.tone === 'cmp' || n.tone === 'remove' || n.tone === 'found');
      if (hot) blip(Math.min(1, (parseFloat(hot.label) || 50) / 100), { type: hot.tone === 'remove' ? 'square' : 'triangle', gain: 0.03 });
    },
  });
  const step = player.step;

  useEffect(() => {
    if (!autoplay.current) return;
    autoplay.current = false;
    player.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps]);

  const commit = (next, tr) => {
    autoplay.current = tr.steps.length > 1;
    setStore((st) => ({ ...st, [id]: { state: next, trace: tr } }));
  };

  /** Run one or more operations back to back; the final state becomes the input for the next one. */
  const run = (ops) => {
    let st = state;
    let all = [];
    for (const [op, arg] of ops) {
      const r = S.run(st, op, arg);
      all = all.concat(r.steps);
      st = r.state;
    }
    commit(st, { steps: all, code: S.code[ops[0][0]] });
  };

  const count = id === 'trie' ? words(state).length : id === 'segment' ? state.a.length : keysOf(id, state).length;
  const full = id !== 'segment' && id !== 'trie' && count >= MAX_NODES;
  const validKey = key !== '' && key >= 1 && key <= 99;

  const insertKey = () => {
    if (!validKey || full) return;
    run([['insert', key]]);
    setKey(randKeyNotIn());
  };
  const randKeyNotIn = () => randomKeys(1, id === 'trie' || id === 'segment' ? [] : keysOf(id, state))[0] ?? randInt(1, 99);
  const random5 = () => {
    if (id === 'trie') {
      const have = new Set(words(state));
      const pool = WORDS.filter((w) => !have.has(w)).sort(() => Math.random() - 0.5).slice(0, 5);
      if (pool.length) run(pool.map((w) => ['insert', w]));
      return;
    }
    const ks = randomKeys(Math.min(5, MAX_NODES - count), keysOf(id, state));
    if (ks.length) run(ks.map((k) => ['insert', k]));
  };
  const clear = () => {
    const empty = id === 'heap' ? S.empty(state.kind) : S.empty();
    commit(empty, { steps: still(S, empty, 'Cleared. Insert something to start again.'), code: trace.code });
  };
  const runTraversal = (o = order) => commit(state, { steps: traverse(state, o), code: traversalCode[o] });
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '').slice(0, 10);

  const stripCount = (step?.array ? 1 : 0) + (step?.strips?.length ?? 0);
  const stage = (
    <>
      <div className="absolute inset-0 pt-10">
        {view === '2d' ? (
          <Tree2D step={step} reserve={30 + stripCount * 52} />
        ) : (
          <Suspense fallback={<div className="absolute inset-0 grid place-items-center text-sm text-mist">Loading 3D scene…</div>}>
            <Tree3D step={step} />
          </Suspense>
        )}
      </div>
      <BottomStrips step={step} indexed={id === 'heap' || id === 'segment'} />
    </>
  );

  const numberOps = id === 'bst' || id === 'avl' || id === 'traversals' || id === 'heap';
  const stats = [...S.stats];
  if (id === 'traversals') stats.splice(0, stats.length, { key: 'visited', label: 'Visited', tone: 'text-mint' }, { key: 'nodes', label: 'Nodes' }, { key: 'height', label: 'Height', tone: 'text-violet' });

  return (
    <VisualizerLayout
      module={meta}
      algo={algo}
      player={player}
      stage={stage}
      stageBar={<ViewToggle value={view} onChange={setView} modes={['2d', '3d']} />}
      code={trace.code}
      line={step?.line}
      message={step?.msg}
      legend={legend}
      stats={stats.map((x) => ({ label: x.label, value: step?.stats?.[x.key] ?? 0, tone: x.tone }))}
      controls={
        <>
          {numberOps && (
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                insertKey();
              }}
            >
              <NumberInput label="Key (1–99)" value={key} onChange={setKey} min={1} max={99} />
              <Button type="submit" tone="primary" disabled={!validKey || full}>
                <Plus size={14} /> Insert
              </Button>
              {id === 'heap' ? (
                <Button onClick={() => run([['delete']])} disabled={!count}>
                  <Minus size={14} /> Extract {state.kind}
                </Button>
              ) : (
                <>
                  <Button onClick={() => validKey && run([['delete', key]])} disabled={!validKey || !count}>
                    <Minus size={14} /> Delete
                  </Button>
                  {id !== 'traversals' && (
                    <Button onClick={() => validKey && run([['search', key]])} disabled={!validKey}>
                      <Search size={14} /> Search
                    </Button>
                  )}
                </>
              )}
              <Button onClick={random5} disabled={full}>
                <Dices size={14} /> Random insert ×5
              </Button>
              <Button tone="danger" onClick={clear} disabled={!count}>
                <Trash2 size={14} /> Clear
              </Button>
            </form>
          )}

          {id === 'traversals' && (
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-mist">Order</span>
                <Segmented
                  size="sm"
                  label="Traversal order"
                  value={order}
                  options={orderOptions}
                  onChange={(o) => {
                    setOrder(o);
                    runTraversal(o);
                  }}
                />
              </div>
              <Button tone="primary" onClick={() => runTraversal()} disabled={!count}>
                Run traversal
              </Button>
            </div>
          )}

          {id === 'heap' && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-mist">Heap type</span>
              <Segmented
                size="sm"
                label="Heap type"
                value={state.kind}
                options={[
                  { value: 'min', label: 'Min-heap' },
                  { value: 'max', label: 'Max-heap' },
                ]}
                onChange={(kind) => {
                  const st = heapTree.build(state.a.map((x) => x.v), kind);
                  commit(st, { steps: still(S, st, `Rebuilt as a ${kind}-heap: now every parent is ${kind === 'min' ? 'smaller' : 'larger'} than its children.`), code: heapTree.code.insert });
                }}
              />
            </div>
          )}

          {id === 'trie' && (
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (cleanWord) run([['insert', cleanWord]]);
              }}
            >
              <label className="flex flex-col gap-1.5 text-xs text-mist">
                Word or prefix
                <input
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  maxLength={10}
                  placeholder="e.g. card"
                  className="h-9 w-36 rounded-md border border-input bg-background/60 px-3 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm text-paper placeholder:text-mist/60 focus:border-primary/60"
                />
              </label>
              <Button type="submit" tone="primary" disabled={!cleanWord}>
                <Plus size={14} /> Insert
              </Button>
              <Button onClick={() => cleanWord && run([['delete', cleanWord]])} disabled={!cleanWord}>
                <Minus size={14} /> Delete
              </Button>
              <Button onClick={() => cleanWord && run([['search', cleanWord]])} disabled={!cleanWord}>
                <Search size={14} /> Search prefix
              </Button>
              <Button onClick={random5}>
                <Dices size={14} /> Random insert ×5
              </Button>
              <Button tone="danger" onClick={clear}>
                <Trash2 size={14} /> Clear
              </Button>
            </form>
          )}

          {id === 'segment' && <SegmentControls n={state.a.length} range={range} setRange={setRange} run={run} />}

          {full && <p className="text-xs text-amber">The tree is full ({MAX_NODES} nodes). Delete or clear to insert more.</p>}
        </>
      }
    />
  );
}

function SegmentControls({ n, range, setRange, run }) {
  const set = (k) => (v) => setRange((r) => ({ ...r, [k]: v }));
  const clamp = (v) => Math.max(0, Math.min(n - 1, Number(v) || 0));
  const l = clamp(range.l);
  const r = Math.max(l, clamp(range.r));
  return (
    <>
      <div className="flex items-end gap-2">
        <NumberInput label="From l" value={range.l} onChange={set('l')} min={0} max={n - 1} />
        <NumberInput label="To r" value={range.r} onChange={set('r')} min={0} max={n - 1} />
        <Button tone="primary" onClick={() => run([['query', [l, r]]])}>
          <Search size={14} /> Range sum
        </Button>
      </div>
      <div className="flex items-end gap-2">
        <NumberInput label="Index i" value={range.i} onChange={set('i')} min={0} max={n - 1} />
        <NumberInput label="New value" value={range.v} onChange={set('v')} min={0} max={99} />
        <Button onClick={() => run([['update', [clamp(range.i), Math.max(0, Math.min(99, Number(range.v) || 0))]]])}>Update</Button>
      </div>
      <Button onClick={() => run([['build', randomArray()]])}>
        <RefreshCw size={14} /> New array
      </Button>
    </>
  );
}

const cellTone = {
  cmp: 'border-amber bg-amber/20 text-amber',
  path: 'border-amber/50 text-amber',
  remove: 'border-coral bg-coral/20 text-coral',
  key: 'border-violet bg-violet/20 text-violet',
  found: 'border-mint bg-mint/15 text-mint',
  done: 'border-mint/50 text-mint',
};

function BottomStrips({ step, indexed }) {
  if (!step || (!step.array && !step.strips?.length)) return null;
  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex flex-col gap-1.5">
      {step.array && (
        <div className="flex min-w-0 items-center gap-2 rounded bg-deep/75 px-2 py-1 backdrop-blur">
          <span className="w-24 shrink-0 text-[11px] text-mist">Backing array</span>
          <div className="scroll-thin flex min-w-0 flex-1 gap-1 overflow-x-auto pb-0.5">
            {step.array.length === 0 && <span className="text-[11px] text-mist/60">empty</span>}
            {step.array.map((c, i) => (
              <span key={indexed ? `${i}` : c.id} className="flex shrink-0 flex-col items-center">
                <span className={cx('grid h-7 min-w-[28px] place-items-center rounded border px-1 font-mono text-xs transition-colors', cellTone[c.tone] ?? 'border-line text-paper')}>
                  {c.v}
                </span>
                <span className="font-mono text-[9px] text-mist">{i}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      {step.strips?.map((s) => (
        <div key={s.label} className="flex min-w-0 items-center gap-2 rounded bg-deep/75 px-2 py-1 backdrop-blur">
          <span className="w-24 shrink-0 text-[11px] text-mist">{s.label}</span>
          <div className="scroll-thin flex min-h-[22px] min-w-0 flex-1 gap-1 overflow-x-auto">
            {s.items.length === 0 && <span className="self-center text-[11px] text-mist/60">empty</span>}
            {s.items.map((it, i) => (
              <span key={i} className={cx('shrink-0 rounded border px-1.5 py-px font-mono text-[11px]', cellTone[it.tone === 'amber' ? 'cmp' : it.tone === 'mint' ? 'found' : ''] ?? 'border-line text-mist')}>
                {it.t}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
