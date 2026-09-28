// Random graph generation and a 2D force layout. Plain JS so it can be tested in node.

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const nodeName = (i) => LETTERS[i] ?? String(i);

/** Stage box the 2D layout fits into (SVG user units). */
export const BOX = { w: 1000, h: 560, padX: 60, top: 60, bottom: 120 };

const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const d2 = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);

function scatter(n) {
  const pts = [];
  let minD = 0.26;
  let tries = 0;
  while (pts.length < n) {
    const p = [Math.random(), Math.random() * 0.6];
    if (pts.every((q) => d2(p, q) >= minD)) pts.push(p);
    else if (++tries > 400) {
      minD *= 0.9;
      tries = 0;
    }
  }
  return pts;
}

// proper segment intersection (shared endpoints do not count)
function crosses(a, b, c, d) {
  const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
}

/** Near-planar connected graph: Euclidean MST of random points plus short non-crossing extras. */
function geometric(n) {
  const pts = scatter(n);
  const pairs = [];
  // Prim over the complete graph for a spanning tree
  const inTree = [0];
  const used = new Set([0]);
  while (inTree.length < n) {
    let best = null;
    for (const a of inTree)
      for (let b = 0; b < n; b++)
        if (!used.has(b) && (!best || d2(pts[a], pts[b]) < best.d)) best = { a, b, d: d2(pts[a], pts[b]) };
    pairs.push([best.a, best.b]);
    used.add(best.b);
    inTree.push(best.b);
  }
  const has = (a, b) => pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const cands = [];
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (!has(a, b)) cands.push([a, b, d2(pts[a], pts[b])]);
  cands.sort((x, y) => x[2] - y[2]);
  const extra = Math.round(n * 0.6);
  let added = 0;
  for (const [a, b] of cands) {
    if (added >= extra) break;
    if (pairs.some(([x, y]) => x !== a && x !== b && y !== a && y !== b && crosses(pts[a], pts[b], pts[x], pts[y]))) continue;
    pairs.push([a, b]);
    added++;
  }
  return { pts, pairs };
}

let nextId = 1;

/**
 * kind:
 *  'undirected'  weights 1..20
 *  'dag'         edges point left to right, so there is no cycle
 *  'directed'    random directions (cycles likely), for SCC
 *  'negative'    directed, reachable from node 0, some negative weights but no negative cycle
 */
export function makeGraph(n, kind = 'undirected') {
  const { pts, pairs } = geometric(n);
  const base = (a, b) => Math.max(1, Math.min(20, Math.round(d2(pts[a], pts[b]) * 26 + rand(-2, 2))));
  let edges;
  if (kind === 'undirected') {
    edges = pairs.map(([u, v]) => ({ u, v, w: base(u, v) }));
  } else if (kind === 'dag') {
    const rank = pts.map((p, i) => p[0] + i * 1e-9);
    edges = pairs.map(([a, b]) => (rank[a] < rank[b] ? { u: a, v: b } : { u: b, v: a }));
    edges.forEach((e) => (e.w = base(e.u, e.v)));
  } else if (kind === 'directed') {
    edges = pairs.map(([a, b]) => (Math.random() < 0.5 ? { u: a, v: b } : { u: b, v: a }));
    edges.forEach((e) => (e.w = base(e.u, e.v)));
  } else {
    // orient a BFS tree away from 0 so everything is reachable; the rest point randomly.
    // w = base + p[u] - p[v] keeps every cycle's total equal to the sum of the (positive) bases.
    const adj = Array.from({ length: n }, () => []);
    pairs.forEach(([a, b], k) => {
      adj[a].push([b, k]);
      adj[b].push([a, k]);
    });
    const dir = new Array(pairs.length);
    const seen = [true, ...Array(n - 1).fill(false)];
    const q = [0];
    while (q.length) {
      const u = q.shift();
      for (const [v, k] of adj[u])
        if (!seen[v]) {
          seen[v] = true;
          dir[k] = [u, v];
          q.push(v);
        }
    }
    const pot = Array.from({ length: n }, () => randInt(0, 7));
    edges = pairs.map(([a, b], k) => {
      const [u, v] = dir[k] ?? (Math.random() < 0.5 ? [a, b] : [b, a]);
      const w0 = Math.max(1, Math.min(6, Math.round(d2(pts[u], pts[v]) * 10 + rand(-1, 1))));
      return { u, v, w: w0 + pot[u] - pot[v] };
    });
  }
  edges.forEach((e, i) => (e.id = i));
  const directed = kind !== 'undirected';
  return { id: nextId++, n, kind, directed, edges, adj: buildAdj(n, edges, directed), pos: forceLayout(n, edges, pts) };
}

export function buildAdj(n, edges, directed) {
  const adj = Array.from({ length: n }, () => []);
  for (const e of edges) {
    adj[e.u].push({ to: e.v, w: e.w, e: e.id });
    if (!directed) adj[e.v].push({ to: e.u, w: e.w, e: e.id });
  }
  adj.forEach((l) => l.sort((a, b) => a.to - b.to));
  return adj;
}

/** Fruchterman–Reingold relaxation from the seed points, then fit into BOX. */
export function forceLayout(n, edges, init, iters = 300) {
  const p = init.map(([x, y]) => [x, y]);
  const k = 0.75 * Math.sqrt(0.6 / n);
  let temp = 0.08;
  for (let it = 0; it < iters; it++) {
    const f = p.map(() => [0, 0]);
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        let dx = p[i][0] - p[j][0];
        let dy = p[i][1] - p[j][1];
        const d = Math.max(0.01, Math.hypot(dx, dy));
        const rep = (k * k) / d;
        dx /= d;
        dy /= d;
        f[i][0] += dx * rep;
        f[i][1] += dy * rep;
        f[j][0] -= dx * rep;
        f[j][1] -= dy * rep;
      }
    for (const { u, v } of edges) {
      const dx = p[u][0] - p[v][0];
      const dy = p[u][1] - p[v][1];
      const d = Math.max(0.01, Math.hypot(dx, dy));
      const att = (d * d) / k;
      f[u][0] -= (dx / d) * att;
      f[u][1] -= (dy / d) * att;
      f[v][0] += (dx / d) * att;
      f[v][1] += (dy / d) * att;
    }
    for (let i = 0; i < n; i++) {
      const m = Math.hypot(f[i][0], f[i][1]) || 1;
      const s = Math.min(m, temp) / m;
      p[i][0] += f[i][0] * s;
      p[i][1] += f[i][1] * s;
    }
    temp *= 0.985;
  }
  return fit(p);
}

function fit(p) {
  const xs = p.map((q) => q[0]);
  const ys = p.map((q) => q[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const W = BOX.w - 2 * BOX.padX;
  const H = BOX.h - BOX.top - BOX.bottom;
  const s = Math.min(W / Math.max(1e-6, x1 - x0), H / Math.max(1e-6, y1 - y0));
  const ox = BOX.padX + (W - (x1 - x0) * s) / 2;
  const oy = BOX.top + (H - (y1 - y0) * s) / 2;
  return p.map(([x, y]) => [ox + (x - x0) * s, oy + (y - y0) * s]);
}
