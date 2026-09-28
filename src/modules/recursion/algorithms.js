// Recursive algorithms recorded as step traces. No JSX here, so node can test it.

export const PEG = ['A', 'B', 'C'];

/* ---------- Tower of Hanoi ---------- */
// step: { pegs: [[disk, ...] x3] bottom first, move: { disk, from, to } | null,
//         stack: [{ k, from, to, via, at }], line, msg, stats }

export const hanoiCode = [
  'hanoi(n, from, to, via):',
  '  if n == 1:',
  '    move disk 1 from → to; return',
  '  hanoi(n - 1, from, via, to)     # park the smaller disks',
  '  move disk n from → to',
  '  hanoi(n - 1, via, to, from)     # stack them back on top',
  '  return',
];

export function hanoiTrace(n) {
  const pegs = [Array.from({ length: n }, (_, i) => n - i), [], []];
  const stack = [];
  const steps = [];
  const stats = { moves: 0, calls: 0, maxDepth: 0 };
  const snap = (line, msg, move = null) =>
    steps.push({
      pegs: pegs.map((p) => [...p]),
      move,
      stack: stack.map((f) => ({ ...f })),
      line,
      msg,
      stats: { ...stats, depth: stack.length },
    });

  const move = (disk, from, to, line, msg) => {
    const d = pegs[from].pop();
    const below = pegs[to][pegs[to].length - 1];
    if (d !== disk || (below != null && below < d)) throw new Error(`Illegal move of disk ${disk}`);
    pegs[to].push(d);
    stats.moves++;
    snap(line, msg, { disk, from, to });
  };

  const hanoi = (k, from, to, via) => {
    const frame = { k, from, to, via, at: 0 };
    stack.push(frame);
    stats.calls++;
    stats.maxDepth = Math.max(stats.maxDepth, stack.length);
    snap(
      0,
      k === 1
        ? `hanoi(1, ${PEG[from]}, ${PEG[to]}, ${PEG[via]}): just one disk to move.`
        : `hanoi(${k}, ${PEG[from]}, ${PEG[to]}, ${PEG[via]}): move the top ${k} disks from ${PEG[from]} to ${PEG[to]}, with ${PEG[via]} as the spare.`,
    );
    if (k === 1) {
      frame.at = 2;
      move(1, from, to, 2, `Base case: move disk 1 from ${PEG[from]} to ${PEG[to]}.`);
      stack.pop();
      return;
    }
    frame.at = 3;
    hanoi(k - 1, from, via, to);
    frame.at = 4;
    move(k, from, to, 4, `The ${k - 1} smaller disk${k > 2 ? 's are' : ' is'} parked on ${PEG[via]}, so disk ${k} goes straight from ${PEG[from]} to ${PEG[to]}.`);
    frame.at = 5;
    hanoi(k - 1, via, to, from);
    frame.at = 6;
    stack.pop();
    snap(6, `hanoi(${k}, ${PEG[from]}, ${PEG[to]}, ${PEG[via]}) returns: disks 1 to ${k} now sit on ${PEG[to]}.`);
  };

  snap(null, `${n} disks on peg A. Move them all to C, one at a time, never putting a larger disk on a smaller one.`);
  hanoi(n, 0, 2, 1);
  snap(null, `Solved in ${stats.moves} moves, which is 2^${n} − 1. Each extra disk doubles the work.`);
  return steps;
}

/* ---------- call trees ---------- */
// step: { count, status[], values[], stack[], line, msg, stats, out[], extra..., tree }
// status: active | waiting | done | memo

