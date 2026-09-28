import { nodeName as nm } from './graph';

/**
 * Graph step shape:
 *   ns      node states: idle | start | key | frontier | current | done | bad
 *   es      edge states: idle | check | relax | reject | frontier | tree
 *   hn, he  one-step overlays on ns / es (flashes)
 *   dist    tentative distances shown above nodes (or null)
 *   label   small text under each node (or null)
 *   group   component index per node, -1 for none (or null)
 *   strips  [{ label, items: [{ t, tone }] }] shown under the stage
 *   matrix  Floyd–Warshall: { d, k, i, j, hit }
 */
class TraceLimit extends Error {}

function createTracer(g, maxSteps = 6000) {
  const t = {
    g,
    ns: Array(g.n).fill('idle'),
    es: Array(g.edges.length).fill('idle'),
    dist: null,
    label: null,
    group: null,
    matrix: null,
    stats: {},
    strips: () => [],
    steps: [],
    snap(line, msg, extra = {}) {
      if (t.steps.length >= maxSteps) throw new TraceLimit();
      t.steps.push({
        line,
        msg,
        ns: [...t.ns],
        es: [...t.es],
        dist: t.dist && [...t.dist],
        label: t.label && [...t.label],
        group: t.group && [...t.group],
        matrix: t.matrix && { ...t.matrix },
        strips: t.strips(),
        stats: { ...t.stats },
        ...extra,
      });
    },
  };
  return t;
}

export function runGraph(runner, g, start) {
  const t = createTracer(g);
  t.stats = Object.fromEntries(runner.stats.map((s) => [s.key, 0]));
  try {
    runner.run(g, start, t);
  } catch (e) {
    if (!(e instanceof TraceLimit)) throw e;
    t.steps.push({ ...t.steps[t.steps.length - 1], msg: 'Stopped: this run is too long to animate. Try fewer nodes.' });
  }
  return t.steps;
}

const fmt = (d) => (d === Infinity ? '∞' : String(d));
const edgeName = (g, e, arrow = g.directed) => `${nm(g.edges[e].u)}${arrow ? '→' : '–'}${nm(g.edges[e].v)}`;
const items = (list, tone) => list.map((x) => ({ t: typeof x === 'number' ? nm(x) : x, tone }));

const bfs = {
  kind: 'undirected',
  start: true,
  code: [
    'mark s visited; queue = [s]',
    'while queue is not empty:',
    '  u = queue.pop_front()',
    '  for each neighbour v of u:',
    '    if v is not visited:',
    '      mark v visited; parent[v] = u',
    '      queue.push_back(v)',
    '  u is finished',
  ],
  stats: [
    { key: 'visited', label: 'Visited', tone: 'text-mint' },
    { key: 'checked', label: 'Edges checked', tone: 'text-amber' },
  ],
  run(g, s, t) {
    const seen = Array(g.n).fill(false);
    const q = [s];
    const order = [];
    seen[s] = true;
    t.ns[s] = 'start';
    t.dist = Array(g.n).fill(Infinity);
    t.dist[s] = 0;
    t.strips = () => [
      { label: 'Queue (front → back)', items: items(q, 'amber') },
      { label: 'Visit order', items: items(order, 'mint') },
    ];
    t.snap(0, `Start at ${nm(s)}. Mark it visited and put it in the queue. Numbers above nodes count hops from ${nm(s)}.`);
    while (q.length) {
      const u = q.shift();
      order.push(u);
      t.stats.visited++;
      t.ns[u] = 'current';
      t.snap(2, `Take ${nm(u)} from the front of the queue (${t.dist[u]} hop${t.dist[u] === 1 ? '' : 's'} from ${nm(s)}).`);
      for (const { to: v, e } of g.adj[u]) {
        t.stats.checked++;
        if (!seen[v]) {
          seen[v] = true;
          t.dist[v] = t.dist[u] + 1;
          t.ns[v] = 'frontier';
          t.es[e] = 'tree';
          q.push(v);
          t.snap(6, `${nm(v)} is new: mark it and add it to the back of the queue. Edge ${edgeName(g, e)} joins the BFS tree.`, { he: { [e]: 'relax' } });
        } else {
          t.snap(4, `${nm(v)} was already visited, so skip it.`, { he: { [e]: 'check' } });
        }
      }
      t.ns[u] = 'done';
      t.snap(7, `${nm(u)} is finished: every neighbour has been looked at.`);
    }
    t.snap(null, `Done. BFS reached ${order.length} nodes in order ${order.map(nm).join(' ')}. The green edges are the shortest-hop paths from ${nm(s)}.`);
  },
};

