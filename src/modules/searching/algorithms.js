// Each run(t, target, opts) drives an array tracer (core/arrayTracer.js) and returns its answer,
// so tests can check it. Line numbers index into `code`.

/** Pointer marks, merging names that land on the same index ("lo=mid") so labels never overlap. */
function ptrs(named) {
  const at = {};
  for (const [name, i] of Object.entries(named)) {
    if (i == null) continue;
    (at[i] ||= []).push(name);
  }
  return Object.fromEntries(Object.entries(at).map(([i, names]) => [names.join('='), Number(i)]));
}

function found(t, i, line, msg) {
  t.mark({ range: undefined, pivot: undefined, ptr: undefined });
  t.step(line, msg ?? `Found ${t.a[i]} at index ${i}.`, { found: i });
  return i;
}

function missing(t, line, target, why) {
  t.mark({ pivot: undefined, ptr: undefined });
  t.step(line, `${why} ${target} is not in the array.`);
  return -1;
}

const linear = {
  sorted: false,
  code: ['for i in 0 .. n-1:', '  if a[i] == target:', '    return i', 'return -1        # not found'],
  run(t, target) {
    for (let i = 0; i < t.n; i++) {
      t.mark({ ptr: { i } });
      if (t.cmpVal(i, target, 1, `Is a[${i}] = ${t.a[i]} equal to ${target}?`) === 0) {
        return found(t, i, 2, `a[${i}] is ${target}. Found it after checking ${i + 1} element${i ? 's' : ''}.`);
      }
    }
    return missing(t, 3, target, 'Checked every element and none matched, so');
  },
};

const binaryCode = [
  'lo = 0; hi = n - 1',
  'while lo <= hi:',
  '  mid = (lo + hi) // 2',
  '  if a[mid] == target: return mid',
  '  if a[mid] < target: lo = mid + 1',
  '  else: hi = mid - 1',
  'return -1',
];

/** Binary search over [lo, hi]; `L` maps the logical lines onto the caller's code. */
function binaryCore(t, target, lo, hi, L) {
  const a = t.a;
  t.mark({ range: [lo, hi], ptr: ptrs({ lo, hi }), pivot: undefined });
  t.step(L.init, `Search indices ${lo} to ${hi}.`);
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    t.mark({ range: [lo, hi], pivot: mid, ptr: ptrs({ lo, mid, hi }) });
    t.step(L.mid, `The middle of ${lo}..${hi} is index ${mid}.`);
    const d = t.cmpVal(mid, target, L.eq, `Is a[${mid}] = ${a[mid]} equal to ${target}?`);
    if (d === 0) return found(t, mid, L.eq, `a[${mid}] is ${target}. Found it.`);
    if (d < 0) {
      lo = mid + 1;
      t.mark({ range: [lo, hi], pivot: undefined, ptr: ptrs({ lo, hi }) });
      t.step(L.lt, `${a[mid]} is smaller than ${target}, so the target can only be to the right. Drop the left half.`);
    } else {
      hi = mid - 1;
      t.mark({ range: [lo, hi], pivot: undefined, ptr: ptrs({ lo, hi }) });
      t.step(L.gt, `${a[mid]} is bigger than ${target}, so the target can only be to the left. Drop the right half.`);
    }
  }
  return missing(t, L.none, target, 'lo has passed hi, so the window is empty and');
}

const binary = {
  sorted: true,
  code: binaryCode,
  run(t, target) {
    return binaryCore(t, target, 0, t.n - 1, { init: 0, mid: 2, eq: 3, lt: 4, gt: 5, none: 6 });
  },
};

