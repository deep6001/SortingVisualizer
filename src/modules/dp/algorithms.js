// DP runners. run(input) fills a table and records one step per decision.
// step: { t (table snapshot), cur [r,c], deps [[r,c]…], path [[r,c]…] (traceback so far), line, msg, stats, answer, done }
// result: { steps, rows, cols, rowHeads, colHeads, rowTitle, colTitle, range, note, blocked, out }

export const fmt = (v) => (v == null ? '' : v === Infinity ? '∞' : String(v));

const rand = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

function tracer(rows, cols) {
  const t = Array.from({ length: rows }, () => Array(cols).fill(null));
  const steps = [];
  const path = [];
  const stats = { cells: 0, reads: 0 };
  let answer = '';
  return {
    t,
    path,
    set(r, c, v) {
      t[r][c] = v;
      stats.cells++;
    },
    reads(k = 1) {
      stats.reads += k;
    },
    answer(s) {
      answer = s;
    },
    step(line, msg, cur = null, deps = [], extra) {
      steps.push({ t: t.map((row) => row.slice()), cur, deps, path: path.slice(), line, msg, stats: { ...stats }, answer, ...extra });
    },
    finish(msg) {
      steps.push({ ...steps[steps.length - 1], cur: null, deps: [], line: null, msg, done: true });
    },
    result(meta) {
      let lo = Infinity;
      let hi = -Infinity;
      for (const row of t)
        for (const v of row)
          if (Number.isFinite(v)) {
            lo = Math.min(lo, v);
            hi = Math.max(hi, v);
          }
      if (lo === Infinity) [lo, hi] = [0, 1];
      return { steps, rows, cols, range: [lo, hi], ...meta };
    },
  };
}

const idxHeads = (n, from = 0) => Array.from({ length: n }, (_, i) => ({ label: String(i + from) }));
const charHeads = (s) => [{ label: '∅', sub: 0 }, ...[...s].map((ch, i) => ({ label: ch, sub: i + 1 }))];
const randWord = (n, alphabet = 'ABCDG') => Array.from({ length: n }, () => alphabet[rand(0, alphabet.length - 1)]).join('');
const randList = (n, lo, hi) => Array.from({ length: n }, () => rand(lo, hi));

/* ---------- Fibonacci ---------- */

const fib = {
  code: ['F[0] = 0;  F[1] = 1', 'for i in 2 .. n:', '  F[i] = F[i-1] + F[i-2]', 'return F[n]'],
  defaults: () => ({ n: 10 }),
  random: () => ({ n: rand(6, 16) }),
  run({ n }) {
    const T = tracer(1, n + 1);
    T.step(null, `One slot for each of F(0) … F(${n}). Every slot is computed exactly once, left to right.`);
    T.set(0, 0, 0);
    T.step(0, 'Base case: F(0) = 0.', [0, 0]);
    T.set(0, 1, 1);
    T.step(0, 'Base case: F(1) = 1.', [0, 1]);
    for (let i = 2; i <= n; i++) {
      const a = T.t[0][i - 1];
      const b = T.t[0][i - 2];
      T.reads(2);
      T.set(0, i, a + b);
      T.step(2, `F(${i}) = F(${i - 1}) + F(${i - 2}) = ${a} + ${b} = ${a + b}. Both are already in the table, so nothing is recomputed.`, [0, i], [
        [0, i - 1],
        [0, i - 2],
      ]);
    }
    const value = T.t[0][n];
    let f0 = 0;
    let f1 = 1;
    for (let i = 0; i < n + 1; i++) [f0, f1] = [f1, f0 + f1];
    const calls = 2 * f0 - 1; // naive recursion makes 2·F(n+1) − 1 calls
    T.path.push([0, n]);
    T.answer(`F(${n}) = ${value}`);
    T.step(3, `F(${n}) = ${value}. The table did ${Math.max(0, n - 1)} additions; naive recursion would make ${calls.toLocaleString()} calls.`, null);
    T.finish(`Done. F(${n}) = ${value}.`);
    return T.result({
      rowHeads: [{ label: 'F' }],
      colHeads: idxHeads(n + 1),
      colTitle: 'i',
      note: `Naive recursive fib(${n}) makes ${calls.toLocaleString()} calls because it recomputes the same values again and again. The table needs ${n + 1} slots.`,
      out: { value, calls },
    });
  },
};