export function createCallTracer() {
  const nodes = [];
  const status = [];
  const values = [];
  const stack = [];
  const steps = [];
  const out = [];
  const stats = { calls: 0, hits: 0, repeats: 0, maxDepth: 0 };
  let extra = () => ({});

  const snap = (line, msg) =>
    steps.push({
      count: nodes.length,
      status: [...status],
      values: [...values],
      stack: [...stack],
      line,
      msg,
      stats: { ...stats, depth: stack.length },
      out: [...out],
      ...extra(),
    });

  const add = (label, edge, dup) => {
    const parent = stack.length ? stack[stack.length - 1] : null;
    const id = nodes.length;
    nodes.push({ id, parent, depth: stack.length, label, edge, dup: !!dup });
    values.push(null);
    return id;
  };

  return {
    nodes,
    stats,
    setExtra(fn) {
      extra = fn;
    },
    call(label, { line = 0, msg, edge, dup } = {}) {
      const id = add(label, edge, dup);
      if (stack.length) status[stack[stack.length - 1]] = 'waiting';
      status[id] = 'active';
      stack.push(id);
      stats.calls++;
      if (dup) stats.repeats++;
      stats.maxDepth = Math.max(stats.maxDepth, stack.length);
      snap(line, msg ?? `Call ${label}.`);
      return id;
    },
    ret(value, { line, msg } = {}) {
      const id = stack.pop();
      status[id] = 'done';
      values[id] = value;
      if (stack.length) status[stack[stack.length - 1]] = 'active';
      snap(line, msg ?? `${nodes[id].label} returns ${value}.`);
      return value;
    },
    memo(label, value, { line, msg, edge } = {}) {
      const id = add(label, edge);
      status[id] = 'memo';
      values[id] = value;
      stats.hits++;
      snap(line, msg);
    },
    output(x) {
      out.push(x);
    },
    step(line, msg) {
      snap(line, msg);
    },
    finish(msg) {
      snap(null, msg);
      const tree = layoutTree(nodes);
      steps.forEach((s) => (s.tree = tree));
      return steps;
    },
  };
}

/** Tidy layout: leaves get consecutive columns, parents sit over the middle of their children. */
export function layoutTree(nodes) {
  const kids = nodes.map(() => []);
  nodes.forEach((n) => n.parent != null && kids[n.parent].push(n.id));
  const x = new Array(nodes.length).fill(0);
  let leaf = 0;
  const place = (id) => {
    if (!kids[id].length) {
      x[id] = leaf++;
      return;
    }
    kids[id].forEach(place);
    x[id] = (x[kids[id][0]] + x[kids[id][kids[id].length - 1]]) / 2;
  };
  if (nodes.length) place(0);
  const depth = nodes.reduce((m, n) => Math.max(m, n.depth), 0);
  return { nodes, x, leaves: Math.max(1, leaf), depth };
}

export const fibCode = {
  naive: ['fib(n):', '  if n <= 1: return n', '  return fib(n - 1) + fib(n - 2)'],
  memo: [
    'fib(n):',
    '  if n in memo: return memo[n]',
    '  if n <= 1: return n',
    '  memo[n] = fib(n - 1) + fib(n - 2)',
    '  return memo[n]',
  ],
};

export function fibTrace(n, memoize) {
  const t = createCallTracer();
  const memo = new Map();
  const seen = new Set();
  if (memoize) t.setExtra(() => ({ table: Array.from({ length: n + 1 }, (_, i) => (memo.has(i) ? memo.get(i) : null)) }));
  t.step(null, memoize
    ? `Compute fib(${n}), saving every answer in a memo so no value is computed twice.`
    : `Compute fib(${n}) the direct way. Watch how often the same call appears.`);

  const fib = (k, edge) => {
    if (memoize && memo.has(k)) {
      t.memo(`f(${k})`, memo.get(k), { line: 1, edge, msg: `fib(${k}) is already in the memo: ${memo.get(k)}. The whole subtree below it is skipped.` });
      return memo.get(k);
    }
    const dup = !memoize && seen.has(k);
    t.call(`f(${k})`, {
      edge,
      dup,
      msg: dup ? `Call fib(${k}) again. It was already computed once; this subtree is repeated work.` : `Call fib(${k}).`,
    });
    if (k <= 1) {
      seen.add(k);
      if (memoize) memo.set(k, k);
      return t.ret(k, { line: memoize ? 2 : 1, msg: `Base case: fib(${k}) = ${k}.` });
    }
    const a = fib(k - 1, 'n-1');
    const b = fib(k - 2, 'n-2');
    seen.add(k);
    if (memoize) memo.set(k, a + b);
    return t.ret(a + b, {
      line: memoize ? 3 : 2,
      msg: `fib(${k}) = fib(${k - 1}) + fib(${k - 2}) = ${a} + ${b} = ${a + b}${memoize ? ', saved to the memo' : ''}.`,
    });
  };

  const r = fib(n);
  const { calls, hits, repeats } = t.stats;
  return t.finish(
    memoize
      ? `fib(${n}) = ${r} with ${calls} real calls and ${hits} memo lookups. Linear, not exponential.`
      : `fib(${n}) = ${r} after ${calls} calls, ${repeats} of them repeating earlier work.`,
  );
}

export const permCode = [
  'permute(prefix, rest):',
  '  if rest is empty:',
  '    output prefix; return',
  '  for each x in rest:',
  '    permute(prefix + x, rest without x)',
];