const dfs = {
  kind: 'undirected',
  start: true,
  code: [
    'dfs(u):',
    '  mark u visited',
    '  for each neighbour v of u:',
    '    if v is not visited:',
    '      parent[v] = u; dfs(v)',
    '  u is finished',
    '',
    'dfs(s)',
  ],
  stats: [
    { key: 'visited', label: 'Visited', tone: 'text-mint' },
    { key: 'checked', label: 'Edges checked', tone: 'text-amber' },
    { key: 'depth', label: 'Max depth' },
  ],
  run(g, s, t) {
    const seen = Array(g.n).fill(false);
    const stack = [];
    const order = [];
    const tin = Array(g.n).fill(0);
    let time = 0;
    t.label = Array(g.n).fill('');
    t.strips = () => [
      { label: 'Call stack (bottom → top)', items: items(stack, 'amber') },
      { label: 'Visit order', items: items(order, 'mint') },
    ];
    t.ns[s] = 'start';
    t.snap(7, `Call dfs(${nm(s)}). Labels under nodes show enter/leave times.`);
    const visit = (u) => {
      seen[u] = true;
      stack.push(u);
      order.push(u);
      tin[u] = ++time;
      t.label[u] = `${tin[u]}/`;
      t.stats.visited++;
      t.stats.depth = Math.max(t.stats.depth, stack.length);
      t.ns[u] = 'current';
      t.snap(1, `Enter ${nm(u)} and mark it visited. The call stack is ${stack.length} deep.`);
      for (const { to: v, e } of g.adj[u]) {
        t.stats.checked++;
        if (!seen[v]) {
          t.es[e] = 'tree';
          t.ns[u] = 'frontier';
          t.snap(4, `${nm(v)} is unvisited, so go deeper along ${edgeName(g, e)}.`, { he: { [e]: 'relax' }, hn: { [u]: 'current' } });
          visit(v);
          t.ns[u] = 'current';
          t.snap(4, `Back in ${nm(u)} after finishing ${nm(v)}.`);
        } else {
          t.snap(3, `${nm(v)} is already visited, so skip it.`, { he: { [e]: 'check' } });
        }
      }
      stack.pop();
      t.label[u] = `${tin[u]}/${++time}`;
      t.ns[u] = 'done';
      t.snap(5, `${nm(u)} is finished. Return to ${stack.length ? nm(stack[stack.length - 1]) : 'the caller'}.`);
    };
    visit(s);
    t.snap(null, `Done. DFS visited ${order.length} nodes in order ${order.map(nm).join(' ')}. The green edges form the DFS tree.`);
  },
};

/** Tiny binary heap keyed by .k, used by Dijkstra and Prim. */
function minHeap() {
  const a = [];
  const up = (i) => {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].k <= a[i].k) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  };
  const down = (i) => {
    for (;;) {
      let m = i;
      const l = 2 * i + 1;
      const r = l + 1;
      if (l < a.length && a[l].k < a[m].k) m = l;
      if (r < a.length && a[r].k < a[m].k) m = r;
      if (m === i) return;
      [a[m], a[i]] = [a[i], a[m]];
      i = m;
    }
  };
  return {
    get size() {
      return a.length;
    },
    push(x) {
      a.push(x);
      up(a.length - 1);
    },
    pop() {
      const top = a[0];
      const last = a.pop();
      if (a.length) {
        a[0] = last;
        down(0);
      }
      return top;
    },
    sorted: () => [...a].sort((x, y) => x.k - y.k),
  };
}