/* ---------- Coin change ---------- */

const coinCode = {
  min: [
    'dp[0][0] = 0;  dp[0][a > 0] = ∞',
    'for each coin i with value c:',
    '  for a in 0 .. amount:',
    '    skip = dp[i-1][a]              # don’t use coin c',
    '    take = dp[i][a-c] + 1 if c ≤ a  # one more coin c',
    '    dp[i][a] = min(skip, take)',
    'walk back from dp[k][amount] to list the coins',
  ],
  ways: [
    'ways[0][0] = 1;  ways[0][a > 0] = 0',
    'for each coin i with value c:',
    '  for a in 0 .. amount:',
    '    ways[i][a] = ways[i-1][a]        # without coin c',
    '    if c ≤ a: ways[i][a] += ways[i][a-c]  # with coin c',
    '    (both kinds counted, order ignored)',
    'walk back from ways[k][amount] to show one way',
  ],
};

const coins = {
  codeFor: (input) => coinCode[input.mode],
  defaults: () => ({ coins: [1, 2, 5], amount: 11, mode: 'min' }),
  random: (prev) => {
    const set = new Set([rand(1, 3)]);
    while (set.size < rand(2, 4)) set.add(rand(2, 9));
    return { coins: [...set].sort((a, b) => a - b), amount: rand(8, 18), mode: prev?.mode ?? 'min' };
  },
  run({ coins: cs, amount, mode }) {
    const k = cs.length;
    const T = tracer(k + 1, amount + 1);
    const min = mode === 'min';
    const name = min ? 'dp' : 'ways';
    T.step(null, min ? `Row i uses only the first i coins; column a is the amount. Each cell holds the fewest coins that make a.` : `Row i uses only the first i coins; column a is the amount. Each cell counts the ways to make a.`);
    for (let a = 0; a <= amount; a++) T.set(0, a, min ? (a === 0 ? 0 : Infinity) : a === 0 ? 1 : 0);
    T.step(0, min ? 'With no coins only amount 0 is possible (0 coins). Every other amount is ∞, meaning impossible.' : 'With no coins there is exactly one way to make 0 (take nothing) and no way to make anything else.');
    for (let i = 1; i <= k; i++) {
      const c = cs[i - 1];
      for (let a = 0; a <= amount; a++) {
        const skip = T.t[i - 1][a];
        const deps = [[i - 1, a]];
        let v;
        let msg;
        if (c > a) {
          v = skip;
          T.reads(1);
          msg = `Coin ${c} is bigger than ${a}, so ${name}[${i}][${a}] copies the row above: ${fmt(skip)}.`;
        } else {
          const prev = T.t[i][a - c];
          deps.push([i, a - c]);
          T.reads(2);
          if (min) {
            const take = prev + 1;
            v = Math.min(skip, take);
            msg = `${name}[${i}][${a}] = min(without ${c}: ${fmt(skip)}, one more ${c} on ${name}[${i}][${a - c}]: ${fmt(prev)} + 1 = ${fmt(take)}) = ${fmt(v)}.`;
          } else {
            v = skip + prev;
            msg = `${name}[${i}][${a}] = ${skip} ways without coin ${c} + ${prev} ways ending with a ${c} (from ${name}[${i}][${a - c}]) = ${v}.`;
          }
        }
        T.set(i, a, v);
        T.step(min ? (c > a ? 3 : 5) : c > a ? 3 : 4, msg, [i, a], deps);
      }
    }
    // traceback
    const best = T.t[k][amount];
    const used = [];
    let out;
    if (min ? best === Infinity : best === 0) {
      T.path.push([k, amount]);
      T.answer(`${amount} cannot be made from ${cs.join(', ')}`);
      T.step(6, `${name}[${k}][${amount}] is ${fmt(best)}, so there is no way to make ${amount} from these coins.`);
      out = { value: min ? Infinity : 0, used };
    } else {
      let i = k;
      let a = amount;
      T.path.push([i, a]);
      T.step(6, `Start the walk back at ${name}[${k}][${amount}] = ${best}.`, [i, a]);
      while (a > 0) {
        const c = cs[i - 1];
        const goUp = min ? T.t[i][a] === T.t[i - 1][a] : !(c <= a && T.t[i][a - c] > 0);
        if (goUp) {
          i--;
          T.path.push([i, a]);
          T.step(6, min ? `The value matches the row above, so coin ${c} is not needed here. Move up.` : `No way to finish with coin ${c} here. Move up to fewer coin types.`, [i, a]);
        } else {
          used.push(c);
          a -= c;
          T.path.push([i, a]);
          T.answer(`${used.join(' + ')}${a > 0 ? ' + …' : ` = ${amount}`}`);
          T.step(6, `Use a ${c} coin: move left ${c} columns to amount ${a}.`, [i, a]);
        }
      }
      T.answer(min ? `${best} coin${best === 1 ? '' : 's'}: ${used.join(' + ')} = ${amount}` : `${best} way${best === 1 ? '' : 's'}, for example ${used.join(' + ')} = ${amount}`);
      out = { value: best, used };
    }
    T.finish(min ? `Done. ${fmt(best)} is the fewest coins for ${amount}.` : `Done. There ${best === 1 ? 'is 1 way' : `are ${best} ways`} to make ${amount}.`);
    return T.result({
      rowHeads: [{ label: '∅', sub: 'none' }, ...cs.map((c) => ({ label: String(c), sub: 'coin' }))],
      colHeads: idxHeads(amount + 1),
      rowTitle: 'coins',
      colTitle: 'amount',
      out,
    });
  },
};

