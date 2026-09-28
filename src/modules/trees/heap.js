import { record } from './tracer';

// State: { kind: 'min' | 'max', a: [{ id, v }], nextId }. Elements keep their id as they move, so swaps animate.

export const emptyHeap = (kind = 'min') => ({ kind, a: [], nextId: 1 });

/** Complete-tree layout: index i sits at depth floor(log2(i+1)), spread evenly across its level. */
export function heapView(s, { hl = {}, ehl = {} } = {}) {
  const n = s.a.length;
  const levels = n ? Math.floor(Math.log2(n)) + 1 : 0;
  const width = 2 ** Math.max(0, levels - 1);
  const nodes = s.a.map((el, i) => {
    const d = Math.floor(Math.log2(i + 1));
    const p = i - (2 ** d - 1);
    return { id: el.id, x: (p + 0.5) * 2 ** (levels - 1 - d) - 0.5, d, label: String(el.v), tone: hl[i] ?? 'idle', sub: `[${i}]` };
  });
  const edges = [];
  for (let i = 1; i < n; i++) edges.push({ from: s.a[(i - 1) >> 1].id, to: s.a[i].id, tone: ehl[i] ?? 'idle' });
  const array = s.a.map((el, i) => ({ id: el.id, v: el.v, tone: hl[i] ?? 'idle' }));
  return { nodes, edges, width: Math.max(1, width), depth: Math.max(0, levels - 1), array };
}

const insertCode = [
  'a.append(key); i = last index',
  'while i > 0:',
  '  p = (i - 1) / 2',
  '  if a[i] beats a[p]: swap(a[i], a[p]); i = p',
  '  else: stop',
  'heap property holds again',
];
const extractCode = [
  'top = a[0]',
  'move the last element to the root',
  'i = 0',
  'while i has a child:',
  '  c = the child that beats the other',
  '  if a[c] beats a[i]: swap(a[i], a[c]); i = c',
  '  else: stop',
  'return top',
];

export const heapTree = {
  stats: [
    { key: 'cmp', label: 'Comparisons', tone: 'text-amber' },
    { key: 'swaps', label: 'Swaps', tone: 'text-coral' },
    { key: 'nodes', label: 'Size' },
    { key: 'height', label: 'Height', tone: 'text-violet' },
  ],
  code: { insert: insertCode, delete: extractCode },
  empty: emptyHeap,
  view: heapView,
  run(state, op, key) {
    const s = { ...state, a: state.a.map((x) => ({ ...x })) };
    const min = s.kind === 'min';
    const beats = (x, y) => (min ? x < y : x > y);
    const word = min ? 'smaller' : 'larger';
    const a = s.a;
    const { steps } = record(
      (o) => heapView(s, o),
      (t) => {
        const swap = (i, j) => {
          [a[i], a[j]] = [a[j], a[i]];
          t.stats.swaps++;
        };
        if (op === 'insert') {
          a.push({ id: s.nextId++, v: key });
          let i = a.length - 1;
          t.snap(0, `Append ${key} at index ${i}, the next free spot in the bottom level.`, { hl: { [i]: 'key' } });
          while (i > 0) {
            const p = (i - 1) >> 1;
            t.stats.cmp++;
            t.snap(2, `Compare ${a[i].v} with its parent ${a[p].v} at index ${p}.`, { hl: { [i]: 'key', [p]: 'cmp' }, ehl: { [i]: 'path' } });
            if (!beats(a[i].v, a[p].v)) {
              t.snap(4, `${a[i].v} is not ${word} than ${a[p].v}, so it stays. Sift-up is done.`, { hl: { [i]: 'found', [p]: 'cmp' } });
              break;
            }
            swap(i, p);
            t.snap(3, `${a[p].v} is ${word}, so swap it up to index ${p}.`, { hl: { [p]: 'key', [i]: 'remove' }, ehl: { [i]: 'path' } });
            i = p;
          }
          t.snap(5, `Done. The ${min ? 'smallest' : 'largest'} value, ${a[0].v}, is at the root.`, { hl: { 0: 'found' } });
          return;
        }
        // extract the root
        if (!a.length) {
          t.snap(null, 'The heap is empty. Insert something first.');
          return;
        }
        const top = a[0].v;
        t.snap(0, `The root ${top} is the ${min ? 'minimum' : 'maximum'}. Take it out.`, { hl: { 0: 'remove' } });
        if (a.length === 1) {
          a.pop();
          t.snap(7, `Return ${top}. The heap is now empty.`);
          return;
        }
        swap(0, a.length - 1);
        t.snap(1, `Swap the last element ${a[0].v} up to the root.`, { hl: { 0: 'key', [a.length - 1]: 'remove' } });
        a.pop();
        t.snap(1, `Drop ${top} off the end. Now sift ${a[0].v} down.`, { hl: { 0: 'key' } });
        let i = 0;
        for (;;) {
          const l = 2 * i + 1;
          const r = l + 1;
          if (l >= a.length) {
            t.snap(3, `${a[i].v} has no children, so it has reached the bottom.`, { hl: { [i]: 'found' } });
            break;
          }
          let c = l;
          if (r < a.length) {
            t.stats.cmp++;
            if (beats(a[r].v, a[l].v)) c = r;
          }
          t.snap(4, r < a.length ? `The ${word} child of ${a[i].v} is ${a[c].v}.` : `${a[i].v} has one child, ${a[c].v}.`, { hl: { [i]: 'key', [l]: 'cmp', ...(r < a.length ? { [r]: 'cmp' } : {}), [c]: 'cmp' }, ehl: { [c]: 'path' } });
          t.stats.cmp++;
          if (!beats(a[c].v, a[i].v)) {
            t.snap(6, `${a[c].v} is not ${word} than ${a[i].v}, so stop here.`, { hl: { [i]: 'found' } });
            break;
          }
          swap(i, c);
          t.snap(5, `Swap ${a[i].v} and ${a[c].v}.`, { hl: { [c]: 'key', [i]: 'remove' }, ehl: { [c]: 'path' } });
          i = c;
        }
        t.snap(7, `Return ${top}. The new root is ${a[0].v}.`, { hl: { 0: 'found' } });
      },
      { cmp: 0, swaps: 0 },
    );
    return { steps, state: s };
  },
  build(values, kind = 'min') {
    let st = emptyHeap(kind);
    for (const v of values) st = this.run(st, 'insert', v).state;
    return st;
  },
};