const dijkstra = {
  kind: 'undirected',
  start: true,
  code: [
    'dist[*] = ∞; dist[s] = 0',
    'pq = {(0, s)}',
    'while pq is not empty:',
    '  (d, u) = pq.pop_min()',
    '  if u is settled: continue',
    '  settle u',
    '  for each edge (u, v, w):',
    '    if dist[u] + w < dist[v]:',
    '      dist[v] = dist[u] + w; prev[v] = u',
    '      pq.push((dist[v], v))',
  ],
  stats: [
    { key: 'settled', label: 'Settled', tone: 'text-mint' },
    { key: 'relax', label: 'Relaxations', tone: 'text-coral' },
    { key: 'checked', label: 'Edges checked', tone: 'text-amber' },
    { key: 'pushes', label: 'Queue pushes' },
  ],
  run(g, s, t) {
    const dist = (t.dist = Array(g.n).fill(Infinity));
    const prev = Array(g.n).fill(-1);
    const settled = Array(g.n).fill(false);
    const pq = minHeap();
    dist[s] = 0;
    t.ns[s] = 'start';
    t.snap(0, `Every distance starts at ∞ except the start ${nm(s)}, which is 0.`);
    pq.push({ k: 0, v: s });
    t.stats.pushes++;
    t.strips = () => [{ label: 'Priority queue (smallest first)', items: pq.sorted().map((x) => ({ t: `${nm(x.v)}:${x.k}`, tone: settled[x.v] ? undefined : 'amber' })) }];
    t.snap(1, `Put (0, ${nm(s)}) in the priority queue.`);
    while (pq.size) {
      const { k, v: u } = pq.pop();
      if (settled[u]) {
        t.snap(4, `Popped (${k}, ${nm(u)}), but ${nm(u)} is already settled with a shorter distance. Skip this stale entry.`, { hn: { [u]: 'current' } });
        continue;
      }
      settled[u] = true;
      t.stats.settled++;
      t.ns[u] = 'current';
      if (prev[u] >= 0) t.es[prev[u]] = 'tree';
      t.snap(5, `Pop ${nm(u)} with distance ${k}. Nothing in the queue is closer, so ${k} is final.`);
      for (const { to: v, w, e } of g.adj[u]) {
        if (settled[v]) continue;
        t.stats.checked++;
        const nd = dist[u] + w;
        if (nd < dist[v]) {
          const old = dist[v];
          dist[v] = nd;
          if (prev[v] >= 0) t.es[prev[v]] = 'idle';
          prev[v] = e;
          t.es[e] = 'frontier';
          t.ns[v] = 'frontier';
          pq.push({ k: nd, v });
          t.stats.relax++;
          t.stats.pushes++;
          t.snap(8, `Relax ${edgeName(g, e)}: ${dist[u]} + ${w} = ${nd} beats ${fmt(old)}, so ${nm(v)} gets distance ${nd}.`, { he: { [e]: 'relax' }, hn: { [v]: 'current' } });
        } else {
          t.snap(7, `${edgeName(g, e)}: ${dist[u]} + ${w} = ${nd} is not better than ${fmt(dist[v])}. Keep ${nm(v)} as it is.`, { he: { [e]: 'check' } });
        }
      }
      t.ns[u] = 'done';
    }
    t.snap(null, `Done. Shortest distances from ${nm(s)}: ${dist.map((d, i) => `${nm(i)}=${fmt(d)}`).join(', ')}. Green edges are the shortest-path tree.`);
  },
};