/* ---------- 0/1 knapsack ---------- */

const knapsack = {
  code: [
    'K[0][w] = 0 for every w',
    'for i in 1 .. n:',
    '  for w in 0 .. W:',
    '    if wt[i] > w:',
    '      K[i][w] = K[i-1][w]            # item i does not fit',
    '    else:',
    '      K[i][w] = max(K[i-1][w], K[i-1][w-wt[i]] + val[i])',
    'walk back: K[i][w] ≠ K[i-1][w] means item i was taken',
  ],
  defaults: () => ({
    items: [
      { w: 1, v: 1 },
      { w: 3, v: 4 },
      { w: 4, v: 5 },
      { w: 5, v: 7 },
    ],
    cap: 7,
  }),
  random: () => ({ items: Array.from({ length: rand(3, 5) }, () => ({ w: rand(1, 6), v: rand(1, 12) })), cap: rand(6, 12) }),
  run({ items, cap }) {
    const n = items.length;
    const T = tracer(n + 1, cap + 1);
    T.step(null, `Row i considers only the first i items; column w is the capacity. Each cell is the best value that fits.`);
    for (let w = 0; w <= cap; w++) T.set(0, w, 0);
    T.step(0, 'With no items the best value is 0 at every capacity.');
    for (let i = 1; i <= n; i++) {
      const { w: wt, v: val } = items[i - 1];
      for (let w = 0; w <= cap; w++) {
        const skip = T.t[i - 1][w];
        if (wt > w) {
          T.reads(1);
          T.set(i, w, skip);
          T.step(4, `Item ${i} weighs ${wt}, more than capacity ${w}. K[${i}][${w}] = K[${i - 1}][${w}] = ${skip}.`, [i, w], [[i - 1, w]]);
        } else {
          const take = T.t[i - 1][w - wt] + val;
          const v = Math.max(skip, take);
          T.reads(2);
          T.set(i, w, v);
          T.step(
            6,
            `K[${i}][${w}] = max(skip: ${skip}, take: K[${i - 1}][${w - wt}] + ${val} = ${take}) = ${v}${take > skip ? `, so taking item ${i} wins` : ''}.`,
            [i, w],
            [
              [i - 1, w],
              [i - 1, w - wt],
            ],
          );
        }
      }
    }
    let w = cap;
    const chosen = [];
    T.path.push([n, cap]);
    T.step(7, `The best value is K[${n}][${cap}] = ${T.t[n][cap]}. Walk back up to see which items made it.`, [n, cap]);
    for (let i = n; i >= 1; i--) {
      const { w: wt, v: val } = items[i - 1];
      if (T.t[i][w] !== T.t[i - 1][w]) {
        chosen.unshift(i);
        w -= wt;
        T.path.push([i - 1, w]);
        T.answer(`items ${chosen.join(', ')}`);
        T.step(7, `K[${i}][${w + wt}] differs from the cell above, so item ${i} (weight ${wt}, value ${val}) is in the bag. Jump left by ${wt}.`, [i - 1, w]);
      } else {
        T.path.push([i - 1, w]);
        T.step(7, `K[${i}][${w}] equals the cell above, so item ${i} was left out.`, [i - 1, w]);
      }
    }
    const tw = chosen.reduce((s, i) => s + items[i - 1].w, 0);
    const value = T.t[n][cap];
    T.answer(chosen.length ? `Take items ${chosen.join(', ')}: weight ${tw} of ${cap}, value ${value}` : 'Nothing fits');
    T.finish(`Done. Best value ${value} using weight ${tw} of ${cap}.`);
    return T.result({
      rowHeads: [{ label: '∅' }, ...items.map((it, i) => ({ label: `#${i + 1}`, sub: `w${it.w} v${it.v}` }))],
      colHeads: idxHeads(cap + 1),
      rowTitle: 'items',
      colTitle: 'capacity',
      out: { value, chosen },
    });
  },
};

