// Backtracking solvers. Each records a trace of plain step objects: { line, msg, stats, …view data }.
// Every trace is capped; when the cap is hit the last step says so and `capped` is set on the result.

export const MAX_STEPS = 30000;

class Limit extends Error {}

function recorder(maxSteps) {
  const steps = [];
  return {
    steps,
    push(s) {
      if (steps.length >= maxSteps) throw new Limit();
      steps.push(s);
    },
    // run the search; on the cap, append an explanatory last step
    run(fn, capMsg) {
      try {
        fn();
        return false;
      } catch (e) {
        if (!(e instanceof Limit)) throw e;
        const last = steps[steps.length - 1];
        steps.push({ ...last, line: null, msg: capMsg, capped: true });
        return true;
      }
    },
  };
}

const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

/* ---------- N-Queens ---------- */

export const queensCode = [
  'solve(row):',
  '  if row == n: record the solution; return',
  '  for col in 0 .. n-1:',
  '    if a placed queen attacks (row, col): continue',
  '    place a queen at (row, col)',
  '    solve(row + 1)',
  '    remove the queen at (row, col)   # backtrack',
];

/**
 * step: { q (col per row, -1 empty), kind: place|conflict|remove|dead|solution|start|end,
 *         at [r,c], conflict {kind: column|diag|anti, by [r,c]}, stats {placements, backtracks, solutions} }
 */
export function solveQueens(n, { all = false, maxSteps = MAX_STEPS } = {}) {
  const q = Array(n).fill(-1);
  const stats = { placements: 0, backtracks: 0, solutions: 0 };
  const rec = recorder(maxSteps);
  const snap = (line, msg, extra) => rec.push({ q: q.slice(), line, msg, stats: { ...stats }, ...extra });
  const solutions = [];

  const attack = (r, c) => {
    for (let i = 0; i < r; i++) {
      const d = q[i];
      if (d === c) return { kind: 'column', by: [i, d] };
      if (i - d === r - c) return { kind: 'diag', by: [i, d] };
      if (i + d === r + c) return { kind: 'anti', by: [i, d] };
    }
    return null;
  };
  const where = (r, c) => `row ${r + 1}, column ${c + 1}`;
  const lineName = { column: 'column', diag: 'diagonal', anti: 'diagonal' };

  const solve = (r) => {
    if (r === n) {
      stats.solutions++;
      solutions.push(q.slice());
      snap(1, `All ${n} queens are placed and none attack each other. Solution ${stats.solutions} found.`, { kind: 'solution' });
      return !all;
    }
    for (let c = 0; c < n; c++) {
      const hit = attack(r, c);
      if (hit) {
        snap(3, `${where(r, c)} is attacked by the queen at ${where(...hit.by)} along the ${lineName[hit.kind]}. Try the next square.`, { kind: 'conflict', at: [r, c], conflict: hit });
        continue;
      }
      q[r] = c;
      stats.placements++;
      snap(4, `${where(r, c)} is safe. Place a queen and move on to row ${r + 2 > n ? n : r + 2}.`, { kind: 'place', at: [r, c] });
      if (solve(r + 1)) return true;
      q[r] = -1;
      stats.backtracks++;
      snap(6, all && stats.solutions ? `Done exploring below ${where(r, c)}. Lift that queen and try further right.` : `Nothing works below ${where(r, c)}. Lift that queen and try further right.`, { kind: 'remove', at: [r, c] });
    }
    if (r > 0) snap(2, `Row ${r + 1} has no safe square left, so go back to row ${r}.`, { kind: 'dead', row: r });
    return false;
  };

  snap(null, `An empty ${n}×${n} board. Place one queen per row so that no two share a column or diagonal.`, { kind: 'start' });
  const capped = rec.run(
    () => solve(0),
    `Stopped after ${MAX_STEPS.toLocaleString()} steps to keep the animation manageable. Solutions found so far: ${stats.solutions}.`,
  );
  if (!capped) {
    const msg = all
      ? `Search finished: ${plural(stats.solutions, 'solution')} on a ${n}×${n} board.`
      : stats.solutions
        ? `Found a solution after ${plural(stats.placements, 'placement')} and ${plural(stats.backtracks, 'backtrack')}.`
        : `No solution exists on a ${n}×${n} board.`;
    rec.steps.push({ ...rec.steps[rec.steps.length - 1], line: null, msg, kind: 'end', q: solutions.length && !all ? solutions[0] : rec.steps[rec.steps.length - 1].q, stats: { ...stats } });
  }
  return { steps: rec.steps, capped, solutions, stats };
}

