/**
 * Tree step shape (every structure produces the same thing, so one 2D and one 3D renderer serve all):
 *   nodes   [{ id, x, d, label, tone, sub?, badge?, badgeTone?, ring? }]  x in slot units, d = depth
 *   edges   [{ from, to, tone }]
 *   width   number of x slots, depth = deepest level
 *   ghost   { label, at } a floating key next to node `at`
 *   array   [{ v, tone, id }] backing array strip (heap, segment tree input)
 *   strips  [{ label, items: [{ t, tone }] }]
 *   line, msg, stats
 * tones: idle | cmp (amber) | path (amber outline) | remove (coral) | key (violet) | found (mint) | done (mint, quiet) | dim
 */
export class TraceLimit extends Error {}

export function makeTracer(view, maxSteps = 4000) {
  const t = {
    steps: [],
    stats: {},
    snap(line, msg, opts = {}) {
      if (t.steps.length >= maxSteps) throw new TraceLimit();
      const v = view(opts);
      t.steps.push({
        ...v,
        line,
        msg,
        ghost: opts.ghost ?? null,
        strips: opts.strips ?? v.strips ?? null,
        array: opts.array ?? v.array ?? null,
        stats: { ...t.stats, nodes: v.nodes.length, height: v.nodes.length ? v.depth + 1 : 0 },
      });
    },
  };
  return t;
}

/** Runs op(t) and always returns a usable trace. */
export function record(view, op, stats = {}) {
  const t = makeTracer(view);
  t.stats = { ...stats };
  let result;
  try {
    result = op(t);
  } catch (e) {
    if (!(e instanceof TraceLimit)) throw e;
  }
  if (!t.steps.length) t.snap(null, 'Nothing to do.');
  return { steps: t.steps, result };
}

/** Highlights for a root-to-node walk: earlier nodes 'path', the last one `tone`. */
export function trail(path, tone = 'cmp') {
  const hl = {};
  const ehl = {};
  path.forEach((id, i) => {
    hl[id] = i === path.length - 1 ? tone : 'path';
    if (i > 0) ehl[id] = 'path';
  });
  return { hl, ehl };
}