const bellmanFord = {
  kind: 'negative',
  start: true,
  code: [
    'dist[*] = ∞; dist[s] = 0',
    'repeat n-1 times:',
    '  changed = false',
    '  for each edge (u, v, w):',
    '    if dist[u] + w < dist[v]:',
    '      dist[v] = dist[u] + w; prev[v] = u; changed = true',
    '  if not changed: stop early',
    'for each edge (u, v, w):',
    '  if dist[u] + w < dist[v]: negative cycle',
  ],
  stats: [
    { key: 'pass', label: 'Pass', tone: 'text-violet' },
    { key: 'relax', label: 'Relaxations', tone: 'text-coral' },
    { key: 'checked', label: 'Edges checked', tone: 'text-amber' },
  ],
  run(g, s, t) {
    const dist = (t.dist = Array(g.n).fill(Infinity));
    const prev = Array(g.n).fill(-1);
    dist[s] = 0;
    t.ns[s] = 'start';
    t.snap(0, `Every distance starts at ∞ except the start ${nm(s)}. Some edges are negative, which Dijkstra cannot handle.`);
    for (let pass = 1; pass < g.n; pass++) {
      t.stats.pass = pass;
      let changed = false;
      t.snap(2, `Pass ${pass} of at most ${g.n - 1}: try to relax every edge once.`);
      for (const e of g.edges) {
        t.stats.checked++;
        if (dist[e.u] === Infinity) continue;
        const nd = dist[e.u] + e.w;
        if (nd < dist[e.v]) {
          const old = dist[e.v];
          dist[e.v] = nd;
          if (prev[e.v] >= 0) t.es[prev[e.v]] = 'idle';
          prev[e.v] = e.id;
          t.es[e.id] = 'tree';
          if (e.v !== s) t.ns[e.v] = 'done';
          changed = true;
          t.stats.relax++;
          t.snap(5, `Relax ${edgeName(g, e.id)} (w=${e.w}): ${dist[e.u]} + ${e.w} = ${nd} beats ${fmt(old)}.`, { he: { [e.id]: 'relax' }, hn: { [e.u]: 'current', [e.v]: 'frontier' } });
        } else {
          t.snap(4, `${edgeName(g, e.id)} (w=${e.w}): ${dist[e.u]} + ${e.w} = ${nd} is not better than ${fmt(dist[e.v])}.`, { he: { [e.id]: 'check' }, hn: { [e.u]: 'current' } });
        }
      }
      if (!changed) {
        t.snap(6, `Nothing changed in pass ${pass}, so every distance is final. Stop early.`);
        break;
      }
    }
    let bad = false;
    t.snap(7, 'One more sweep: if any edge can still be relaxed, there is a negative cycle.');
    for (const e of g.edges) {
      if (dist[e.u] !== Infinity && dist[e.u] + e.w < dist[e.v]) {
        bad = true;
        t.ns[e.v] = 'bad';
        t.es[e.id] = 'reject';
        t.snap(8, `${edgeName(g, e.id)} still improves, so a negative cycle is reachable.`, { he: { [e.id]: 'relax' } });
      }
    }
    t.snap(
      null,
      bad
        ? 'Done. The graph has a negative cycle, so shortest paths are undefined.'
        : `Done. No edge can improve further. Distances: ${dist.map((d, i) => `${nm(i)}=${fmt(d)}`).join(', ')}.`,
    );
  },
};

