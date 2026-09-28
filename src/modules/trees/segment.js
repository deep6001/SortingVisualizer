import { record } from './tracer';

// State: { a: number[], sum: { node: value } } with the usual 1-based layout (children 2k, 2k+1).

export const emptySeg = () => ({ a: [], sum: {} });

function spans(n) {
  const out = [];
  const go = (k, lo, hi, d) => {
    out.push({ k, lo, hi, d });
    if (lo === hi) return;
    const mid = (lo + hi) >> 1;
    go(2 * k, lo, mid, d + 1);
    go(2 * k + 1, mid + 1, hi, d + 1);
  };
  if (n) go(1, 0, n - 1, 0);
  return out;
}

/** Each node sits over the middle of the index range it covers. */
export function segView(s, { hl = {}, arr = {} } = {}) {
  const sp = spans(s.a.length);
  const nodes = sp.map(({ k, lo, hi, d }) => ({
    id: `s${k}`,
    x: (lo + hi) / 2,
    d,
    label: s.sum[k] == null ? '?' : String(s.sum[k]),
    tone: hl[k] ?? (s.sum[k] == null ? 'dim' : 'idle'),
    sub: lo === hi ? `[${lo}]` : `[${lo}..${hi}]`,
  }));
  const edges = sp.filter((x) => x.k > 1).map(({ k }) => ({ from: `s${k >> 1}`, to: `s${k}`, tone: hl[k] && hl[k] !== 'dim' ? 'path' : 'idle' }));
  const array = s.a.map((v, i) => ({ id: i, v, tone: arr[i] ?? 'idle' }));
  return { nodes, edges, width: Math.max(1, s.a.length), depth: Math.max(0, ...sp.map((x) => x.d)), array };
}

const buildCode = [
  'build(node, lo, hi):',
  '  if lo == hi: sum[node] = a[lo]; return',
  '  mid = (lo + hi) / 2',
  '  build(left, lo, mid); build(right, mid+1, hi)',
  '  sum[node] = sum[left] + sum[right]',
];
const queryCode = [
  'query(node, lo, hi, l, r):',
  '  if r < lo or hi < l: return 0            # no overlap',
  '  if l <= lo and hi <= r: return sum[node] # fully inside',
  '  mid = (lo + hi) / 2',
  '  return query(left, ...) + query(right, ...)',
];
const updateCode = [
  'update(node, lo, hi, i, v):',
  '  if lo == hi: sum[node] = v; return',
  '  mid = (lo + hi) / 2',
  '  recurse into the half that contains i',
  '  sum[node] = sum[left] + sum[right]',
];

const range = (lo, hi, tone) => Object.fromEntries(Array.from({ length: hi - lo + 1 }, (_, i) => [lo + i, tone]));

