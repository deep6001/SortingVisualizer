import {
  CLOSED,
  EMPTY,
  GridLimit,
  MARK,
  OPEN,
  PATH,
  WALL,
  WEIGHT_COST,
  cellCost,
  createGridTracer,
  manhattan,
  neighbours,
  pathCost,
  rng,
} from './grid.js';

// ---------- helpers ----------

/** Min-heap over arrays compared element by element (priority, tie-breakers…, cell last). */
class Heap {
  constructor() {
    this.a = [];
  }
  get size() {
    return this.a.length;
  }
  static less(x, y) {
    for (let k = 0; k < x.length; k++) if (x[k] !== y[k]) return x[k] < y[k];
    return false;
  }
  push(v) {
    const a = this.a;
    a.push(v);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!Heap.less(a[i], a[p])) break;
      [a[i], a[p]] = [a[p], a[i]];
      i = p;
    }
  }
  pop() {
    const a = this.a;
    const top = a[0];
    const last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && Heap.less(a[l], a[m])) m = l;
        if (r < a.length && Heap.less(a[r], a[m])) m = r;
        if (m === i) break;
        [a[i], a[m]] = [a[m], a[i]];
        i = m;
      }
    }
    return top;
  }
}

/** Open / close cells while keeping the frontier and visited counters honest. */
function marker(t) {
  return {
    open(i) {
      if (t.state[i] === OPEN || t.state[i] === CLOSED) return;
      t.stats.frontier++;
      t.set(i, OPEN);
    },
    close(i) {
      if (t.state[i] === CLOSED) return;
      if (t.state[i] === OPEN) t.stats.frontier--;
      t.stats.visited++;
      t.set(i, CLOSED);
    },
  };
}

function walk(parent, cell) {
  const path = [];
  for (let c = cell; c !== -1; c = parent[c]) path.push(c);
  return path.reverse();
}

const xy = (W, i) => `(${i % W}, ${Math.floor(i / W)})`;
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// ---------- searches ----------

const bfs = {
  weighted: false,
  code: [
    'queue = [start]; seen = {start}',
    'while queue is not empty:',
    '  cell = queue.pop_front()',
    '  if cell == goal: return path(cell)',
    '  for next in neighbours(cell):',
    '    if next not in seen and not a wall:',
    '      seen.add(next); parent[next] = cell',
    '      queue.push_back(next)',
    'return no path',
  ],
  found: 3,
  none: 8,
  run(t, g) {
    const { open, close } = marker(t);
    const parent = new Int32Array(g.n).fill(-1);
    const dist = new Int32Array(g.n).fill(-1);
    const q = [g.start];
    let head = 0;
    dist[g.start] = 0;
    open(g.start);
    t.step(0, 'Put the start in the queue. BFS explores in rings: every cell one step away, then two, and so on.', { cur: g.start });
    while (head < q.length) {
      const cell = q[head++];
      close(cell);
      t.step(2, `Take the oldest cell in the queue, ${plural(dist[cell], 'step')} from the start.`, { cur: cell });
      if (cell === g.goal) return walk(parent, cell);
      let added = 0;
      for (const nx of g.nb(cell)) {
        if (dist[nx] !== -1) continue;
        dist[nx] = dist[cell] + 1;
        parent[nx] = cell;
        q.push(nx);
        open(nx);
        added++;
      }
      if (added) t.step(7, `Add ${plural(added, 'new neighbour')} to the back of the queue. It now holds ${q.length - head}.`, { cur: cell });
    }
    return null;
  },
};

const dfs = {
  weighted: false,
  code: [
    'stack = [start]',
    'while stack is not empty:',
    '  cell = stack.pop()',
    '  if cell in seen: continue',
    '  seen.add(cell)',
    '  if cell == goal: return path(cell)',
    '  for next in neighbours(cell):',
    '    if next not in seen and not a wall:',
    '      parent[next] = cell; stack.push(next)',
    'return no path',
  ],
  found: 5,
  none: 9,
  run(t, g) {
    const { open, close } = marker(t);
    const parent = new Int32Array(g.n).fill(-1);
    const seen = new Uint8Array(g.n);
    const stack = [g.start];
    open(g.start);
    t.step(0, 'Put the start on the stack. DFS always follows the newest lead as deep as it goes.', { cur: g.start });
    while (stack.length) {
      const cell = stack.pop();
      if (seen[cell]) continue;
      seen[cell] = 1;
      close(cell);
      t.step(4, `Pop ${xy(g.W, cell)} off the stack and mark it seen.`, { cur: cell });
      if (cell === g.goal) return walk(parent, cell);
      let added = 0;
      // push in reverse so the first neighbour (up) is explored first
      const nb = g.nb(cell);
      for (let k = nb.length - 1; k >= 0; k--) {
        const nx = nb[k];
        if (seen[nx]) continue;
        parent[nx] = cell;
        stack.push(nx);
        open(nx);
        added++;
      }
      if (added) t.step(8, `Push ${plural(added, 'unseen neighbour')}. The one pushed last is explored next.`, { cur: cell });
      else t.step(1, 'Dead end. Back up to the most recent cell still on the stack.', { cur: cell });
    }
    return null;
  },
};