/** Squares along the attacked line through `at` (for highlighting). */
export function attackLine(n, at, kind) {
  const [r, c] = at;
  const cells = [];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      if ((kind === 'column' && j === c) || (kind === 'diag' && i - j === r - c) || (kind === 'anti' && i + j === r + c) || (kind === 'row' && i === r))
        cells.push(i * n + j);
  return cells;
}

/* ---------- Sudoku ---------- */

export const sudokuCode = [
  'solve():',
  '  cell = next empty cell',
  '  if there is none: solved!',
  '  for d in 1 .. 9:',
  '    if d is already in the row, column or box: next d',
  '    grid[cell] = d',
  '    if solve(): return true',
  '    grid[cell] = 0            # backtrack',
  '  return false',
];

const rc = (i) => `r${Math.floor(i / 9) + 1}c${(i % 9) + 1}`;
const boxOf = (i) => Math.floor(Math.floor(i / 9) / 3) * 3 + Math.floor((i % 9) / 3);
const peersOf = Array.from({ length: 81 }, (_, i) => {
  const r = Math.floor(i / 9);
  const c = i % 9;
  const b = boxOf(i);
  const row = [];
  const col = [];
  const box = [];
  for (let j = 0; j < 81; j++) {
    if (j === i) continue;
    if (Math.floor(j / 9) === r) row.push(j);
    if (j % 9 === c) col.push(j);
    if (boxOf(j) === b) box.push(j);
  }
  return { row, col, box };
});

/** Cells that already hold d in the row, column and box of i. */
export function clashes(g, i, d) {
  const { row, col, box } = peersOf[i];
  return {
    row: row.find((j) => g[j] === d),
    col: col.find((j) => g[j] === d),
    box: box.find((j) => g[j] === d),
  };
}

export const parseSudoku = (s) => Int8Array.from(s.replace(/[^0-9.]/g, '').padEnd(81, '0').slice(0, 81), (ch) => (ch === '.' ? 0 : Number(ch)));

/**
 * step: { g (Int8Array), cur, d, bad [cells], kind: try|place|undo|dead|solved|start|end, stats {tries, backtracks, filled} }
 * mrv = pick the empty cell with the fewest legal digits instead of the next one in reading order.
 */
export function solveSudoku(givens, { mrv = false, maxSteps = MAX_STEPS } = {}) {
  const g = Int8Array.from(givens);
  const stats = { tries: 0, backtracks: 0, filled: 0 };
  const rec = recorder(maxSteps);
  const snap = (line, msg, extra) => rec.push({ g: g.slice(), line, msg, stats: { ...stats }, ...extra });

  // givens must not already clash
  for (let i = 0; i < 81; i++) {
    if (!g[i]) continue;
    const c = clashes(g, i, g[i]);
    const bad = [c.row, c.col, c.box].filter((x) => x != null);
    if (bad.length) {
      snap(null, `The givens already clash: ${g[i]} at ${rc(i)} repeats at ${rc(bad[0])}. Fix the puzzle first.`, { kind: 'end', cur: i, bad });
      return { steps: rec.steps, capped: false, solved: false, grid: g };
    }
  }

  const legal = (i) => {
    let n = 0;
    for (let d = 1; d <= 9; d++) {
      const c = clashes(g, i, d);
      if (c.row == null && c.col == null && c.box == null) n++;
    }
    return n;
  };
  const nextCell = () => {
    if (!mrv) return g.indexOf(0);
    let best = -1;
    let bestN = 10;
    for (let i = 0; i < 81; i++)
      if (!g[i]) {
        const n = legal(i);
        if (n < bestN) [best, bestN] = [i, n];
        if (n <= 1) break;
      }
    return best;
  };

  let solved = false;
  const solve = () => {
    const i = nextCell();
    if (i === -1) {
      solved = true;
      snap(2, 'No empty cells remain: the puzzle is solved.', { kind: 'solved' });
      return true;
    }
    for (let d = 1; d <= 9; d++) {
      stats.tries++;
      const c = clashes(g, i, d);
      const parts = [];
      if (c.row != null) parts.push(`row ${Math.floor(i / 9) + 1} already has a ${d} at ${rc(c.row)}`);
      if (c.col != null) parts.push(`column ${(i % 9) + 1} has one at ${rc(c.col)}`);
      if (c.box != null && c.box !== c.row && c.box !== c.col) parts.push(`its box has one at ${rc(c.box)}`);
      if (parts.length) {
        const bad = [c.row, c.col, c.box].filter((x) => x != null);
        snap(4, `${d} cannot go at ${rc(i)}: ${parts.join(', ')}.`, { kind: 'try', cur: i, d, bad });
        continue;
      }
      g[i] = d;
      stats.filled++;
      snap(5, `${d} fits at ${rc(i)}: no clash in its row, column or box. Place it and move on.`, { kind: 'place', cur: i, d });
      if (solve()) return true;
      g[i] = 0;
      stats.filled--;
      stats.backtracks++;
      snap(7, `Every option after ${d} at ${rc(i)} ran into a dead end. Erase it and try the next digit.`, { kind: 'undo', cur: i, d });
    }
    snap(8, `No digit from 1 to 9 fits at ${rc(i)}, so an earlier choice must be wrong. Go back.`, { kind: 'dead', cur: i });
    return false;
  };

  snap(null, `${81 - g.filter(Boolean).length} empty cells to fill. Try digits one at a time and undo when stuck.`, { kind: 'start' });
  const capped = rec.run(solve, `Stopped after ${MAX_STEPS.toLocaleString()} steps: this puzzle needs a longer search than we animate. Try "Fewest options first".`);
  if (!capped)
    rec.steps.push({
      ...rec.steps[rec.steps.length - 1],
      line: null,
      kind: 'end',
      msg: solved ? `Solved with ${plural(stats.tries, 'digit try')} and ${plural(stats.backtracks, 'backtrack')}.` : 'This puzzle has no solution.',
    });
  return { steps: rec.steps, capped, solved, grid: g };
}

