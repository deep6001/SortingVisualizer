// Hash table with separate chaining and load-factor doubling.
//
// step: { m, buckets: [[{ id, key }]], old: { m, buckets } | null, hl: { [id]: role },
//         bucket: { table: 'new' | 'old', i, role } | null, calc, line, msg, op, stats }

import { newId } from './linear';

export const MAX_LOAD = 0.75;
export const HT_MAX_KEYS = 15;
export const HT_MAX_BUCKETS = 20;

export const htCode = {
  insert: [
    'insert(key):',
    '  i = hash(key) mod m',
    '  for item in bucket[i]:',
    '    if item == key: return      # already stored',
    '  bucket[i].append(key)',
    '  size = size + 1',
    '  if size / m > 0.75: resize(2m)',
    'resize(newM):',
    '  fresh = newM empty buckets',
    '  for key in every old bucket:',
    '    fresh[hash(key) mod newM].append(key)',
  ],
  search: ['search(key):', '  i = hash(key) mod m', '  for item in bucket[i]:', '    if item == key: return found', '  return not found'],
  remove: [
    'remove(key):',
    '  i = hash(key) mod m',
    '  for item in bucket[i]:',
    '    if item == key:',
    '      unlink item; size = size - 1; return',
    '  return not found',
  ],
};

/** Parse user input: whole numbers become numbers, anything else a short string. */
export function parseKey(text) {
  const t = String(text).trim();
  if (!t) return null;
  if (/^-?\d{1,9}$/.test(t)) return Number(t);
  return t.slice(0, 8);
}

export const showKey = (k) => (typeof k === 'string' ? `"${k}"` : String(k));

/** Numbers hash to themselves; strings to the sum of their character codes. */
export function hashKey(key) {
  if (typeof key === 'number') return { h: key, text: `${key}` };
  const codes = [...key].map((c) => c.charCodeAt(0));
  const h = codes.reduce((a, b) => a + b, 0);
  const parts = [...key].map((c, i) => `${c}(${codes[i]})`).join(' + ');
  return { h, text: codes.length > 1 ? `${parts} = ${h}` : parts };
}

export function indexOf(key, m) {
  const { h, text } = hashKey(key);
  const i = ((h % m) + m) % m;
  return { i, calc: `hash(${showKey(key)}) = ${text};  ${h} mod ${m} = ${i}` };
}

const cloneBuckets = (b) => b.map((chain) => chain.map((it) => ({ ...it })));

export function emptyTable(m = 5) {
  return { m, buckets: Array.from({ length: m }, () => []), size: 0, stats: { collisions: 0, resizes: 0, probes: 0 } };
}

function recorder(state, op) {
  const s = { ...state, buckets: cloneBuckets(state.buckets), stats: { ...state.stats } };
  const steps = [];
  let old = null;
  const t = {
    s,
    steps,
    setOld(o) {
      old = o;
    },
    snap(line, msg, { hl = {}, bucket = null, calc = null } = {}) {
      steps.push({
        m: s.m,
        buckets: cloneBuckets(s.buckets),
        old: old && { m: old.m, buckets: cloneBuckets(old.buckets) },
        hl,
        bucket,
        calc,
        line,
        msg,
        op,
        stats: { ...s.stats, size: s.size, m: s.m },
      });
    },
  };
  return t;
}

export const introStep = (state, msg) => ({
  m: state.m,
  buckets: state.buckets,
  old: null,
  hl: {},
  bucket: null,
  calc: null,
  line: null,
  msg,
  op: null,
  stats: { ...state.stats, size: state.size, m: state.m },
});

/** Walk a chain looking for key. Records one step per comparison. */
function scan(t, key, i, calc, line) {
  const chain = t.s.buckets[i];
  for (const it of chain) {
    t.s.stats.probes++;
    const hit = it.key === key;
    t.snap(line, `Compare ${showKey(key)} with ${showKey(it.key)} in bucket ${i}: ${hit ? 'match.' : 'no match.'}`, {
      hl: { [it.id]: hit ? 'new' : 'look' },
      bucket: { table: 'new', i, role: 'look' },
      calc,
    });
    if (hit) return it;
  }
  return null;
}

function resize(t) {
  const { s } = t;
  const oldTable = { m: s.m, buckets: s.buckets };
  const newM = s.m * 2;
  s.stats.resizes++;
  s.m = newM;
  s.buckets = Array.from({ length: newM }, () => []);
  t.setOld(oldTable);
  t.snap(8, `Make a fresh table with ${newM} buckets. Every key must be rehashed because the bucket index depends on m.`);
  for (let bi = 0; bi < oldTable.m; bi++) {
    while (oldTable.buckets[bi].length) {
      const it = oldTable.buckets[bi][0];
      const { i, calc } = indexOf(it.key, newM);
      t.snap(9, `Take ${showKey(it.key)} from old bucket ${bi}.`, { hl: { [it.id]: 'look' }, bucket: { table: 'old', i: bi, role: 'look' }, calc });
      oldTable.buckets[bi].shift();
      const collide = s.buckets[i].length > 0;
      s.buckets[i].push(it);
      t.snap(
        10,
        `With ${newM} buckets it goes to bucket ${i}${collide ? ', sharing a chain' : ''}.`,
        { hl: { [it.id]: collide ? 'out' : 'new' }, bucket: { table: 'new', i, role: collide ? 'out' : 'new' }, calc },
      );
    }
  }
  t.setOld(null);
  t.snap(6, `Rehash done. Load factor is now ${s.size}/${newM} = ${(s.size / newM).toFixed(2)}, and chains are shorter.`);
}