/** Shared body of Dijkstra and A*: best-first by g (+ h for A*). */
function bestFirst(t, g, useH, L) {
  const { open, close } = marker(t);
  const parent = new Int32Array(g.n).fill(-1);
  const cost = new Float64Array(g.n).fill(Infinity);
  const done = new Uint8Array(g.n);
  const pq = new Heap();
  let seq = 0;
  const h = (i) => (useH ? g.h(i) : 0);
  cost[g.start] = 0;
  pq.push([h(g.start), h(g.start), seq++, g.start]);
  open(g.start);
  t.step(L.init, useH ? `Start with g = 0. The goal is ${g.h(g.start)} steps away as the crow walks, so f = ${g.h(g.start)}.` : 'Start with distance 0. Every other cell starts at infinity.', { cur: g.start });
  while (pq.size) {
    const [, , , cell] = pq.pop();
    if (done[cell]) continue;
    done[cell] = 1;
    close(cell);
    t.step(
      L.pop,
      useH
        ? `Expand ${xy(g.W, cell)}: lowest f = g ${cost[cell]} + h ${g.h(cell)} = ${cost[cell] + g.h(cell)}.`
        : `Settle ${xy(g.W, cell)}: its cheapest cost is ${cost[cell]} and can no longer improve.`,
      { cur: cell },
    );
    if (cell === g.goal) return walk(parent, cell);
    let improved = 0;
    for (const nx of g.nb(cell)) {
      if (done[nx]) continue;
      const nc = cost[cell] + g.cost(nx);
      if (nc < cost[nx]) {
        cost[nx] = nc;
        parent[nx] = cell;
        pq.push([nc + h(nx), h(nx), seq++, nx]);
        open(nx);
        improved++;
      }
    }
    if (improved) t.step(L.relax, `Found a cheaper way to ${plural(improved, 'neighbour')}. Weighted cells cost ${WEIGHT_COST} to enter.`, { cur: cell });
  }
  return null;
}

const dijkstra = {
  weighted: true,
  code: [
    'dist[start] = 0; pq = [(0, start)]',
    'while pq is not empty:',
    '  (d, cell) = pq.pop_min()',
    '  if cell is settled: continue',
    '  settle(cell)',
    '  if cell == goal: return path(cell)',
    '  for next in neighbours(cell):',
    '    nd = d + cost(next)          # 1, or 5 on a weight',
    '    if nd < dist[next]:',
    '      dist[next] = nd; parent[next] = cell; pq.push((nd, next))',
    'return no path',
  ],
  found: 5,
  none: 10,
  run: (t, g) => bestFirst(t, g, false, { init: 0, pop: 4, relax: 9 }),
};

const astar = {
  weighted: true,
  code: [
    'g[start] = 0; open = [(h(start), start)]',
    'while open is not empty:',
    '  cell = open.pop_lowest_f()      # f = g + h',
    '  if cell is closed: continue',
    '  close(cell)',
    '  if cell == goal: return path(cell)',
    '  for next in neighbours(cell):',
    '    ng = g[cell] + cost(next)',
    '    if ng < g[next]:',
    '      g[next] = ng; parent[next] = cell',
    '      open.push((ng + h(next), next))   # h = Manhattan distance',
    'return no path',
  ],
  found: 5,
  none: 11,
  run: (t, g) => bestFirst(t, g, true, { init: 0, pop: 4, relax: 10 }),
};