const jump = {
  sorted: true,
  code: [
    'step = floor(sqrt(n)); prev = 0',
    'while a[min(step, n) - 1] < target:',
    '  prev = step; step += floor(sqrt(n))',
    '  if prev >= n: return -1',
    'for i in prev .. min(step, n) - 1:',
    '  if a[i] == target: return i',
    'return -1',
  ],
  run(t, target) {
    const n = t.n;
    const a = t.a;
    const size = Math.max(1, Math.floor(Math.sqrt(n)));
    let step = size;
    let prev = 0;
    t.mark({ range: [0, Math.min(step, n) - 1] });
    t.step(0, `Jump ahead in blocks of √${n} ≈ ${size}.`);
    for (;;) {
      const end = Math.min(step, n) - 1;
      t.mark({ range: [prev, end], ptr: ptrs({ prev, end }) });
      if (t.cmpVal(end, target, 1, `Block ${prev}..${end} ends with ${a[end]}. Is that smaller than ${target}?`) >= 0) break;
      prev = step;
      step += size;
      if (prev >= n) {
        t.mark({ range: [n, n - 1] });
        return missing(t, 3, target, 'Jumped past the end, every value is smaller, so');
      }
      t.mark({ range: [prev, Math.min(step, n) - 1], ptr: ptrs({ prev }) });
      t.step(2, `${target} is further on. Jump to the block starting at ${prev}.`);
    }
    const end = Math.min(step, n) - 1;
    t.step(4, `${target} must be in block ${prev}..${end} if anywhere. Scan it one by one.`);
    for (let i = prev; i <= end; i++) {
      t.mark({ ptr: ptrs({ i }) });
      const d = t.cmpVal(i, target, 5, `Is a[${i}] = ${a[i]} equal to ${target}?`);
      if (d === 0) return found(t, i, 5);
      if (d > 0) break;
    }
    return missing(t, 6, target, 'The block has no match, so');
  },
};

const interpolation = {
  sorted: true,
  code: [
    'lo = 0; hi = n - 1',
    'while lo <= hi and a[lo] <= target <= a[hi]:',
    '  pos = lo + (target - a[lo]) * (hi - lo) // (a[hi] - a[lo])',
    '  if a[pos] == target: return pos',
    '  if a[pos] < target: lo = pos + 1',
    '  else: hi = pos - 1',
    'return -1',
  ],
  run(t, target) {
    const a = t.a;
    let lo = 0;
    let hi = t.n - 1;
    t.mark({ range: [lo, hi], ptr: ptrs({ lo, hi }) });
    t.step(0, 'Guess where the target sits from its value, like opening a dictionary near the right letter.');
    for (;;) {
      if (lo > hi) break;
      t.countCmp(2);
      t.step(1, `Is ${target} between a[${lo}] = ${a[lo]} and a[${hi}] = ${a[hi]}?`, { cmp: [lo, hi] });
      if (target < a[lo] || target > a[hi]) break;
      const pos = a[hi] === a[lo] ? lo : lo + Math.floor(((target - a[lo]) * (hi - lo)) / (a[hi] - a[lo]));
      t.mark({ pivot: pos, ptr: ptrs({ lo, pos, hi }) });
      t.step(2, `${target} is ${Math.round(((target - a[lo]) / Math.max(1, a[hi] - a[lo])) * 100)}% of the way from ${a[lo]} to ${a[hi]}, so probe index ${pos}.`);
      const d = t.cmpVal(pos, target, 3, `Is a[${pos}] = ${a[pos]} equal to ${target}?`);
      if (d === 0) return found(t, pos, 3);
      if (d < 0) {
        lo = pos + 1;
        t.mark({ range: [lo, hi], pivot: undefined, ptr: ptrs({ lo, hi }) });
        t.step(4, `${a[pos]} is too small. Move lo to ${lo}.`);
      } else {
        hi = pos - 1;
        t.mark({ range: [lo, hi], pivot: undefined, ptr: ptrs({ lo, hi }) });
        t.step(5, `${a[pos]} is too big. Move hi to ${hi}.`);
      }
    }
    return missing(t, 6, target, `${target} is outside the remaining range, so`);
  },
};