export function sudokuValid(g) {
  for (let i = 0; i < 81; i++) {
    if (g[i] < 1 || g[i] > 9) return false;
    const c = clashes(g, i, g[i]);
    if (c.row != null || c.col != null || c.box != null) return false;
  }
  return true;
}

/* ---------- Rat in a maze ---------- */

export const mazeCode = [
  'solve(cell):',
  '  if cell is outside, a wall, or already visited: return false',
  '  mark cell visited; add it to the path',
  '  if cell is the exit: return true',
  '  for move in [down, right, up, left]:',
  '    if solve(cell + move): return true',
  '  remove cell from the path     # dead end, backtrack',
  '  return false',
];

const DIRS = [
  [1, 0, 'down'],
  [0, 1, 'right'],
  [-1, 0, 'up'],
  [0, -1, 'left'],
];

/** step: { path [idx], dead [idx], cur, blockedAt, kind, stats {visits, backtracks} }. walls: array of booleans (row-major). */
export function solveMaze(n, walls, { maxSteps = MAX_STEPS } = {}) {
  const seen = new Uint8Array(n * n);
  const path = [];
  const dead = [];
  const stats = { visits: 0, backtracks: 0 };
  const rec = recorder(maxSteps);
  const snap = (line, msg, extra) => rec.push({ path: path.slice(), dead: dead.slice(), line, msg, stats: { ...stats }, ...extra });
  const exit = n * n - 1;
  const name = (i) => `(${Math.floor(i / n) + 1}, ${(i % n) + 1})`;
  let found = false;

  const solve = (r, c, dir) => {
    const i = r * n + c;
    const reason = r < 0 || c < 0 || r >= n || c >= n ? 'the edge' : walls[i] ? 'a wall' : seen[i] ? 'a visited cell' : null;
    if (reason) {
      if (reason !== 'the edge') snap(1, `Going ${dir} hits ${reason} at ${name(i)}. Try another direction.`, { kind: 'blocked', blockedAt: i, cur: path[path.length - 1] });
      return false;
    }
    seen[i] = 1;
    path.push(i);
    stats.visits++;
    snap(2, dir ? `Move ${dir} to ${name(i)}. The path is ${path.length} cells long.` : `Start at ${name(i)}.`, { kind: 'move', cur: i });
    if (i === exit) {
      found = true;
      snap(3, `Reached the exit at ${name(i)}! The path uses ${path.length} cells.`, { kind: 'found', cur: i });
      return true;
    }
    for (const [dr, dc, d] of DIRS) if (solve(r + dr, c + dc, d)) return true;
    path.pop();
    dead.push(i);
    stats.backtracks++;
    snap(6, `${name(i)} is a dead end: every direction is blocked. Step back.`, { kind: 'back', cur: path[path.length - 1] });
    return false;
  };

  snap(null, `The rat starts top-left and wants the exit bottom-right. It tries down, right, up, then left.`, { kind: 'start' });
  const capped = rec.run(() => solve(0, 0, null), `Stopped after ${MAX_STEPS.toLocaleString()} steps.`);
  if (!capped)
    rec.steps.push({
      ...rec.steps[rec.steps.length - 1],
      line: null,
      kind: 'end',
      msg: found ? `Path found: ${path.length} cells after ${plural(stats.backtracks, 'backtrack')}.` : 'Every reachable cell was tried. There is no way out.',
    });
  return { steps: rec.steps, capped, found, path: path.slice() };
}