/* ---------- Longest common subsequence ---------- */

const lcs = {
  code: [
    'L[i][0] = L[0][j] = 0',
    'for i in 1 .. |A|:',
    '  for j in 1 .. |B|:',
    '    if A[i] == B[j]:',
    '      L[i][j] = L[i-1][j-1] + 1',
    '    else:',
    '      L[i][j] = max(L[i-1][j], L[i][j-1])',
    'walk back from L[m][n]: diagonal on a match, else toward the larger',
  ],
  defaults: () => ({ a: 'ABCBDAB', b: 'BDCABA' }),
  random: () => ({ a: randWord(rand(5, 9)), b: randWord(rand(5, 9)) }),
  run({ a, b }) {
    const m = a.length;
    const n = b.length;
    const T = tracer(m + 1, n + 1);
    T.step(null, `L[i][j] is the length of the longest common subsequence of the first i letters of A and the first j letters of B.`);
    for (let j = 0; j <= n; j++) T.set(0, j, 0);
    for (let i = 1; i <= m; i++) T.set(i, 0, 0);
    T.step(0, 'An empty string has nothing in common with anything, so row 0 and column 0 are all 0.');
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          const v = T.t[i - 1][j - 1] + 1;
          T.reads(1);
          T.set(i, j, v);
          T.step(4, `L[${i}][${j}] = L[${i - 1}][${j - 1}] + 1 = ${v} because ${a[i - 1]} = ${b[j - 1]}.`, [i, j], [[i - 1, j - 1]]);
        } else {
          const up = T.t[i - 1][j];
          const left = T.t[i][j - 1];
          const v = Math.max(up, left);
          T.reads(2);
          T.set(i, j, v);
          T.step(6, `${a[i - 1]} ≠ ${b[j - 1]}, so L[${i}][${j}] = max(L[${i - 1}][${j}], L[${i}][${j - 1}]) = max(${up}, ${left}) = ${v}.`, [i, j], [
            [i - 1, j],
            [i, j - 1],
          ]);
        }
      }
    let i = m;
    let j = n;
    let seq = '';
    T.path.push([i, j]);
    T.step(7, `The LCS has length ${T.t[m][n]}. Walk back from the bottom-right corner to read it.`, [i, j]);
    while (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) {
        seq = a[i - 1] + seq;
        i--;
        j--;
        T.path.push([i, j]);
        T.answer(`…${seq}`);
        T.step(7, `${a[i]} = ${b[j]}: this letter is part of the LCS. Step diagonally.`, [i, j]);
      } else if (T.t[i - 1][j] >= T.t[i][j - 1]) {
        i--;
        T.path.push([i, j]);
        T.step(7, `Letters differ; the value came from above (${T.t[i][j]}). Step up.`, [i, j]);
      } else {
        j--;
        T.path.push([i, j]);
        T.step(7, `Letters differ; the value came from the left (${T.t[i][j]}). Step left.`, [i, j]);
      }
    }
    T.answer(seq ? `LCS = "${seq}" (length ${seq.length})` : 'No common letters: the LCS is empty');
    T.finish(`Done. The longest common subsequence is "${seq}".`);
    return T.result({ rowHeads: charHeads(a), colHeads: charHeads(b), rowTitle: `A = ${a}`, colTitle: `B = ${b}`, out: { value: T.t[m][n], seq } });
  },
};