const exponential = {
  sorted: true,
  code: [
    'if a[0] == target: return 0',
    'i = 1',
    'while i < n and a[i] <= target:',
    '  i = i * 2',
    'binary search a[i/2 .. min(i, n-1)]:',
    '  while lo <= hi:',
    '    mid = (lo + hi) // 2',
    '    if a[mid] == target: return mid',
    '    if a[mid] < target: lo = mid + 1',
    '    else: hi = mid - 1',
    'return -1',
  ],
  run(t, target) {
    const n = t.n;
    const a = t.a;
    t.mark({ ptr: { i: 0 } });
    if (t.cmpVal(0, target, 0, `Is the first element ${a[0]} equal to ${target}?`) === 0) return found(t, 0, 0);
    let i = 1;
    t.mark({ range: [0, Math.min(i, n - 1)], ptr: { i } });
    t.step(1, 'Double a bound until it passes the target.');
    while (i < n) {
      t.mark({ range: [0, i], ptr: { i } });
      if (t.cmpVal(i, target, 2, `Is a[${i}] = ${a[i]} at most ${target}?`) > 0) break;
      i *= 2;
      t.mark({ range: [0, Math.min(i, n - 1)], ptr: { i: Math.min(i, n - 1) } });
      t.step(3, `Still not past ${target}. Double the bound to ${i}${i >= n ? ' (clamped to the end)' : ''}.`);
    }
    const lo = i >> 1;
    const hi = Math.min(i, n - 1);
    t.step(4, `${target} lies in ${lo}..${hi} if anywhere. Binary search that slice.`);
    return binaryCore(t, target, lo, hi, { init: 4, mid: 6, eq: 7, lt: 8, gt: 9, none: 10 });
  },
};

const ternary = {
  sorted: true,
  code: [
    'lo = 0; hi = n - 1',
    'while lo <= hi:',
    '  m1 = lo + (hi - lo) // 3; m2 = hi - (hi - lo) // 3',
    '  if a[m1] == target: return m1',
    '  if a[m2] == target: return m2',
    '  if target < a[m1]: hi = m1 - 1',
    '  elif target > a[m2]: lo = m2 + 1',
    '  else: lo = m1 + 1; hi = m2 - 1',
    'return -1',
  ],
  run(t, target) {
    const a = t.a;
    let lo = 0;
    let hi = t.n - 1;
    t.mark({ range: [lo, hi], ptr: ptrs({ lo, hi }) });
    t.step(0, 'Cut the window into thirds each round instead of halves.');
    while (lo <= hi) {
      const third = Math.floor((hi - lo) / 3);
      const m1 = lo + third;
      const m2 = hi - third;
      t.mark({ range: [lo, hi], pivot: m1, ptr: ptrs({ lo, m1, m2, hi }) });
      t.step(2, `Split ${lo}..${hi} at ${m1} and ${m2}.`);
      if (t.cmpVal(m1, target, 3, `Is a[${m1}] = ${a[m1]} equal to ${target}?`) === 0) return found(t, m1, 3);
      if (t.cmpVal(m2, target, 4, `Is a[${m2}] = ${a[m2]} equal to ${target}?`) === 0) return found(t, m2, 4);
      if (target < a[m1]) {
        hi = m1 - 1;
        t.mark({ range: [lo, hi], pivot: undefined, ptr: ptrs({ lo, hi }) });
        t.step(5, `${target} is below ${a[m1]}: keep only the left third.`);
      } else if (target > a[m2]) {
        lo = m2 + 1;
        t.mark({ range: [lo, hi], pivot: undefined, ptr: ptrs({ lo, hi }) });
        t.step(6, `${target} is above ${a[m2]}: keep only the right third.`);
      } else {
        lo = m1 + 1;
        hi = m2 - 1;
        t.mark({ range: [lo, hi], pivot: undefined, ptr: ptrs({ lo, hi }) });
        t.step(7, `${target} is between ${a[m1]} and ${a[m2]}: keep the middle third.`);
      }
    }
    return missing(t, 8, target, 'The window is empty, so');
  },
};

const pairSum = {
  sorted: true,
  usesSum: true,
  code: [
    'L = 0; R = n - 1',
    'while L < R:',
    '  sum = a[L] + a[R]',
    '  if sum == target: return (L, R)',
    '  if sum < target: L += 1     # need a bigger sum',
    '  else: R -= 1                # need a smaller sum',
    'return none',
  ],
  run(t, target) {
    const a = t.a;
    let L = 0;
    let R = t.n - 1;
    t.mark({ range: [L, R], ptr: ptrs({ L, R }), vars: { sum: null } });
    t.step(0, `Look for two values that add up to ${target}. Start with the smallest and the largest.`);
    while (L < R) {
      const sum = a[L] + a[R];
      t.countCmp(1);
      t.mark({ range: [L, R], ptr: ptrs({ L, R }), vars: { sum } });
      t.step(2, `${a[L]} + ${a[R]} = ${sum}.`, { cmp: [L, R] });
      if (sum === target) {
        t.done(L, R);
        t.mark({ range: undefined, ptr: ptrs({ L, R }) });
        t.step(3, `${a[L]} + ${a[R]} = ${target}. The pair is at indices ${L} and ${R}.`);
        return [L, R];
      }
      if (sum < target) {
        L++;
        t.mark({ range: [L, R], ptr: ptrs({ L, R }) });
        t.step(4, `${sum} is too small. Moving R left would only shrink it, so move L right.`);
      } else {
        R--;
        t.mark({ range: [L, R], ptr: ptrs({ L, R }) });
        t.step(5, `${sum} is too big. Moving L right would only grow it, so move R left.`);
      }
    }
    t.mark({ ptr: undefined });
    t.step(6, `The pointers met. No two values add up to ${target}.`);
    return null;
  },
};