/** Random maze that always has at least one route from top-left to bottom-right. */
export function randomMaze(n, density = 0.34) {
  const walls = Array.from({ length: n * n }, () => Math.random() < density);
  let r = 0;
  let c = 0;
  walls[0] = false;
  // carve a wandering right/down route so the maze is solvable
  while (r < n - 1 || c < n - 1) {
    if (r === n - 1) c++;
    else if (c === n - 1) r++;
    else if (Math.random() < 0.5) r++;
    else c++;
    walls[r * n + c] = false;
  }
  return walls;
}

/* ---------- Knight's tour ---------- */

export const knightCode = [
  'tour(cell, k):',
  '  write move number k on cell',
  '  if k == n²: every square visited, done',
  '  moves = unvisited squares a knight can reach',
  '  (Warnsdorff) sort moves by their own onward-move count',
  '  for next in moves:',
  '    if tour(next, k + 1): return true',
  '  erase cell            # dead end, backtrack',
  '  return false',
];

const JUMPS = [
  [2, 1],
  [1, 2],
  [-1, 2],
  [-2, 1],
  [-2, -1],
  [-1, -2],
  [1, -2],
  [2, -1],
];

/** step: { order (Int16Array move numbers, 0 = unvisited), cur, from, cands [{i, deg}], kind, stats {moves, backtracks} } */
export function solveKnight(n, start = 0, { warnsdorff = true, maxSteps = MAX_STEPS } = {}) {
  const order = new Int16Array(n * n);
  const stats = { moves: 0, backtracks: 0 };
  const rec = recorder(maxSteps);
  const snap = (line, msg, extra) => rec.push({ order: order.slice(), line, msg, stats: { ...stats }, ...extra });
  const name = (i) => `${String.fromCharCode(97 + (i % n))}${n - Math.floor(i / n)}`;
  const nexts = (i) => {
    const r = Math.floor(i / n);
    const c = i % n;
    const out = [];
    for (const [dr, dc] of JUMPS) {
      const rr = r + dr;
      const cc = c + dc;
      if (rr >= 0 && cc >= 0 && rr < n && cc < n && !order[rr * n + cc]) out.push(rr * n + cc);
    }
    return out;
  };
  let done = false;

  const tour = (i, k, from) => {
    order[i] = k;
    stats.moves++;
    if (k === n * n) {
      done = true;
      snap(2, `Move ${k} lands on ${name(i)}: all ${n * n} squares are visited. Tour complete!`, { kind: 'done', cur: i, from, cands: [] });
      return true;
    }
    let cands = nexts(i).map((j) => ({ i: j, deg: nexts(j).length }));
    if (warnsdorff) cands = cands.slice().sort((a, b) => a.deg - b.deg);
    snap(
      warnsdorff ? 4 : 3,
      cands.length
        ? warnsdorff
          ? `Move ${k}: ${name(i)}. ${plural(cands.length, 'option')}; Warnsdorff picks ${name(cands[0].i)}, which has the fewest onward moves (${cands[0].deg}).`
          : `Move ${k}: ${name(i)}. ${plural(cands.length, 'option')}; try them in fixed order, starting with ${name(cands[0].i)}.`
        : `Move ${k}: ${name(i)}. No unvisited square is reachable from here.`,
      { kind: 'move', cur: i, from, cands },
    );
    for (const { i: j } of cands) if (tour(j, k + 1, i)) return true;
    order[i] = 0;
    stats.backtracks++;
    snap(7, `Dead end after ${name(i)}. Erase move ${k} and go back.`, { kind: 'back', cur: from ?? i, from: i, cands: [] });
    return false;
  };

  snap(null, `A knight must visit every square of the ${n}×${n} board exactly once, starting at ${name(start)}.`, { kind: 'start', cur: start, cands: [] });
  const capped = rec.run(
    () => tour(start, 1, null),
    `Stopped after ${MAX_STEPS.toLocaleString()} steps. Plain backtracking can take astronomically long here; switch on Warnsdorff’s rule.`,
  );
  if (!capped)
    rec.steps.push({
      ...rec.steps[rec.steps.length - 1],
      line: null,
      kind: 'end',
      cands: [],
      msg: done ? `Tour found with ${plural(stats.backtracks, 'backtrack')}.` : `No tour exists from ${name(start)} on this board.`,
    });
  return { steps: rec.steps, capped, done, order };
}