export function permTrace(n) {
  const letters = 'ABCDE'.slice(0, n).split('');
  const t = createCallTracer();
  t.step(null, `List every ordering of ${letters.join(', ')}. Each level of the tree picks one more letter.`);
  const go = (prefix, rest, edge) => {
    t.call(prefix || '·', {
      line: edge ? 4 : 0,
      edge,
      msg: edge ? `Choose ${edge.slice(1)}: prefix is now "${prefix}", still to place: ${rest.join(', ') || 'nothing'}.` : 'Start with an empty prefix and every letter available.',
    });
    if (!rest.length) {
      t.output(prefix);
      return t.ret('✓', { line: 2, msg: `Nothing left to place: output "${prefix}".` });
    }
    rest.forEach((x) => go(prefix + x, rest.filter((y) => y !== x), `+${x}`));
    return t.ret('', { line: 3, msg: `Every choice after "${prefix || '·'}" has been tried; go back up.` });
  };
  go('', letters);
  return t.finish(`${t.stats.calls} calls produced all ${letters.length}! = ${factorial(letters.length)} orderings.`);
}

export const subsetCode = [
  'subsets(i, chosen):',
  '  if i == n:',
  '    output chosen; return',
  '  subsets(i + 1, chosen + [a[i]])   # take a[i]',
  '  subsets(i + 1, chosen)            # skip a[i]',
];

export function subsetTrace(n) {
  const a = Array.from({ length: n }, (_, i) => i + 1);
  const t = createCallTracer();
  const show = (c) => `{${c.join(',')}}`;
  t.step(null, `Build every subset of {${a.join(', ')}}: at each level, either take the next number or skip it.`);
  const go = (i, chosen, edge, line) => {
    t.call(show(chosen), {
      line,
      edge,
      msg: edge ? `${edge.startsWith('+') ? 'Take' : 'Skip'} ${a[i - 1]}: chosen = ${show(chosen)}.` : 'Start at index 0 with nothing chosen.',
    });
    if (i === n) {
      t.output(show(chosen));
      return t.ret('✓', { line: 2, msg: `All ${n} numbers decided: output ${show(chosen)}.` });
    }
    go(i + 1, [...chosen, a[i]], `+${a[i]}`, 3);
    go(i + 1, chosen, `−${a[i]}`, 4);
    return t.ret('', { line: 4, msg: `Both branches for ${a[i]} are done; go back up.` });
  };
  go(0, [], null, 0);
  return t.finish(`2^${n} = ${2 ** n} subsets, one per leaf.`);
}

export const mergeTreeCode = [
  'mergeSort(a):',
  '  if len(a) <= 1: return a',
  '  mid = len(a) / 2',
  '  left = mergeSort(a[0 .. mid-1])',
  '  right = mergeSort(a[mid .. end])',
  '  return merge(left, right)',
];

export function mergeTreeTrace(input) {
  const t = createCallTracer();
  t.step(null, `Sort [${input.join(' ')}] by splitting it in half until pieces have one element, then merging back up.`);
  const sort = (arr, edge) => {
    t.call(arr.join(' '), { line: edge === 'left' ? 3 : edge === 'right' ? 4 : 0, edge, msg: `mergeSort([${arr.join(' ')}]).` });
    if (arr.length <= 1) return t.ret(arr.join(' '), { line: 1, msg: `One element is already sorted: return [${arr.join(' ')}].` });
    const mid = Math.floor(arr.length / 2);
    const l = sort(arr.slice(0, mid), 'left').split(' ').map(Number);
    const r = sort(arr.slice(mid), 'right').split(' ').map(Number);
    const merged = [];
    let i = 0;
    let j = 0;
    while (i < l.length || j < r.length) merged.push(j >= r.length || (i < l.length && l[i] <= r[j]) ? l[i++] : r[j++]);
    return t.ret(merged.join(' '), { line: 5, msg: `Merge [${l.join(' ')}] and [${r.join(' ')}] into [${merged.join(' ')}].` });
  };
  sort(input);
  return t.finish(`Sorted: [${[...input].sort((x, y) => x - y).join(' ')}]. The tree has ${Math.ceil(Math.log2(input.length))} levels of splitting.`);
}

/* ---------- factorial / call stack ---------- */
// step: { frames: [{ id, n, value, state }], line, msg, stats }
// frame state: active | waiting | returning

export const factCode = ['fact(n):', '  if n <= 1: return 1', '  return n * fact(n - 1)'];

export function factorial(n) {
  return n <= 1 ? 1 : n * factorial(n - 1);
}