const prim = {
  kind: 'undirected',
  start: true,
  code: [
    'inTree = {s}',
    'push every edge of s into pq',
    'while pq is not empty and tree has < n nodes:',
    '  (w, u, v) = pq.pop_min()',
    '  if v is in the tree: discard; continue',
    '  add v and edge (u, v) to the tree',
    '  for each edge (v, x) with x not in tree:',
    '    pq.push((w, v, x))',
    'the tree edges form the MST',
  ],
  stats: [
    { key: 'weight', label: 'MST weight', tone: 'text-mint' },
    { key: 'edges', label: 'Tree edges', tone: 'text-mint' },
    { key: 'discarded', label: 'Discarded', tone: 'text-coral' },
    { key: 'pushes', label: 'Queue pushes' },
  ],
  run(g, s, t) {
    const inTree = Array(g.n).fill(false);
    const pq = minHeap();
    let size = 1;
    inTree[s] = true;
    t.ns[s] = 'start';
    t.strips = () => [
      { label: 'Priority queue (lightest first)', items: pq.sorted().map((x) => ({ t: `${edgeName(g, x.e, false)}:${x.k}`, tone: inTree[x.v] ? undefined : 'amber' })) },
    ];
    t.snap(0, `Grow the tree from ${nm(s)}.`);
    const pushFrom = (u) => {
      for (const { to, w, e } of g.adj[u])
        if (!inTree[to]) {
          pq.push({ k: w, v: to, e });
          t.stats.pushes++;
          if (t.es[e] === 'idle') t.es[e] = 'frontier';
        }
    };
    pushFrom(s);
    t.snap(1, `Every edge leaving ${nm(s)} goes into the priority queue.`);
    while (pq.size && size < g.n) {
      const { k, v, e } = pq.pop();
      if (inTree[v]) {
        t.stats.discarded++;
        t.es[e] = 'reject';
        t.snap(4, `Lightest edge ${edgeName(g, e, false)} (${k}) connects two tree nodes. Taking it would make a cycle, so discard it.`, { he: { [e]: 'relax' } });
        continue;
      }
      inTree[v] = true;
      size++;
      t.es[e] = 'tree';
      t.ns[v] = 'done';
      t.stats.weight += k;
      t.stats.edges++;
      t.snap(5, `Lightest crossing edge is ${edgeName(g, e, false)} with weight ${k}. Add ${nm(v)} to the tree.`, { hn: { [v]: 'current' } });
      pushFrom(v);
      t.snap(7, `Push the edges from ${nm(v)} to nodes outside the tree.`, { hn: { [v]: 'current' } });
    }
    t.es = t.es.map((x) => (x === 'tree' ? x : 'idle'));
    t.snap(8, `Done. The minimum spanning tree has ${t.stats.edges} edges and total weight ${t.stats.weight}.`);
  },
};

const GROUPS = 8;