/* ---------- Edit distance ---------- */

const edit = {
  code: [
    'D[i][0] = i        # delete all of A[1..i]',
    'D[0][j] = j        # insert all of B[1..j]',
    'for i in 1 .. |A|:',
    '  for j in 1 .. |B|:',
    '    if A[i] == B[j]: D[i][j] = D[i-1][j-1]',
    '    else: D[i][j] = 1 + min(',
    '        D[i-1][j],     # delete A[i]',
    '        D[i][j-1],     # insert B[j]',
    '        D[i-1][j-1])   # replace A[i] with B[j]',
    'walk back from D[m][n] to list the edits',
  ],
  defaults: () => ({ a: 'KITTEN', b: 'SITTING' }),
  random: () => ({ a: randWord(rand(4, 8), 'ACEGRST'), b: randWord(rand(4, 8), 'ACEGRST') }),
  run({ a, b }) {
    const m = a.length;
    const n = b.length;
    const T = tracer(m + 1, n + 1);
    T.step(null, `D[i][j] is the fewest single-letter edits that turn the first i letters of A into the first j letters of B.`);
    for (let i = 0; i <= m; i++) T.set(i, 0, i);
    T.step(0, 'Column 0: turning i letters into nothing takes i deletions.');
    for (let j = 1; j <= n; j++) T.set(0, j, j);
    T.step(1, 'Row 0: building j letters from nothing takes j insertions.');
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          const v = T.t[i - 1][j - 1];
          T.reads(1);
          T.set(i, j, v);
          T.step(4, `${a[i - 1]} = ${b[j - 1]}, so no edit is needed: D[${i}][${j}] = D[${i - 1}][${j - 1}] = ${v}.`, [i, j], [[i - 1, j - 1]]);
        } else {
          const del = T.t[i - 1][j];
          const ins = T.t[i][j - 1];
          const rep = T.t[i - 1][j - 1];
          const v = 1 + Math.min(del, ins, rep);
          const how = rep <= del && rep <= ins ? `replace ${a[i - 1]} with ${b[j - 1]}` : del <= ins ? `delete ${a[i - 1]}` : `insert ${b[j - 1]}`;
          T.reads(3);
          T.set(i, j, v);
          T.step(5, `${a[i - 1]} ≠ ${b[j - 1]}: D[${i}][${j}] = 1 + min(delete ${del}, insert ${ins}, replace ${rep}) = ${v}; cheapest is to ${how}.`, [i, j], [
            [i - 1, j],
            [i, j - 1],
            [i - 1, j - 1],
          ]);
        }
      }
    let i = m;
    let j = n;
    const ops = [];
    T.path.push([i, j]);
    T.step(9, `The distance is D[${m}][${n}] = ${T.t[m][n]}. Walk back to see which edits make it.`, [i, j]);
    while (i > 0 || j > 0) {
      const d = T.t[i][j];
      let op;
      if (i > 0 && j > 0 && a[i - 1] === b[j - 1] && d === T.t[i - 1][j - 1]) {
        op = { kind: 'keep', text: `keep ${a[i - 1]}` };
        i--;
        j--;
      } else if (i > 0 && j > 0 && d === T.t[i - 1][j - 1] + 1) {
        op = { kind: 'replace', text: `replace ${a[i - 1]}→${b[j - 1]}` };
        i--;
        j--;
      } else if (i > 0 && d === T.t[i - 1][j] + 1) {
        op = { kind: 'delete', text: `delete ${a[i - 1]}` };
        i--;
      } else {
        op = { kind: 'insert', text: `insert ${b[j - 1]}` };
        j--;
      }
      ops.unshift(op);
      T.path.push([i, j]);
      T.answer(ops.map((o) => o.text).join(', '));
      T.step(9, `${op.text[0].toUpperCase()}${op.text.slice(1)}${op.kind === 'keep' ? ' (free)' : ' (1 edit)'}.`, [i, j]);
    }
    const edits = ops.filter((o) => o.kind !== 'keep');
    T.answer(edits.length ? `${edits.length} edit${edits.length === 1 ? '' : 's'}: ${edits.map((o) => o.text).join(', ')}` : 'The strings are equal: 0 edits');
    T.finish(`Done. ${a} becomes ${b} in ${T.t[m][n]} edit${T.t[m][n] === 1 ? '' : 's'}.`);
    return T.result({ rowHeads: charHeads(a), colHeads: charHeads(b), rowTitle: `A = ${a}`, colTitle: `B = ${b}`, out: { value: T.t[m][n], ops } });
  },
};