const greedy = {
  weighted: false,
  code: [
    'open = [(h(start), start)]; seen = {start}',
    'while open is not empty:',
    '  cell = open.pop_lowest_h()      # closest to the goal',
    '  if cell == goal: return path(cell)',
    '  for next in neighbours(cell):',
    '    if next not in seen and not a wall:',
    '      seen.add(next); parent[next] = cell',
    '      open.push((h(next), next))',
    'return no path',
  ],
  found: 3,
  none: 8,
  run(t, g) {
    const { open, close } = marker(t);
    const parent = new Int32Array(g.n).fill(-1);
    const seen = new Uint8Array(g.n);
    const pq = new Heap();
    let seq = 0;
    seen[g.start] = 1;
    pq.push([g.h(g.start), seq++, g.start]);
    open(g.start);
    t.step(0, 'Greedy best-first only looks at how close each cell is to the goal, never at the distance already walked.', { cur: g.start });
    while (pq.size) {
      const [hv, , cell] = pq.pop();
      close(cell);
      t.step(2, `Expand ${xy(g.W, cell)}, which is ${plural(hv, 'step')} from the goal.`, { cur: cell });
      if (cell === g.goal) return walk(parent, cell);
      let added = 0;
      for (const nx of g.nb(cell)) {
        if (seen[nx]) continue;
        seen[nx] = 1;
        parent[nx] = cell;
        pq.push([g.h(nx), seq++, nx]);
        open(nx);
        added++;
      }
      if (added) t.step(7, `Add ${plural(added, 'neighbour')} to the open set, ranked by distance to the goal.`, { cur: cell });
    }
    return null;
  },
};

const bidirectional = {
  weighted: false,
  code: [
    'from_start = [start]; from_goal = [goal]',
    'while both frontiers are non-empty:',
    '  expand one full layer from the start side',
    '  expand one full layer from the goal side',
    '  if a new cell touches the other side:',
    '    return path to it + path from it to goal',
    'return no path',
  ],
  found: 5,
  none: 6,
  run(t, g) {
    const { open, close } = marker(t);
    const side = (root) => {
      const s = { parent: new Int32Array(g.n).fill(-1), dist: new Int32Array(g.n).fill(-1), q: [root] };
      s.dist[root] = 0;
      open(root);
      return s;
    };
    const S = side(g.start);
    const G = side(g.goal);
    t.step(0, 'Search from both ends at once. Two small circles cover far less ground than one big one.', { cur: -1 });
    while (S.q.length && G.q.length) {
      for (const [me, other, name, line] of [
        [S, G, 'start', 2],
        [G, S, 'goal', 3],
      ]) {
        let best = null;
        const next = [];
        for (const cell of me.q) {
          close(cell);
          for (const nx of g.nb(cell)) {
            if (other.dist[nx] !== -1) {
              const len = me.dist[cell] + 1 + other.dist[nx];
              if (!best || len < best.len) best = me === S ? { a: cell, b: nx, len } : { a: nx, b: cell, len };
            }
            if (me.dist[nx] !== -1) continue;
            me.dist[nx] = me.dist[cell] + 1;
            me.parent[nx] = cell;
            next.push(nx);
            open(nx);
          }
          t.step(line, `Expand ${xy(g.W, cell)} on the ${name} side, ${plural(me.dist[cell], 'step')} out.`, { cur: cell });
        }
        me.q = next;
        if (best) {
          t.step(4, `The two searches touch between ${xy(g.W, best.a)} and ${xy(g.W, best.b)}.`, { cur: best.b });
          const toGoal = walk(G.parent, best.b).reverse();
          return walk(S.parent, best.a).concat(toGoal);
        }
        if (!me.q.length) return null;
      }
    }
    return null;
  },
};

export const searches = { bfs, dfs, dijkstra, astar, greedy, bidirectional };