export function factTrace(n) {
  const frames = [];
  const steps = [];
  const stats = { calls: 0, maxDepth: 0 };
  const snap = (line, msg) =>
    steps.push({ frames: frames.map((f) => ({ ...f })), line, msg, stats: { ...stats, depth: frames.length } });
  let uid = 0;
  snap(null, `Compute fact(${n}). Each call waits for the one below it, so the frames pile up.`);
  const fact = (k) => {
    if (frames.length) frames[frames.length - 1].state = 'waiting';
    const f = { id: `f${uid++}`, n: k, value: null, state: 'active' };
    frames.push(f);
    stats.calls++;
    stats.maxDepth = Math.max(stats.maxDepth, frames.length);
    snap(0, `Call fact(${k}): a new frame goes on the call stack (depth ${frames.length}).`);
    let v;
    if (k <= 1) {
      v = 1;
      f.value = 1;
      f.state = 'returning';
      snap(1, `Base case: n = ${k}, so fact(${k}) returns 1 without calling anything.`);
    } else {
      snap(2, `fact(${k}) needs fact(${k - 1}) before it can multiply, so it waits.`);
      const below = fact(k - 1);
      f.state = 'returning';
      v = k * below;
      f.value = v;
      snap(2, `fact(${k - 1}) gave back ${below}. fact(${k}) = ${k} × ${below} = ${v}.`);
    }
    frames.pop();
    if (frames.length) frames[frames.length - 1].state = 'active';
    snap(frames.length ? 2 : null, frames.length
      ? `The fact(${k}) frame is popped and hands ${v} to fact(${k + 1}).`
      : `The last frame is popped. fact(${n}) = ${v}.`);
    return v;
  };
  fact(n);
  return steps;
}

/* ---------- flood fill ---------- */
// grid cells: 0 empty, 1 wall, 2 filled
// step: { grid, cur: [r, c] | null, verdict, path: [[r, c]], line, msg, stats }

export const floodCode = [
  'fill(r, c):',
  '  if (r, c) is outside the grid: return',
  '  if grid[r][c] is a wall or already filled: return',
  '  grid[r][c] = filled',
  '  fill(r + 1, c)    # down',
  '  fill(r - 1, c)    # up',
  '  fill(r, c + 1)    # right',
  '  fill(r, c - 1)    # left',
];

export function floodTrace(grid, rows, cols, seed, { maxSteps = 4000 } = {}) {
  const g = [...grid];
  const steps = [];
  const path = [];
  const stats = { calls: 0, filled: 0, maxDepth: 0 };
  const snap = (line, msg, cur = null, verdict = null) =>
    steps.push({ grid: [...g], cur, verdict, path: [...path], line, msg, stats: { ...stats, depth: path.length } });
  snap(null, `Fill the region that contains (${seed[0]}, ${seed[1]}). Each cell calls fill on its four neighbours.`);
  const dirs = [
    [1, 0, 'down'],
    [-1, 0, 'up'],
    [0, 1, 'right'],
    [0, -1, 'left'],
  ];
  const fill = (r, c, dir) => {
    if (steps.length >= maxSteps) return;
    stats.calls++;
    const how = dir ? `Go ${dir}: ` : '';
    if (r < 0 || c < 0 || r >= rows || c >= cols) {
      snap(1, `${how}(${r}, ${c}) is off the grid, return at once.`, null, 'out');
      return;
    }
    const v = g[r * cols + c];
    if (v !== 0) {
      snap(2, `${how}(${r}, ${c}) is ${v === 1 ? 'a wall' : 'already filled'}, return.`, [r, c], v === 1 ? 'wall' : 'filled');
      return;
    }
    path.push([r, c]);
    stats.maxDepth = Math.max(stats.maxDepth, path.length);
    g[r * cols + c] = 2;
    stats.filled++;
    snap(3, `${how}fill (${r}, ${c}). Recursion depth is ${path.length}.`, [r, c], 'fill');
    dirs.forEach(([dr, dc, name]) => fill(r + dr, c + dc, name));
    path.pop();
  };
  fill(seed[0], seed[1], null);
  snap(null, steps.length >= maxSteps ? 'Stopped: this run is too long to animate.' : `Done: ${stats.filled} cells filled with ${stats.calls} calls. Deepest recursion: ${stats.maxDepth} frames.`);
  return steps;
}

export const randomGrid = (rows, cols, density = 0.28) =>
  Array.from({ length: rows * cols }, () => (Math.random() < density ? 1 : 0));