/* ---------- Longest increasing subsequence ---------- */

const lis = {
  code: [
    'for i in 0 .. n-1:',
    '  L[i] = 1                      # a[i] on its own',
    '  for j in 0 .. i-1:',
    '    if a[j] < a[i] and L[j] + 1 > L[i]:',
    '      L[i] = L[j] + 1;  prev[i] = j',
    'best = index of the largest L',
    'follow prev[] back from best',
  ],
  defaults: () => ({ arr: [10, 9, 2, 5, 3, 7, 101, 18] }),
  random: () => ({ arr: randList(rand(7, 11), 1, 40) }),
  run({ arr }) {
    const n = arr.length;
    const T = tracer(1, n);
    const prev = Array(n).fill(-1);
    T.step(null, 'L[i] is the length of the longest increasing subsequence that ends exactly at a[i].');
    for (let i = 0; i < n; i++) {
      T.set(0, i, 1);
      T.step(1, `Start L[${i}] at 1: ${arr[i]} alone is an increasing run.`, [0, i]);
      for (let j = 0; j < i; j++) {
        T.reads(1);
        const cur = T.t[0][i];
        if (arr[j] < arr[i] && T.t[0][j] + 1 > cur) {
          T.t[0][i] = T.t[0][j] + 1;
          prev[i] = j;
          T.step(4, `${arr[j]} < ${arr[i]}, so ${arr[i]} can extend the run ending at ${arr[j]}: L[${i}] = L[${j}] + 1 = ${T.t[0][i]}.`, [0, i], [[0, j]]);
        } else if (arr[j] < arr[i]) {
          T.step(3, `${arr[j]} < ${arr[i]}, but L[${j}] + 1 = ${T.t[0][j] + 1} is not better than ${cur}.`, [0, i], [[0, j]]);
        } else {
          T.step(3, `${arr[j]} ≥ ${arr[i]}, so ${arr[i]} cannot follow ${arr[j]}.`, [0, i], [[0, j]]);
        }
      }
    }
    let best = 0;
    for (let i = 1; i < n; i++) if (T.t[0][i] > T.t[0][best]) best = i;
    T.path.push([0, best]);
    T.step(5, `The largest value is L[${best}] = ${T.t[0][best]}, so the LIS ends at ${arr[best]}.`, [0, best]);
    const seq = [arr[best]];
    for (let i = prev[best]; i >= 0; i = prev[i]) {
      seq.unshift(arr[i]);
      T.path.push([0, i]);
      T.answer(`…${seq.join(', ')}`);
      T.step(6, `${arr[i]} came before it in the run (prev pointer).`, [0, i]);
    }
    T.answer(`LIS = ${seq.join(', ')} (length ${seq.length})`);
    T.finish(`Done. The longest increasing subsequence has length ${seq.length}.`);
    return T.result({
      rowHeads: [{ label: 'L' }],
      colHeads: arr.map((v, i) => ({ label: String(v), sub: i })),
      colTitle: 'a[i]',
      out: { value: seq.length, seq },
    });
  },
};