/* ---------- Subset sum ---------- */

export const subsetCode = [
  'search(i, sum):',
  '  if sum == target: record the subset; return',
  '  if i == n or sum > target or sum + rest[i] < target:',
  '    prune this branch; return',
  '  search(i + 1, sum + a[i])    # include a[i]',
  '  search(i + 1, sum)           # exclude a[i]',
];

/**
 * Builds the decision tree as it is explored.
 * nodes: [{ id, parent, depth, sum, edge: 'in'|'out'|null, item }]
 * step: { count (nodes visible), status [per node: open|done|pruned|solution], cur, pathIds, kind, stats {nodes, pruned, solutions} }
 */
export function solveSubset(items, target, { all = false, maxSteps = MAX_STEPS } = {}) {
  const n = items.length;
  const rest = Array(n + 1).fill(0);
  for (let i = n - 1; i >= 0; i--) rest[i] = rest[i + 1] + items[i];
  const nodes = [];
  const status = [];
  const stats = { nodes: 0, pruned: 0, solutions: 0 };
  const solutions = [];
  const rec = recorder(maxSteps);
  const pathIds = [];
  const snap = (line, msg, cur, kind) => rec.push({ count: nodes.length, status: status.slice(), cur, pathIds: pathIds.slice(), line, msg, stats: { ...stats }, kind });
  const chosen = [];

  const search = (i, sum, parent, edge) => {
    const id = nodes.length;
    nodes.push({ id, parent, depth: i, sum, edge, item: edge ? items[i - 1] : null });
    status.push('open');
    pathIds.push(id);
    stats.nodes++;
    const how = edge === 'in' ? `Include ${items[i - 1]}: sum = ${sum}.` : edge === 'out' ? `Skip ${items[i - 1]}: sum stays ${sum}.` : `Start with an empty subset: sum = 0.`;
    snap(0, how, id, 'visit');
    if (sum === target) {
      status[id] = 'solution';
      stats.solutions++;
      solutions.push(chosen.slice());
      snap(1, `Sum ${sum} hits the target. {${chosen.join(', ')}} works!`, id, 'solution');
      pathIds.pop();
      return !all;
    }
    const why =
      i === n ? 'no items are left' : sum > target ? `${sum} already exceeds ${target}` : sum + rest[i] < target ? `even adding every remaining item only reaches ${sum + rest[i]}` : null;
    if (why) {
      status[id] = 'pruned';
      stats.pruned++;
      snap(3, `Prune: ${why}.`, id, 'prune');
      pathIds.pop();
      return false;
    }
    chosen.push(items[i]);
    if (search(i + 1, sum + items[i], id, 'in')) return true;
    chosen.pop();
    if (search(i + 1, sum, id, 'out')) return true;
    status[id] = 'done';
    pathIds.pop();
    return false;
  };

  const capped = rec.run(() => search(0, 0, null, null), `Stopped after ${MAX_STEPS.toLocaleString()} steps.`);
  const last = rec.steps[rec.steps.length - 1];
  if (!capped) {
    let msg;
    if (!solutions.length) msg = `No subset of {${items.join(', ')}} adds up to ${target}.`;
    else if (all) msg = `Search finished: ${plural(solutions.length, 'subset')} add up to ${target}.`;
    else msg = `Found {${solutions[0].join(', ')}} = ${target} after visiting ${plural(stats.nodes, 'node')}.`;
    rec.steps.push({ ...last, line: null, msg, kind: 'end', pathIds: solutions.length && !all ? last.pathIds : [] });
  }
  return { steps: rec.steps, nodes, solutions, capped };
}

/** Tidy layout: leaves get consecutive x slots, parents sit over the middle of their children. */
export function layoutTree(nodes) {
  const kids = nodes.map(() => []);
  nodes.forEach((nd) => nd.parent != null && kids[nd.parent].push(nd.id));
  const x = Array(nodes.length).fill(0);
  let slot = 0;
  const place = (id) => {
    if (!kids[id].length) {
      x[id] = slot++;
      return;
    }
    kids[id].forEach(place);
    x[id] = (x[kids[id][0]] + x[kids[id][kids[id].length - 1]]) / 2;
  };
  if (nodes.length) place(0);
  const depth = Math.max(0, ...nodes.map((nd) => nd.depth));
  return { x, width: Math.max(1, slot), depth };
}

/** Knight's-tour squares in move order, for drawing the trail. */
export function trailOf(order) {
  const pos = [];
  order.forEach((k, i) => k && (pos[k - 1] = i));
  return pos.filter((x) => x != null);
}
