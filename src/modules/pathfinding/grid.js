// Board model and the compact step-trace used by every pathfinding and maze run.

export const EMPTY = 0;
export const WALL = 1;
export const WEIGHT = 2;
export const WEIGHT_COST = 5;

// overlay states recorded by a search trace
export const OPEN = 1;
export const CLOSED = 2;
export const PATH = 3;
// maze traces record the walls themselves; MARK is a stack / frontier cell
export const MARK = 4;

export const SNAP_EVERY = 64;

const odd = (x) => x | 1;

export function gridSize(width = window.innerWidth) {
  if (width < 640) return { W: 21, H: 15 };
  if (width < 1100) return { W: 31, H: 19 };
  return { W: 41, H: 23 };
}

export function emptyBoard(W, H) {
  const r = odd(Math.floor(H / 2));
  return {
    W,
    H,
    cells: new Uint8Array(W * H),
    start: r * W + odd(Math.floor(W / 5)),
    goal: r * W + Math.min(W - 2, odd(Math.floor((W * 4) / 5))),
  };
}

export const neighbours = (W, H, i) => {
  const r = Math.floor(i / W);
  const c = i % W;
  const out = [];
  if (r > 0) out.push(i - W);
  if (c < W - 1) out.push(i + 1);
  if (r < H - 1) out.push(i + W);
  if (c > 0) out.push(i - 1);
  return out;
};

export const manhattan = (W, a, b) => Math.abs((a % W) - (b % W)) + Math.abs(Math.floor(a / W) - Math.floor(b / W));

export const cellCost = (cells, i) => (cells[i] === WEIGHT ? WEIGHT_COST : 1);

export function pathCost(cells, path) {
  let c = 0;
  for (let k = 1; k < path.length; k++) c += cellCost(cells, path[k]);
  return c;
}

export class GridLimit extends Error {}

/**
 * Records a Uint8Array per step as deltas ([cell, value, cell, value…]) plus a full
 * snapshot every SNAP_EVERY steps, so any step can be rebuilt in O(cells + 64·deltas).
 */
export function createGridTracer(size, init, { maxSteps = 20000 } = {}) {
  const state = init ? Uint8Array.from(init) : new Uint8Array(size);
  const steps = [];
  const snaps = [];
  const stats = { visited: 0, frontier: 0, pathLen: 0, cost: 0 };
  let d = [];
  return {
    state,
    steps,
    snaps,
    stats,
    set(i, v) {
      if (state[i] === v) return;
      state[i] = v;
      d.push(i, v);
    },
    step(line, msg, extra) {
      if (steps.length >= maxSteps) throw new GridLimit();
      steps.push({ line, msg, d, stats: { ...stats }, ...extra });
      d = [];
      if ((steps.length - 1) % SNAP_EVERY === 0) snaps.push(state.slice());
    },
  };
}

/** The recorded array as it stood after step k. */
export function frameAt(trace, k) {
  const j = Math.floor(k / SNAP_EVERY);
  const out = trace.snaps[j].slice();
  for (let s = j * SNAP_EVERY + 1; s <= k; s++) {
    const d = trace.steps[s].d;
    for (let m = 0; m < d.length; m += 2) out[d[m]] = d[m + 1];
  }
  return out;
}

/**
 * What to draw for one frame, whatever the trace kind:
 * base holds EMPTY / WALL / WEIGHT per cell, overlay holds OPEN / CLOSED / PATH.
 */
export function layersFor(trace, frame, board) {
  if (trace.kind !== 'maze') return { base: board.cells, overlay: frame };
  const base = new Uint8Array(frame.length);
  const overlay = new Uint8Array(frame.length);
  for (let i = 0; i < frame.length; i++) {
    base[i] = frame[i] === WALL ? WALL : EMPTY;
    overlay[i] = frame[i] === MARK ? OPEN : 0;
  }
  return { base, overlay };
}

/** Small seeded RNG so a maze trace can be replayed exactly. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomWalls(board, density = 0.28) {
  const cells = new Uint8Array(board.cells.length);
  for (let i = 0; i < cells.length; i++) {
    if (i !== board.start && i !== board.goal && Math.random() < density) cells[i] = WALL;
  }
  return { ...board, cells };
}

/** Put a generated maze on the board, nudging start and goal onto open (odd, odd) cells. */
export function applyMaze(board, walls) {
  const { W, H } = board;
  const snap = (i) => {
    const r = Math.min(H - 2, odd(Math.floor(i / W)));
    const c = Math.min(W - 2, odd(i % W));
    return r * W + c;
  };
  const start = snap(board.start);
  let goal = snap(board.goal);
  if (goal === start) goal = snap(board.goal + 2 < W * H ? board.goal + 2 : board.goal - 2);
  const cells = new Uint8Array(walls.length);
  for (let i = 0; i < walls.length; i++) cells[i] = walls[i] === WALL ? WALL : EMPTY;
  cells[start] = EMPTY;
  cells[goal] = EMPTY;
  return { ...board, cells, start, goal };
}