/* ---------- Unique paths ---------- */

const paths = {
  code: [
    'P[0][0] = 1',
    'for r in 0 .. R-1:',
    '  for c in 0 .. C-1:',
    '    if (r, c) is blocked: P[r][c] = 0',
    '    else: P[r][c] = P[r-1][c] + P[r][c-1]   # from above + from left',
    'return P[R-1][C-1]',
  ],
  defaults: () => ({ R: 5, C: 6, blocked: [[1, 2], [3, 1], [2, 4]].map(([r, c]) => `${r},${c}`) }),
  random: (prev) => {
    const R = prev?.R ?? 5;
    const C = prev?.C ?? 6;
    const blocked = [];
    for (let r = 0; r < R; r++)
      for (let c = 0; c < C; c++) if ((r || c) && (r !== R - 1 || c !== C - 1) && Math.random() < 0.18) blocked.push(`${r},${c}`);
    return { R, C, blocked };
  },
  run({ R, C, blocked }) {
    const wall = new Set(blocked);
    const T = tracer(R, C);
    T.step(null, `A robot starts top-left and may only move right or down. P[r][c] counts the routes to cell (r, c).`);
    for (let r = 0; r < R; r++)
      for (let c = 0; c < C; c++) {
        if (r === 0 && c === 0) {
          T.set(0, 0, 1);
          T.step(0, 'There is exactly one way to be at the start: stay put.', [0, 0]);
        } else if (wall.has(`${r},${c}`)) {
          T.set(r, c, 0);
          T.step(3, `(${r}, ${c}) is blocked, so no route passes through it: P = 0.`, [r, c]);
        } else {
          const up = r > 0 ? T.t[r - 1][c] : 0;
          const left = c > 0 ? T.t[r][c - 1] : 0;
          const deps = [];
          if (r > 0) deps.push([r - 1, c]);
          if (c > 0) deps.push([r, c - 1]);
          T.reads(deps.length);
          T.set(r, c, up + left);
          const from = r === 0 ? `Top row: only from the left, ${left}` : c === 0 ? `Left column: only from above, ${up}` : `P[${r}][${c}] = from above ${up} + from the left ${left} = ${up + left}`;
          T.step(4, `${from}.`, [r, c], deps);
        }
      }
    const value = T.t[R - 1][C - 1];
    if (value === 0) {
      T.path.push([R - 1, C - 1]);
      T.answer('No route: the blocks cut off the corner');
      T.step(5, 'P at the goal is 0: the obstacles wall off every route.', [R - 1, C - 1]);
    } else {
      let r = R - 1;
      let c = C - 1;
      T.path.push([r, c]);
      T.answer(`${value} route${value === 1 ? '' : 's'}`);
      T.step(5, `There are ${value} routes. Walk back through the busier neighbour to trace one of them.`, [r, c]);
      while (r > 0 || c > 0) {
        const up = r > 0 ? T.t[r - 1][c] : -1;
        const left = c > 0 ? T.t[r][c - 1] : -1;
        if (up >= left) r--;
        else c--;
        T.path.push([r, c]);
        T.step(5, `Step ${up >= left ? 'up' : 'left'} to (${r}, ${c}), which has ${T.t[r][c]} route${T.t[r][c] === 1 ? '' : 's'}.`, [r, c]);
      }
      T.answer(`${value} distinct route${value === 1 ? '' : 's'}; one is lit in mint`);
    }
    T.finish(`Done. ${value} route${value === 1 ? '' : 's'} from corner to corner.`);
    return T.result({ rowHeads: idxHeads(R), colHeads: idxHeads(C), rowTitle: 'row', colTitle: 'column', blocked: wall, out: { value } });
  },
};