const kruskal = {
  kind: 'undirected',
  code: [
    'sort edges by weight',
    'make each node its own set',
    'for each edge (u, v, w) in order:',
    '  if find(u) != find(v):',
    '    union(u, v); add the edge to the MST',
    '  else: skip it (it would close a cycle)',
    '  stop once the MST has n-1 edges',
  ],
  stats: [
    { key: 'weight', label: 'MST weight', tone: 'text-mint' },
    { key: 'edges', label: 'Tree edges', tone: 'text-mint' },
    { key: 'rejected', label: 'Rejected', tone: 'text-coral' },
    { key: 'finds', label: 'Find calls' },
  ],
  run(g, _s, t) {
    const order = [...g.edges].sort((a, b) => a.w - b.w || a.id - b.id);
    const parent = Array.from({ length: g.n }, (_, i) => i);
    const size = Array(g.n).fill(1);
    const color = Array(g.n).fill(-1); // colour of each root, -1 for singletons
    let cur = -1;
    const find = (x) => {
      t.stats.finds++;
      while (parent[x] !== x) {
        parent[x] = parent[parent[x]];
        x = parent[x];
      }
      return x;
    };
    const root = (x) => {
      while (parent[x] !== x) x = parent[x];
      return x;
    };
    const paint = () => {
      t.group = Array.from({ length: g.n }, (_, i) => color[root(i)]);
    };
    const edgeTone = (e, i) => (i === cur ? 'amber' : t.es[e.id] === 'tree' ? 'mint' : t.es[e.id] === 'reject' ? 'coral' : undefined);
    t.strips = () => {
      const sets = {};
      for (let i = 0; i < g.n; i++) (sets[root(i)] ??= []).push(nm(i));
      return [
        { label: 'Edges by weight', items: order.map((e, i) => ({ t: `${edgeName(g, e.id)}:${e.w}`, tone: edgeTone(e, i) })) },
        { label: 'Union-find sets', items: Object.values(sets).filter((x) => x.length > 1).map((x) => ({ t: `{${x.join(',')}}`, tone: 'violet' })) },
      ];
    };
    paint();
    t.snap(0, `Sort all ${order.length} edges from lightest to heaviest.`);
    t.snap(1, 'Each node starts in its own set. Nodes that share a colour are in the same set.');
    for (let i = 0; i < order.length; i++) {
      const e = order[i];
      cur = i;
      const a = find(e.u);
      const b = find(e.v);
      if (a !== b) {
        // union by size; the bigger set keeps its colour
        const [big, small] = size[a] >= size[b] ? [a, b] : [b, a];
        let c = color[big] >= 0 ? color[big] : color[small];
        if (c < 0) {
          const used = new Set(color.filter((x, r) => x >= 0 && parent[r] === r));
          c = [...Array(GROUPS).keys()].find((x) => !used.has(x)) ?? 0;
        }
        parent[small] = big;
        size[big] += size[small];
        color[big] = c;
        color[small] = -1;
        t.es[e.id] = 'tree';
        t.stats.weight += e.w;
        t.stats.edges++;
        paint();
        t.snap(4, `${edgeName(g, e.id)} (${e.w}) joins two different sets. Take it and merge the sets.`, { he: { [e.id]: 'relax' }, hn: { [e.u]: 'current', [e.v]: 'current' } });
      } else {
        t.es[e.id] = 'reject';
        t.stats.rejected++;
        t.snap(5, `${nm(e.u)} and ${nm(e.v)} are already in the same set, so ${edgeName(g, e.id)} would close a cycle. Skip it.`, { he: { [e.id]: 'relax' }, hn: { [e.u]: 'current', [e.v]: 'current' } });
      }
      if (t.stats.edges === g.n - 1) {
        cur = -1;
        t.snap(6, `The tree has ${g.n - 1} edges, which spans all ${g.n} nodes. Stop.`);
        break;
      }
    }
    t.snap(null, `Done. The minimum spanning tree has total weight ${t.stats.weight}.`);
  },
};

const topo = {
  kind: 'dag',
  code: [
    'indeg[v] = number of edges into v',
    'queue = every v with indeg[v] = 0',
    'while queue is not empty:',
    '  u = queue.pop_front(); append u to order',
    '  for each edge u → v:',
    '    indeg[v] -= 1',
    '    if indeg[v] == 0: queue.push_back(v)',
    'if order has < n nodes: the graph has a cycle',
  ],
  stats: [
    { key: 'output', label: 'Placed', tone: 'text-mint' },
    { key: 'removed', label: 'Edges removed', tone: 'text-amber' },
  ],
  run(g, _s, t) {
    const indeg = Array(g.n).fill(0);
    g.edges.forEach((e) => indeg[e.v]++);
    const q = [];
    const order = [];
    const lab = () => (t.label = indeg.map((d, i) => (t.ns[i] === 'done' ? `#${order.indexOf(i) + 1}` : `in ${d}`)));
    t.strips = () => [
      { label: 'Queue (in-degree 0)', items: items(q, 'amber') },
      { label: 'Topological order', items: items(order, 'mint') },
    ];
    lab();
    t.snap(0, 'Count the incoming edges of every node (shown under each node).');
    for (let v = 0; v < g.n; v++)
      if (indeg[v] === 0) {
        q.push(v);
        t.ns[v] = 'frontier';
      }
    t.snap(1, `${q.map(nm).join(', ')} ${q.length === 1 ? 'has' : 'have'} no incoming edges, so ${q.length === 1 ? 'it goes' : 'they go'} in the queue.`);
    while (q.length) {
      const u = q.shift();
      order.push(u);
      t.stats.output++;
      t.ns[u] = 'current';
      t.snap(3, `Take ${nm(u)}: nothing still points into it, so it can go next in the order.`);
      for (const { to: v, e } of g.adj[u]) {
        indeg[v]--;
        t.stats.removed++;
        t.es[e] = 'tree';
        lab();
        if (indeg[v] === 0) {
          q.push(v);
          t.ns[v] = 'frontier';
          t.snap(6, `Remove ${edgeName(g, e)}. ${nm(v)} now has no incoming edges, so it joins the queue.`, { he: { [e]: 'relax' } });
        } else {
          t.snap(5, `Remove ${edgeName(g, e)}. ${nm(v)} still has ${indeg[v]} incoming edge${indeg[v] === 1 ? '' : 's'}.`, { he: { [e]: 'relax' } });
        }
      }
      t.ns[u] = 'done';
      lab();
    }
    t.snap(
      order.length < g.n ? 7 : null,
      order.length < g.n
        ? 'Some nodes were never freed, so the graph has a cycle.'
        : `Done. A valid order is ${order.map(nm).join(' → ')}. Every edge points forward in it.`,
    );
  },
};