export const htOps = {
  insert(state, key) {
    const t = recorder(state, 'insert');
    const { s } = t;
    const { i, calc } = indexOf(key, s.m);
    t.snap(0, `insert(${showKey(key)}).`, { calc });
    t.snap(1, `${typeof key === 'string' ? 'Add up the character codes, then take' : 'Take'} the remainder mod ${s.m}: bucket ${i}.`, {
      bucket: { table: 'new', i, role: 'look' },
      calc,
    });
    if (scan(t, key, i, calc, 3)) {
      t.snap(3, `${showKey(key)} is already stored, so nothing changes.`, { bucket: { table: 'new', i, role: 'look' }, calc });
      return { state, steps: t.steps, log: { text: `insert ${showKey(key)}: duplicate`, tone: 'info' } };
    }
    if (s.size >= HT_MAX_KEYS) {
      t.snap(4, `The demo is capped at ${HT_MAX_KEYS} keys. Remove one first.`, { calc });
      return { state, steps: t.steps, log: { text: `insert ${showKey(key)}: full`, tone: 'bad' } };
    }
    const collide = s.buckets[i].length > 0;
    if (collide) s.stats.collisions++;
    const it = { id: newId(), key };
    s.buckets[i].push(it);
    t.snap(
      4,
      collide
        ? `Collision: bucket ${i} already holds ${s.buckets[i].length - 1} key${s.buckets[i].length > 2 ? 's' : ''}. Append ${showKey(key)} to its chain.`
        : `Bucket ${i} was empty. ${showKey(key)} starts its chain.`,
      { hl: { [it.id]: collide ? 'out' : 'new' }, bucket: { table: 'new', i, role: collide ? 'out' : 'new' }, calc },
    );
    s.size++;
    const load = s.size / s.m;
    t.snap(5, `size = ${s.size}. Load factor = ${s.size}/${s.m} = ${load.toFixed(2)}.`, { hl: { [it.id]: 'new' } });
    if (load > MAX_LOAD && s.m * 2 <= HT_MAX_BUCKETS) {
      t.snap(6, `${load.toFixed(2)} is above ${MAX_LOAD}: chains will start to get long. Double the table.`);
      resize(t);
    } else {
      t.snap(6, `${load.toFixed(2)} is at most ${MAX_LOAD}${load > MAX_LOAD ? ' (or the demo size cap is reached)' : ''}, so no resize.`);
    }
    return { state: s, steps: t.steps, log: { text: `insert ${showKey(key)}${collide ? ' (collision)' : ''}`, tone: 'ok' } };
  },

  search(state, key) {
    const t = recorder(state, 'search');
    const { i, calc } = indexOf(key, t.s.m);
    t.snap(0, `search(${showKey(key)}).`, { calc });
    t.snap(1, `Only bucket ${i} can hold ${showKey(key)}, so only that chain is checked.`, { bucket: { table: 'new', i, role: 'look' }, calc });
    const hit = scan(t, key, i, calc, 3);
    if (hit) {
      t.snap(3, `Found ${showKey(key)} in bucket ${i}.`, { hl: { [hit.id]: 'new' }, bucket: { table: 'new', i, role: 'new' }, calc });
    } else {
      t.snap(4, `End of the chain: ${showKey(key)} is not in the table.`, { bucket: { table: 'new', i, role: 'out' }, calc });
    }
    return { state: { ...state, stats: t.s.stats }, steps: t.steps, log: { text: `search ${showKey(key)}: ${hit ? 'found' : 'missing'}`, tone: hit ? 'ok' : 'info' } };
  },

  remove(state, key) {
    const t = recorder(state, 'remove');
    const { s } = t;
    const { i, calc } = indexOf(key, s.m);
    t.snap(0, `remove(${showKey(key)}).`, { calc });
    t.snap(1, `Look in bucket ${i}.`, { bucket: { table: 'new', i, role: 'look' }, calc });
    const hit = scan(t, key, i, calc, 3);
    if (!hit) {
      t.snap(5, `${showKey(key)} is not in bucket ${i}, so nothing is removed.`, { bucket: { table: 'new', i, role: 'out' }, calc });
      return { state, steps: t.steps, log: { text: `remove ${showKey(key)}: missing`, tone: 'bad' } };
    }
    t.snap(4, `Unlink ${showKey(key)} from the chain.`, { hl: { [hit.id]: 'out' }, bucket: { table: 'new', i, role: 'out' }, calc });
    s.buckets[i] = s.buckets[i].filter((it) => it !== hit);
    s.size--;
    t.snap(4, `Removed. size = ${s.size}, load factor ${(s.size / s.m).toFixed(2)}.`, { bucket: { table: 'new', i, role: 'look' }, calc });
    return { state: s, steps: t.steps, log: { text: `remove ${showKey(key)}`, tone: 'ok' } };
  },
};

/** Look a key up directly (used by tests and the page for quick checks). */
export function contains(state, key) {
  const { i } = indexOf(key, state.m);
  return state.buckets[i].some((it) => it.key === key);
}

/** Build a table silently from a list of keys. */
export function buildTable(keys, m = 5) {
  let s = emptyTable(m);
  keys.forEach((k) => {
    s = htOps.insert(s, k).state;
  });
  return { ...s, stats: { collisions: 0, resizes: 0, probes: 0 } };
}
