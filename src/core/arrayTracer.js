/**
 * Records array operations as replayable steps.
 *
 * step shape:
 *   a       array snapshot
 *   line    active pseudocode line (0-based)
 *   msg     narration
 *   cmp     indices being compared / read
 *   swp     indices swapped (renderers animate these as a fly-over)
 *   wr      index written
 *   sorted  indices in their final position
 *   marks   persistent highlights: { pivot, range: [lo, hi], ptr: {name: index}, aux: {label, values, hi} }
 *   stats   { cmp, swaps, writes }
 */
export function createArrayTracer(input, { maxSteps = 60000 } = {}) {
  const a = [...input];
  const steps = [];
  const stats = { cmp: 0, swaps: 0, writes: 0 };
  const sorted = new Set();
  let marks = {};
  const max = Math.max(1, ...a);

  const snap = (line, msg, extra = {}) => {
    if (steps.length >= maxSteps) throw new TraceLimit();
    steps.push({
      a: [...a],
      line,
      msg,
      sorted: [...sorted],
      marks: { ...marks, aux: marks.aux && { ...marks.aux, values: [...marks.aux.values] } },
      stats: { ...stats },
      max,
      ...extra,
    });
  };

  const t = {
    a,
    steps,
    stats,
    get n() {
      return a.length;
    },
    /** compare a[i] with a[j]; returns a[i] - a[j] */
    cmp(i, j, line, msg) {
      stats.cmp++;
      snap(line, msg ?? `Compare ${a[i]} (index ${i}) with ${a[j]} (index ${j}).`, { cmp: [i, j] });
      return a[i] - a[j];
    },
    /** compare a[i] against a held value; returns a[i] - v */
    cmpVal(i, v, line, msg) {
      stats.cmp++;
      snap(line, msg ?? `Compare ${a[i]} with ${v}.`, { cmp: [i] });
      return a[i] - v;
    },
    /** look at an element without counting a comparison */
    read(i, line, msg) {
      snap(line, msg ?? `Read ${a[i]} at index ${i}.`, { cmp: [i] });
      return a[i];
    },
    swap(i, j, line, msg) {
      if (i === j) return;
      stats.swaps++;
      [a[i], a[j]] = [a[j], a[i]];
      snap(line, msg ?? `Swap ${a[j]} and ${a[i]}.`, { swp: [i, j] });
    },
    set(i, v, line, msg) {
      stats.writes++;
      a[i] = v;
      snap(line, msg ?? `Write ${v} into index ${i}.`, { wr: i });
    },
    countCmp(k = 1) {
      stats.cmp += k;
    },
    step(line, msg, extra) {
      snap(line, msg, extra);
    },
    mark(next) {
      marks = { ...marks, ...next };
      Object.keys(marks).forEach((k) => marks[k] === undefined && delete marks[k]);
    },
    done(...idx) {
      idx.forEach((i) => sorted.add(i));
    },
    finish(msg = 'Done. Every element is in its final place.') {
      marks = {};
      a.forEach((_, i) => sorted.add(i));
      snap(null, msg);
    },
  };
  return t;
}

export class TraceLimit extends Error {
  constructor() {
    super('Trace limit reached');
  }
}

/** Runs an algorithm and always returns a usable trace, even if it hits the step cap. */
export function trace(input, run, opts = {}) {
  const t = createArrayTracer(input, opts);
  if (input.length) t.step(null, 'Starting array. Press play to begin.');
  try {
    run(t);
    if (opts.finish !== false) t.finish();
  } catch (e) {
    if (!(e instanceof TraceLimit)) throw e;
    t.steps.push({ ...t.steps[t.steps.length - 1], msg: 'Stopped: this run is too long to animate. Try a smaller input.' });
  }
  return t.steps;
}

export const randomArray = (n, min = 5, max = 100) =>
  Array.from({ length: n }, () => Math.floor(Math.random() * (max - min + 1)) + min);

export const presets = {
  random: (n) => randomArray(n),
  nearly: (n) => {
    const a = randomArray(n).sort((x, y) => x - y);
    for (let k = 0; k < Math.max(1, n / 10); k++) {
      const i = Math.floor(Math.random() * n);
      const j = Math.min(n - 1, i + 1 + Math.floor(Math.random() * 3));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },
  reversed: (n) => randomArray(n).sort((x, y) => y - x),
  few: (n) => {
    const vals = [20, 45, 70, 95];
    return Array.from({ length: n }, () => vals[Math.floor(Math.random() * vals.length)]);
  },
  sorted: (n) => randomArray(n).sort((x, y) => x - y),
};