const scc = {
  kind: 'directed',
  code: [
    'for each unvisited node u: connect(u)',
    'connect(u):',
    '  disc[u] = low[u] = time++; push u on stack',
    '  for each edge u → v:',
    '    if v unvisited: connect(v); low[u] = min(low[u], low[v])',
    '    else if v on stack: low[u] = min(low[u], disc[v])',
    '  if low[u] == disc[u]:',
    '    pop the stack down to u: that is one SCC',
  ],
  stats: [
    { key: 'sccs', label: 'Components', tone: 'text-violet' },
    { key: 'visited', label: 'Visited', tone: 'text-mint' },
    { key: 'checked', label: 'Edges checked', tone: 'text-amber' },
  ],
  run(g, _s, t) {
    const disc = Array(g.n).fill(-1);
    const low = Array(g.n).fill(0);
    const onStack = Array(g.n).fill(false);
    const stack = [];
    const comps = [];
    let time = 0;
    t.group = Array(g.n).fill(-1);
    t.label = Array(g.n).fill('');
    const lab = (u) => (t.label[u] = `${disc[u]}/${low[u]}`);
    t.strips = () => [
      { label: 'Stack', items: items(stack, 'amber') },
      { label: 'Components found', items: comps.map((c, i) => ({ t: `{${c.map(nm).join(',')}}`, group: i % GROUPS })) },
    ];
    t.snap(0, 'Tarjan finds strongly connected components in one DFS. Labels show disc/low.');
    const connect = (u) => {
      disc[u] = low[u] = time++;
      stack.push(u);
      onStack[u] = true;
      t.stats.visited++;
      lab(u);
      t.ns[u] = 'current';
      t.snap(2, `Visit ${nm(u)}: disc = low = ${disc[u]}. Push it on the stack.`);
      for (const { to: v, e } of g.adj[u]) {
        t.stats.checked++;
        if (disc[v] < 0) {
          t.es[e] = 'tree';
          t.ns[u] = 'frontier';
          t.snap(4, `${nm(v)} is unvisited: follow ${edgeName(g, e)}.`, { he: { [e]: 'relax' } });
          connect(v);
          t.ns[u] = 'current';
          const before = low[u];
          low[u] = Math.min(low[u], low[v]);
          lab(u);
          t.snap(4, `Back at ${nm(u)}. low[${nm(u)}] = min(${before}, low[${nm(v)}] = ${low[v]}) = ${low[u]}.`);
        } else if (onStack[v]) {
          const before = low[u];
          low[u] = Math.min(low[u], disc[v]);
          lab(u);
          t.snap(5, `${nm(v)} is on the stack, so ${nm(u)} can reach back to it. low[${nm(u)}] = min(${before}, ${disc[v]}) = ${low[u]}.`, { he: { [e]: 'check' } });
        } else {
          t.snap(3, `${nm(v)} already belongs to a finished component. Ignore ${edgeName(g, e)}.`, { he: { [e]: 'check' } });
        }
      }
      if (low[u] === disc[u]) {
        const comp = [];
        let x;
        do {
          x = stack.pop();
          onStack[x] = false;
          comp.push(x);
          t.group[x] = comps.length % GROUPS;
          t.ns[x] = 'idle';
        } while (x !== u);
        comps.push(comp);
        t.stats.sccs++;
        t.snap(7, `low[${nm(u)}] equals disc[${nm(u)}], so ${nm(u)} is the root of a component. Pop {${comp.map(nm).join(', ')}}.`);
      } else {
        t.ns[u] = 'frontier';
        t.snap(6, `low[${nm(u)}] < disc[${nm(u)}]: ${nm(u)} reaches an older node, so it stays on the stack.`);
      }
    };
    for (let u = 0; u < g.n; u++) if (disc[u] < 0) connect(u);
    t.snap(null, `Done. ${comps.length} strongly connected component${comps.length === 1 ? '' : 's'}. Inside each colour every node can reach every other.`);
  },
};

