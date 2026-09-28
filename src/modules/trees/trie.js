import { record } from './tracer';

// State: { nodes: { id: { ch, kids: { letter: id }, end } }, nextId }. Node 0 is the root.

export const emptyTrie = () => ({ nodes: { 0: { ch: '', kids: {}, end: false } }, nextId: 1 });
const clone = (s) => ({ nextId: s.nextId, nodes: Object.fromEntries(Object.entries(s.nodes).map(([k, v]) => [k, { ...v, kids: { ...v.kids } }])) });

export function words(s, id = 0, prefix = '', out = []) {
  const n = s.nodes[id];
  if (n.end) out.push(prefix);
  for (const c of Object.keys(n.kids).sort()) words(s, n.kids[c], prefix + c, out);
  return out;
}

/** Tidy layout: leaves take consecutive slots, parents sit centred over their children. */
export function trieView(s, { hl = {}, ehl = {} } = {}) {
  const nodes = [];
  const edges = [];
  let slot = 0;
  let depth = 0;
  const walk = (id, d) => {
    const n = s.nodes[id];
    const kids = Object.keys(n.kids).sort().map((c) => n.kids[c]);
    depth = Math.max(depth, d);
    let x;
    if (!kids.length) x = slot++;
    else {
      const xs = kids.map((k) => walk(k, d + 1));
      x = (xs[0] + xs[xs.length - 1]) / 2;
    }
    nodes.push({ id, x, d, label: id === 0 ? '·' : n.ch, tone: hl[id] ?? 'idle', ring: n.end });
    for (const k of kids) edges.push({ from: id, to: k, tone: ehl[k] ?? 'idle' });
    return x;
  };
  walk(0, 0);
  const strips = [{ label: 'Words stored', items: words(s).map((w) => ({ t: w })) }];
  return { nodes, edges, width: Math.max(1, slot), depth, strips };
}

const insertCode = ['node = root', 'for each letter c in word:', '  if node has no child c: create it', '  node = node.child[c]', 'mark node as the end of a word'];
const searchCode = [
  'node = root',
  'for each letter c in prefix:',
  '  if node has no child c: no word starts with prefix',
  '  node = node.child[c]',
  'every word below node starts with prefix',
];
const deleteCode = [
  'walk down the word; stop if a letter is missing',
  'if node is not marked as a word end: stop',
  'unmark node',
  'while node has no children and is not a word end:',
  '  remove node; node = parent',
];

const pathHl = (path, last = 'cmp') => {
  const hl = {};
  const ehl = {};
  path.forEach((id, i) => {
    hl[id] = i === path.length - 1 ? last : 'path';
    if (i > 0) ehl[id] = 'path';
  });
  return { hl, ehl };
};

export const trieTree = {
  stats: [
    { key: 'steps', label: 'Letters walked', tone: 'text-amber' },
    { key: 'created', label: 'Nodes created', tone: 'text-mint' },
    { key: 'nodes', label: 'Nodes' },
    { key: 'words', label: 'Words', tone: 'text-violet' },
  ],
  code: { insert: insertCode, search: searchCode, delete: deleteCode },
  empty: emptyTrie,
  view: trieView,
  run(state, op, word) {
    const s = clone(state);
    const { steps } = record(
      (o) => trieView(s, o),
      (t) => {
        t.stats.words = words(s).length;
        const path = [0];
        let id = 0;
        if (op === 'insert') {
          t.snap(0, `Insert "${word}". Start at the root.`, { hl: { 0: 'cmp' } });
          for (let i = 0; i < word.length; i++) {
            const c = word[i];
            t.stats.steps++;
            if (s.nodes[id].kids[c] == null) {
              const nid = s.nextId++;
              s.nodes[nid] = { ch: c, kids: {}, end: false };
              s.nodes[id].kids[c] = nid;
              t.stats.created++;
              path.push(nid);
              t.snap(2, `No child "${c}" yet, so create it.`, { ...pathHl(path, 'key') });
            } else {
              path.push(s.nodes[id].kids[c]);
              t.snap(3, `"${c}" already exists (shared with another word). Follow it.`, { ...pathHl(path) });
            }
            id = path[path.length - 1];
          }
          const had = s.nodes[id].end;
          s.nodes[id].end = true;
          t.stats.words = words(s).length;
          t.snap(4, had ? `"${word}" was already stored.` : `Mark the last node as a word end (double ring). "${word}" is stored.`, { ...pathHl(path, 'found') });
          return;
        }
        if (op === 'search') {
          t.snap(0, `Look for words starting with "${word}".`, { hl: { 0: 'cmp' } });
          for (const c of word) {
            t.stats.steps++;
            const nx = s.nodes[id].kids[c];
            if (nx == null) {
              t.snap(2, `No child "${c}", so no stored word starts with "${word}".`, { ...pathHl(path, 'remove') });
              return;
            }
            path.push(nx);
            id = nx;
            t.snap(3, `Follow "${c}".`, { ...pathHl(path) });
          }
          const found = words(s, id, word);
          const hl = pathHl(path, 'found').hl;
          const mark = (x) => {
            hl[x] = hl[x] ?? 'done';
            Object.values(s.nodes[x].kids).forEach(mark);
          };
          mark(id);
          t.snap(4, `${found.length} word${found.length === 1 ? '' : 's'} start${found.length === 1 ? 's' : ''} with "${word}": ${found.join(', ') || 'none (only longer prefixes pass through)'}.`, {
            hl,
            strips: [{ label: `Matches for "${word}"`, items: found.map((w) => ({ t: w, tone: 'mint' })) }],
          });
          return;
        }
        // delete
        t.snap(0, `Delete "${word}". Walk down its letters.`, { hl: { 0: 'cmp' } });
        for (const c of word) {
          t.stats.steps++;
          const nx = s.nodes[id].kids[c];
          if (nx == null) {
            t.snap(0, `No child "${c}", so "${word}" is not stored.`, { ...pathHl(path, 'remove') });
            return;
          }
          path.push(nx);
          id = nx;
          t.snap(0, `Follow "${c}".`, { ...pathHl(path) });
        }
        if (!s.nodes[id].end) {
          t.snap(1, `"${word}" is only a prefix of other words, not a stored word. Nothing to delete.`, { ...pathHl(path, 'remove') });
          return;
        }
        s.nodes[id].end = false;
        t.stats.words = words(s).length;
        t.snap(2, `Unmark the end of "${word}".`, { ...pathHl(path, 'key') });
        while (path.length > 1) {
          const cur = path[path.length - 1];
          const n = s.nodes[cur];
          if (n.end || Object.keys(n.kids).length) {
            t.snap(3, `"${n.ch}" is still used by another word, so stop pruning.`, { ...pathHl(path, 'found') });
            break;
          }
          t.snap(4, `"${n.ch}" has no children and ends no word. Remove it.`, { ...pathHl(path, 'remove') });
          path.pop();
          delete s.nodes[path[path.length - 1]].kids[n.ch];
          delete s.nodes[cur];
        }
        t.snap(null, `Done. "${word}" is gone.`);
      },
      { steps: 0, created: 0, words: 0 },
    );
    return { steps, state: s };
  },
  build(list) {
    let st = emptyTrie();
    for (const w of list) st = this.run(st, 'insert', w).state;
    return st;
  },
};

export const WORDS = ['car', 'cart', 'care', 'cat', 'dog', 'dot', 'do', 'tea', 'ten', 'team', 'to', 'toy', 'art', 'arc', 'and', 'ant', 'sun', 'sung', 'sand', 'see', 'seed', 'bee', 'bet', 'bat'];