const slidingWindow = {
  sorted: false,
  usesK: true,
  code: [
    'sum = a[0] + ... + a[k-1]',
    'best = sum; start = 0',
    'for i in k .. n-1:',
    '  sum += a[i] - a[i-k]      # slide right by one',
    '  if sum > best:',
    '    best = sum; start = i - k + 1',
    'return a[start .. start+k-1]',
  ],
  run(t, _target, { k = 4 } = {}) {
    const a = t.a;
    const n = t.n;
    k = Math.max(1, Math.min(k, n));
    let sum = 0;
    for (let i = 0; i < k; i++) {
      sum += a[i];
      t.mark({ range: [0, i], vars: { sum, best: null } });
      t.read(i, 0, `Add ${a[i]} to the first window. Sum is ${sum}.`);
    }
    let best = sum;
    let start = 0;
    t.mark({ range: [0, k - 1], pivot: 0, vars: { sum, best } });
    t.step(1, `The first window sums to ${sum}. That is the best so far.`);
    for (let i = k; i < n; i++) {
      sum += a[i] - a[i - k];
      t.countCmp(1);
      t.mark({ range: [i - k + 1, i], ptr: ptrs({ in: i }), vars: { sum, best } });
      t.step(3, `Add ${a[i]} and drop ${a[i - k]}: the window ${i - k + 1}..${i} sums to ${sum}.`, { cmp: [i, i - k] });
      if (sum > best) {
        best = sum;
        start = i - k + 1;
        t.mark({ pivot: start, vars: { sum, best } });
        t.step(5, `${sum} beats the old best. Remember the window starting at ${start}.`);
      } else {
        t.step(4, `${sum} does not beat the best of ${best}.`);
      }
    }
    for (let i = start; i < start + k; i++) t.done(i);
    t.mark({ range: undefined, pivot: undefined, ptr: undefined, vars: { sum: best, best } });
    t.step(6, `The best window is ${start}..${start + k - 1} with sum ${best}. Each step reused the last sum, so the whole scan is O(n).`);
    return { start, best };
  },
};

export const searchRunners = {
  linear,
  binary,
  jump,
  interpolation,
  exponential,
  ternary,
  'two-pointers': pairSum,
  'sliding-window': slidingWindow,
};

/** n distinct random values, returned in random order. */
export function distinctValues(n) {
  const top = Math.max(99, n * 2);
  const pool = Array.from({ length: top - 2 }, (_, i) => i + 3);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

const pick = (list) => list[Math.floor(Math.random() * list.length)];

/** A target that is in the array (a pair sum when `sums`). */
export function presentTarget(a, sums) {
  if (!sums) return pick(a);
  const i = Math.floor(Math.random() * a.length);
  let j = Math.floor(Math.random() * (a.length - 1));
  if (j >= i) j++;
  return a[i] + a[j];
}

/** A target that is not in the array (or not reachable as a pair sum). */
export function missingTarget(a, sums) {
  const have = new Set();
  if (sums) a.forEach((x, i) => a.forEach((y, j) => i < j && have.add(x + y)));
  else a.forEach((x) => have.add(x));
  const lo = Math.min(...have);
  const hi = Math.max(...have);
  const gaps = [];
  for (let v = lo + 1; v < hi; v++) if (!have.has(v)) gaps.push(v);
  return gaps.length ? pick(gaps) : hi + 1;
}