export function runSearch(id, board) {
  const { W, H, cells, start, goal } = board;
  const n = W * H;
  const algo = searches[id];
  const g = {
    W,
    H,
    n,
    start,
    goal,
    nb: (i) => neighbours(W, H, i).filter((j) => cells[j] !== WALL),
    cost: (i) => cellCost(cells, i),
    h: (i) => manhattan(W, i, goal),
  };
  const t = createGridTracer(n);
  t.step(null, 'Draw walls, then press play to watch the search.', { cur: -1, pathN: 0 });
  let path = null;
  try {
    path = algo.run(t, g);
    if (path) {
      t.stats.pathLen = path.length - 1;
      t.stats.cost = pathCost(cells, path);
      for (let k = 0; k < path.length; k++) {
        t.set(path[k], PATH);
        const last = k === path.length - 1;
        t.step(
          algo.found,
          last
            ? `Path found: ${plural(t.stats.pathLen, 'step')}, total cost ${t.stats.cost}, after visiting ${t.stats.visited} cells.`
            : k === 0
              ? 'Reached the goal. Follow the parent links to trace the path.'
              : `Tracing the path: ${k + 1} of ${path.length} cells.`,
          { cur: path[k], pathN: k + 1 },
        );
      }
    } else {
      t.step(algo.none, 'Nothing left to explore and the goal was never reached. There is no path.', { cur: -1, pathN: 0 });
    }
  } catch (e) {
    if (!(e instanceof GridLimit)) throw e;
    t.steps.push({ ...t.steps[t.steps.length - 1], msg: 'Stopped: this run is too long to animate.' });
  }
  return { kind: 'search', W, H, steps: t.steps, snaps: t.snaps, path: path ?? [] };
}

// ---------- maze generators ----------
// Cells live on odd (row, col); walls sit between them on even lines.

const cellDirs = (W) => [-2 * W, 2, 2 * W, -2];

function inMaze(W, H, from, to) {
  const r = Math.floor(to / W);
  const c = to % W;
  if (r < 1 || r > H - 2 || c < 1 || c > W - 2) return false;
  // stop wrap-around across rows
  return Math.abs(c - (from % W)) <= 2;
}

const backtracker = {
  code: [
    'fill the grid with walls',
    'stack = [start cell]; carve(start)',
    'while stack is not empty:',
    '  cell = stack.top()',
    '  pick a random uncarved cell two steps away',
    '  if there is one:',
    '    carve the wall between them, then the new cell',
    '    stack.push(new cell)',
    '  else: stack.pop()          # dead end, back up',
  ],
  statLabel: 'Cells carved',
  init: (s) => s.fill(WALL),
  run(t, W, H, rand) {
    t.step(0, 'Start with every cell walled in.', { cur: -1 });
    const start = W + 1;
    const carved = new Uint8Array(W * H);
    const stack = [start];
    const links = [-1];
    carved[start] = 1;
    t.set(start, MARK);
    t.stats.visited = 1;
    t.stats.frontier = 1;
    t.step(1, 'Carve the top-left cell and push it on the stack. Amber cells are the stack.', { cur: start });
    while (stack.length) {
      const cell = stack[stack.length - 1];
      const options = cellDirs(W)
        .map((d) => cell + d)
        .filter((nx) => inMaze(W, H, cell, nx) && !carved[nx]);
      if (options.length) {
        const nx = options[Math.floor(rand() * options.length)];
        const mid = (cell + nx) / 2;
        carved[nx] = 1;
        t.set(mid, MARK);
        t.set(nx, MARK);
        stack.push(nx);
        links.push(mid);
        t.stats.visited++;
        t.stats.frontier = stack.length;
        t.step(6, `Knock through to a random uncarved neighbour. ${plural(options.length, 'choice')} here.`, { cur: nx });
      } else {
        stack.pop();
        t.set(cell, EMPTY);
        const mid = links.pop();
        if (mid !== -1) t.set(mid, EMPTY);
        t.stats.frontier = stack.length;
        t.step(8, 'Dead end: every neighbour is carved. Back up one cell.', { cur: stack[stack.length - 1] ?? -1 });
      }
    }
  },
};