/* ---------- Kadane ---------- */

const kadane = {
  code: [
    'here = best = a[0]',
    'for i in 1 .. n-1:',
    '  here = max(a[i], here + a[i])   # restart or extend',
    '  best = max(best, here)',
    'return best (and the run that made it)',
  ],
  defaults: () => ({ arr: [-2, 1, -3, 4, -1, 2, 1, -5, 4] }),
  random: () => ({ arr: randList(rand(7, 11), -8, 8) }),
  run({ arr }) {
    const n = arr.length;
    const T = tracer(2, n);
    T.step(null, 'Row "here" is the best sum of a run that ends at i. Row "best" is the best sum seen anywhere so far.');
    T.set(0, 0, arr[0]);
    T.set(1, 0, arr[0]);
    T.step(0, `Both start at a[0] = ${arr[0]}.`, [0, 0]);
    let start = 0;
    let bestRange = [0, 0];
    for (let i = 1; i < n; i++) {
      const prev = T.t[0][i - 1];
      const ext = prev + arr[i];
      const here = Math.max(arr[i], ext);
      T.reads(1);
      T.set(0, i, here);
      if (arr[i] > ext) start = i;
      T.step(
        2,
        arr[i] > ext
          ? `Extending gives ${prev} + ${arr[i]} = ${ext}, worse than ${arr[i]} alone, so restart: here = ${here}.`
          : `Extend the run: here = max(${arr[i]}, ${prev} + ${arr[i]}) = ${here}.`,
        [0, i],
        [[0, i - 1]],
      );
      const b = T.t[1][i - 1];
      T.reads(2);
      T.set(1, i, Math.max(b, here));
      if (here > b) bestRange = [start, i];
      T.step(3, here > b ? `${here} beats the old best ${b}: best = ${here}.` : `best = max(${b}, ${here}) = ${Math.max(b, here)}.`, [1, i], [
        [1, i - 1],
        [0, i],
      ]);
    }
    const value = T.t[1][n - 1];
    const [s, e] = bestRange;
    T.path.push([1, n - 1]);
    T.step(4, `The best sum is ${value}. It came from the run a[${s}..${e}].`, [1, n - 1]);
    for (let i = e; i >= s; i--) {
      T.path.push([0, i]);
      T.step(4, `a[${i}] = ${arr[i]} is part of the best run.`, [0, i]);
    }
    T.answer(`Max sum ${value} from a[${s}..${e}] = ${arr.slice(s, e + 1).join(', ')}`);
    T.finish(`Done. The largest subarray sum is ${value}.`);
    return T.result({
      rowHeads: [{ label: 'here' }, { label: 'best' }],
      colHeads: arr.map((v, i) => ({ label: String(v), sub: i })),
      colTitle: 'a[i]',
      out: { value, range: bestRange },
    });
  },
};

export const dpRunners = { fib, coins, knapsack, lcs, edit, lis, paths, kadane };