const floyd = {
  kind: 'negative',
  maxNodes: 10,
  code: [
    'dist[i][j] = w(i, j); dist[i][i] = 0; else ∞',
    'for k in nodes:',
    '  for i in nodes:',
    '    for j in nodes:',
    '      if dist[i][k] + dist[k][j] < dist[i][j]:',
    '        dist[i][j] = dist[i][k] + dist[k][j]',
  ],
  stats: [
    { key: 'k', label: 'Via node k', tone: 'text-violet' },
    { key: 'updates', label: 'Updates', tone: 'text-coral' },
    { key: 'checked', label: 'Checks', tone: 'text-amber' },
  ],
  run(g, _s, t) {
    const n = g.n;
    let d = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)));
    g.edges.forEach((e) => (d[e.u][e.v] = Math.min(d[e.u][e.v], e.w)));
    t.matrix = { d, k: -1, i: -1, j: -1 };
    t.stats.k = '–';
    t.snap(0, 'Start the table with direct edge weights. ∞ means no direct edge.');
    for (let k = 0; k < n; k++) {
      t.stats.k = nm(k);
      t.ns = Array(n).fill('idle');
      t.ns[k] = 'key';
      t.matrix = { d, k, i: -1, j: -1 };
      t.snap(1, `Now allow paths that pass through ${nm(k)}.`);
      for (let i = 0; i < n; i++) {
        if (i === k || d[i][k] === Infinity) continue;
        for (let j = 0; j < n; j++) {
          if (j === k || j === i || d[k][j] === Infinity) continue;
          t.stats.checked++;
          const via = d[i][k] + d[k][j];
          const hn = { [i]: 'current', [j]: 'frontier' };
          if (via < d[i][j]) {
            const old = d[i][j];
            d = d.map((r) => [...r]);
            d[i][j] = via;
            t.stats.updates++;
            t.matrix = { d, k, i, j, hit: true };
            t.snap(5, `${nm(i)}→${nm(k)}→${nm(j)} costs ${d[i][k]} + ${d[k][j]} = ${via}, better than ${fmt(old)}. Update the cell.`, { hn });
          } else {
            t.matrix = { d, k, i, j, hit: false };
            t.snap(4, `${nm(i)}→${nm(k)}→${nm(j)} costs ${via}, not better than ${fmt(d[i][j])}.`, { hn });
          }
        }
      }
    }
    t.ns = Array(n).fill('done');
    t.matrix = { d, k: -1, i: -1, j: -1 };
    t.snap(null, `Done. The table now holds the shortest distance between every pair after ${t.stats.updates} updates.`);
  },
};

export const graphRunners = { bfs, dfs, dijkstra, 'bellman-ford': bellmanFord, prim, kruskal, topo, scc, floyd };