const prim = {
  code: [
    'fill the grid with walls',
    'carve a random cell; add the cells two steps away to the frontier',
    'while the frontier is not empty:',
    '  cell = remove a random frontier cell',
    '  link = a random carved cell two steps from it',
    '  carve cell and the wall between cell and link',
    '  add its uncarved neighbours to the frontier',
  ],
  statLabel: 'Cells carved',
  init: (s) => s.fill(WALL),
  run(t, W, H, rand) {
    t.step(0, 'Start with every cell walled in.', { cur: -1 });
    const cols = (W - 1) / 2;
    const rows = (H - 1) / 2;
    const start = (1 + 2 * Math.floor(rand() * rows)) * W + 1 + 2 * Math.floor(rand() * cols);
    const frontier = [];
    const grow = (cell) => {
      for (const d of cellDirs(W)) {
        const nx = cell + d;
        if (inMaze(W, H, cell, nx) && t.state[nx] === WALL) {
          t.set(nx, MARK);
          frontier.push(nx);
        }
      }
      t.stats.frontier = frontier.length;
    };
    t.set(start, EMPTY);
    t.stats.visited = 1;
    grow(start);
    t.step(1, 'Carve one random cell. Its neighbours two steps away form the frontier (amber).', { cur: start });
    while (frontier.length) {
      const k = Math.floor(rand() * frontier.length);
      const cell = frontier[k];
      frontier[k] = frontier[frontier.length - 1];
      frontier.pop();
      const links = cellDirs(W)
        .map((d) => cell + d)
        .filter((nx) => inMaze(W, H, cell, nx) && t.state[nx] === EMPTY);
      const link = links[Math.floor(rand() * links.length)];
      t.set((cell + link) / 2, EMPTY);
      t.set(cell, EMPTY);
      t.stats.visited++;
      grow(cell);
      t.step(5, `Pick a random frontier cell and join it to the maze. ${plural(frontier.length, 'cell')} left on the frontier.`, { cur: cell });
    }
  },
};

const division = {
  code: [
    'start with an open room inside a border wall',
    'divide(room):',
    '  if the room is one cell thin: return',
    '  split across the shorter side',
    '  build a wall along an even line',
    '  leave one gap on an odd cell',
    '  divide(each half)',
  ],
  statLabel: 'Walls built',
  init(s, W, H) {
    for (let i = 0; i < s.length; i++) {
      const r = Math.floor(i / W);
      const c = i % W;
      s[i] = r === 0 || c === 0 || r === H - 1 || c === W - 1 ? WALL : EMPTY;
    }
  },
  run(t, W, H, rand) {
    t.step(0, 'Start with one big open room.', { cur: -1 });
    const divide = (x0, y0, x1, y1) => {
      const w = x1 - x0;
      const h = y1 - y0;
      if (w < 2 && h < 2) return;
      const vertical = h < 2 || (w >= 2 && (w > h || (w === h && rand() < 0.5)));
      if (vertical) {
        const wx = x0 + 1 + 2 * Math.floor(rand() * (w / 2));
        const gap = y0 + 2 * Math.floor(rand() * (h / 2 + 1));
        t.step(3, `This room is ${w + 1} wide and ${h + 1} tall, so split it with a vertical wall.`, { cur: gap * W + wx });
        for (let y = y0; y <= y1; y++) {
          if (y === gap) continue;
          t.set(y * W + wx, WALL);
          t.stats.visited++;
          t.step(4, 'Build the wall one cell at a time.', { cur: y * W + wx });
        }
        t.step(5, 'The gap keeps both halves connected.', { cur: gap * W + wx });
        divide(x0, y0, wx - 1, y1);
        divide(wx + 1, y0, x1, y1);
      } else {
        const wy = y0 + 1 + 2 * Math.floor(rand() * (h / 2));
        const gap = x0 + 2 * Math.floor(rand() * (w / 2 + 1));
        t.step(3, `This room is ${w + 1} wide and ${h + 1} tall, so split it with a horizontal wall.`, { cur: wy * W + gap });
        for (let x = x0; x <= x1; x++) {
          if (x === gap) continue;
          t.set(wy * W + x, WALL);
          t.stats.visited++;
          t.step(4, 'Build the wall one cell at a time.', { cur: wy * W + x });
        }
        t.step(5, 'The gap keeps both halves connected.', { cur: wy * W + gap });
        divide(x0, y0, x1, wy - 1);
        divide(x0, wy + 1, x1, y1);
      }
    };
    divide(1, 1, W - 2, H - 2);
  },
};

export const mazes = { 'maze-dfs': backtracker, 'maze-prim': prim, 'maze-division': division };

export function runMaze(id, W, H, seed) {
  const gen = mazes[id];
  const init = new Uint8Array(W * H);
  gen.init(init, W, H);
  const t = createGridTracer(W * H, init, { maxSteps: 40000 });
  gen.run(t, W, H, rng(seed));
  t.step(null, 'The maze is ready: exactly one route joins any two cells. Search it next.', { cur: -1 });
  return { kind: 'maze', W, H, steps: t.steps, snaps: t.snaps, path: [], walls: t.state.slice() };
}

/** Final walls only, for the instant "Generate maze" button. */
export const generateMaze = (id, W, H, seed = Math.floor(Math.random() * 2 ** 32)) => runMaze(id, W, H, seed).walls;