export const segTree = {
  stats: [
    { key: 'visited', label: 'Nodes visited', tone: 'text-amber' },
    { key: 'result', label: 'Result', tone: 'text-mint' },
    { key: 'nodes', label: 'Tree nodes' },
    { key: 'height', label: 'Height', tone: 'text-violet' },
  ],
  code: { build: buildCode, query: queryCode, update: updateCode },
  empty: emptySeg,
  view: segView,
  run(state, op, arg) {
    const s = { a: op === 'build' ? [...arg] : [...state.a], sum: op === 'build' ? {} : { ...state.sum } };
    const n = s.a.length;
    const done = {};
    const { steps } = record(
      (o) => segView(s, o),
      (t) => {
        if (op === 'build') {
          t.snap(0, `Build a sum tree over ${n} values. Each node will hold the sum of its range.`);
          const build = (k, lo, hi) => {
            t.stats.visited++;
            if (lo === hi) {
              s.sum[k] = s.a[lo];
              done[k] = 'done';
              t.snap(1, `Leaf [${lo}] just copies a[${lo}] = ${s.a[lo]}.`, { hl: { ...done, [k]: 'found' }, arr: { [lo]: 'cmp' } });
              return;
            }
            const mid = (lo + hi) >> 1;
            t.snap(2, `Node [${lo}..${hi}] splits at ${mid}: build both halves first.`, { hl: { ...done, [k]: 'cmp' }, arr: range(lo, hi, 'path') });
            build(2 * k, lo, mid);
            build(2 * k + 1, mid + 1, hi);
            s.sum[k] = s.sum[2 * k] + s.sum[2 * k + 1];
            done[k] = 'done';
            t.snap(4, `[${lo}..${hi}] = ${s.sum[2 * k]} + ${s.sum[2 * k + 1]} = ${s.sum[k]}.`, { hl: { ...done, [k]: 'found' }, arr: range(lo, hi, 'path') });
          };
          build(1, 0, n - 1);
          t.stats.result = s.sum[1];
          t.snap(null, `Built. The root holds the total, ${s.sum[1]}.`);
          return;
        }
        if (op === 'query') {
          const [l, r] = arg;
          const hl = {};
          t.snap(0, `Sum of a[${l}..${r}]. Start at the root.`, { arr: range(l, r, 'key') });
          const q = (k, lo, hi) => {
            t.stats.visited++;
            if (r < lo || hi < l) {
              hl[k] = 'dim';
              t.snap(1, `[${lo}..${hi}] is outside [${l}..${r}]: contributes 0.`, { hl: { ...hl }, arr: range(l, r, 'key') });
              return 0;
            }
            if (l <= lo && hi <= r) {
              hl[k] = 'found';
              t.snap(2, `[${lo}..${hi}] lies fully inside [${l}..${r}]: use its stored sum ${s.sum[k]} without going deeper.`, { hl: { ...hl }, arr: { ...range(l, r, 'key'), ...range(lo, hi, 'found') } });
              return s.sum[k];
            }
            hl[k] = 'cmp';
            t.snap(3, `[${lo}..${hi}] partly overlaps. Ask both children.`, { hl: { ...hl }, arr: range(l, r, 'key') });
            hl[k] = 'path';
            const mid = (lo + hi) >> 1;
            const v = q(2 * k, lo, mid) + q(2 * k + 1, mid + 1, hi);
            t.snap(4, `[${lo}..${hi}] returns ${v}.`, { hl: { ...hl, [k]: 'cmp' }, arr: range(l, r, 'key') });
            return v;
          };
          const v = q(1, 0, n - 1);
          t.stats.result = v;
          t.snap(null, `The sum of a[${l}..${r}] is ${v}, found by visiting ${t.stats.visited} of ${2 * n - 1} nodes.`, { hl, arr: range(l, r, 'found') });
          return;
        }
        // point update
        const [i, v] = arg;
        const hl = {};
        t.snap(0, `Set a[${i}] = ${v} and fix every sum that covers index ${i}.`, { arr: { [i]: 'key' } });
        const u = (k, lo, hi) => {
          t.stats.visited++;
          if (lo === hi) {
            s.a[i] = v;
            s.sum[k] = v;
            hl[k] = 'found';
            t.snap(1, `Leaf [${i}] becomes ${v}.`, { hl: { ...hl }, arr: { [i]: 'found' } });
            return;
          }
          const mid = (lo + hi) >> 1;
          hl[k] = 'cmp';
          t.snap(3, `${i} is in the ${i <= mid ? 'left' : 'right'} half of [${lo}..${hi}].`, { hl: { ...hl }, arr: { [i]: 'key' } });
          hl[k] = 'path';
          if (i <= mid) u(2 * k, lo, mid);
          else u(2 * k + 1, mid + 1, hi);
          s.sum[k] = s.sum[2 * k] + s.sum[2 * k + 1];
          hl[k] = 'found';
          t.snap(4, `Recompute [${lo}..${hi}] = ${s.sum[2 * k]} + ${s.sum[2 * k + 1]} = ${s.sum[k]}.`, { hl: { ...hl }, arr: { [i]: 'found' } });
        };
        u(1, 0, n - 1);
        t.stats.result = s.sum[1];
        t.snap(null, `Done. Only ${t.stats.visited} nodes changed; the total is now ${s.sum[1]}.`, { hl });
      },
      { visited: 0, result: 0 },
    );
    return { steps, state: s };
  },
};
