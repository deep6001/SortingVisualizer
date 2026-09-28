import { record, trail } from './tracer';

// State: { root, nodes: { id: { key, left, right } }, nextId }. Ids stay with their node, so renderers can animate moves.

export const emptyBst = () => ({ root: null, nodes: {}, nextId: 1 });
const clone = (s) => ({ root: s.root, nextId: s.nextId, nodes: Object.fromEntries(Object.entries(s.nodes).map(([k, v]) => [k, { ...v }])) });
const create = (s, key) => {
  const id = s.nextId++;
  s.nodes[id] = { key, left: null, right: null };
  return id;
};
const height = (s, id) => (id == null ? 0 : 1 + Math.max(height(s, s.nodes[id].left), height(s, s.nodes[id].right)));
const balance = (s, id) => height(s, s.nodes[id].left) - height(s, s.nodes[id].right);
const parentOf = (s, id) => {
  for (const k in s.nodes) if (s.nodes[k].left === id || s.nodes[k].right === id) return Number(k);
  return null;
};
/** Point p's link (or the root) that currently holds oldId at newId. p must be looked up before any relinking. */
const relink = (s, p, oldId, newId) => {
  if (p == null) s.root = newId;
  else if (s.nodes[p].left === oldId) s.nodes[p].left = newId;
  else s.nodes[p].right = newId;
};

/** In-order x slots and depth; AVL adds height and balance-factor labels. */
export function bstView(s, { hl = {}, ehl = {}, avl = false } = {}) {
  const nodes = [];
  const edges = [];
  let x = 0;
  let depth = 0;
  const walk = (id, d) => {
    if (id == null) return 0;
    const n = s.nodes[id];
    const hL = walk(n.left, d + 1);
    const me = { id, x: x++, d, label: String(n.key), tone: hl[id] ?? 'idle' };
    nodes.push(me);
    const hR = walk(n.right, d + 1);
    for (const c of [n.left, n.right]) if (c != null) edges.push({ from: id, to: c, tone: ehl[c] ?? 'idle' });
    depth = Math.max(depth, d);
    if (avl) {
      const bf = hL - hR;
      me.badge = bf > 0 ? `+${bf}` : String(bf);
      me.badgeTone = Math.abs(bf) > 1 ? 'coral' : 'mist';
      me.sub = `h${1 + Math.max(hL, hR)}`;
    }
    return 1 + Math.max(hL, hR);
  };
  walk(s.root, 0);
  return { nodes, edges, width: x, depth };
}

function rotate(s, z, dir) {
  // dir 'right': the left child y comes up; 'left' mirrors it
  const p = parentOf(s, z);
  const [a, b] = dir === 'right' ? ['left', 'right'] : ['right', 'left'];
  const y = s.nodes[z][a];
  s.nodes[z][a] = s.nodes[y][b];
  s.nodes[y][b] = z;
  relink(s, p, z, y);
  return y;
}

function insert(s, t, key, snap) {
  if (s.root == null) {
    const id = create(s, key);
    s.root = id;
    snap(5, `The tree is empty, so ${key} becomes the root.`, { hl: { [id]: 'found' } });
    return id;
  }
  const path = [];
  let id = s.root;
  snap(0, `Insert ${key}. Start at the root, ${s.nodes[id].key}.`, { ghost: { label: key, at: id }, hl: { [id]: 'cmp' } });
  for (;;) {
    const n = s.nodes[id];
    path.push(id);
    t.stats.cmp++;
    if (key === n.key) {
      snap(4, `${key} is already in the tree, so nothing changes.`, { ...trail(path, 'found') });
      return null;
    }
    const dir = key < n.key ? 'left' : 'right';
    const rel = `${key} ${dir === 'left' ? '<' : '>'} ${n.key}`;
    if (n[dir] == null) {
      snap(dir === 'left' ? 2 : 3, `${rel}, and ${n.key} has no ${dir} child.`, { ...trail(path), ghost: { label: key, at: id } });
      const nid = create(s, key);
      n[dir] = nid;
      snap(5, `Attach ${key} as the ${dir} child of ${n.key}.`, { ...trail([...path, nid], 'found') });
      return nid;
    }
    snap(dir === 'left' ? 2 : 3, `${rel}, so go ${dir}.`, { ...trail(path), ghost: { label: key, at: id } });
    id = n[dir];
  }
}

function search(s, t, key, snap) {
  const path = [];
  let id = s.root;
  snap(0, `Search for ${key}, starting at the root.`, { ghost: id != null ? { label: key, at: id } : null });
  while (id != null) {
    const n = s.nodes[id];
    path.push(id);
    t.stats.cmp++;
    if (key === n.key) {
      snap(2, `${key} equals ${n.key}. Found it after ${path.length} comparison${path.length === 1 ? '' : 's'}.`, { ...trail(path, 'found') });
      return id;
    }
    const dir = key < n.key ? 'left' : 'right';
    snap(dir === 'left' ? 3 : 4, `${key} ${dir === 'left' ? '<' : '>'} ${n.key}, so go ${dir}.`, { ...trail(path), ghost: { label: key, at: id } });
    id = n[dir];
  }
  snap(5, `Fell off the tree: ${key} is not here.`, { ...trail(path, 'path') });
  return null;
}

/** BST delete. Returns { found, from } where `from` is the parent of the node physically removed (rebalancing starts there). */
function remove(s, t, key, snap) {
  const path = [];
  let id = s.root;
  while (id != null && s.nodes[id].key !== key) {
    path.push(id);
    t.stats.cmp++;
    const dir = key < s.nodes[id].key ? 'left' : 'right';
    snap(0, `Looking for ${key}: ${key} ${dir === 'left' ? '<' : '>'} ${s.nodes[id].key}, go ${dir}.`, { ...trail(path), ghost: { label: key, at: id } });
    id = s.nodes[id][dir];
  }
  if (id == null) {
    snap(1, `${key} is not in the tree, so there is nothing to delete.`, { ...trail(path, 'path') });
    return { found: false };
  }
  t.stats.cmp++;
  const n = s.nodes[id];
  const p = parentOf(s, id);
  if (n.left == null && n.right == null) {
    snap(2, `Found ${key}. It is a leaf, so it can simply be removed.`, { hl: { [id]: 'remove' } });
    relink(s, p, id, null);
    delete s.nodes[id];
    snap(2, `Removed ${key}.`, { hl: p != null ? { [p]: 'cmp' } : {} });
    return { found: true, from: p };
  }
  if (n.left == null || n.right == null) {
    const c = n.left ?? n.right;
    snap(3, `Found ${key}. It has one child, ${s.nodes[c].key}, which takes its place.`, { hl: { [id]: 'remove', [c]: 'key' } });
    relink(s, p, id, c);
    delete s.nodes[id];
    snap(3, `${s.nodes[c].key} moves up into ${key}'s old spot. The order is unchanged.`, { hl: { [c]: 'found' } });
    return { found: true, from: p };
  }
  snap(4, `Found ${key}. It has two children, so swap in its in-order successor.`, { hl: { [id]: 'remove' } });
  const sp = [];
  let sid = n.right;
  sp.push(sid);
  snap(5, `The successor is the smallest key in the right subtree. Step right to ${s.nodes[sid].key}.`, { hl: { [id]: 'remove', ...trail(sp).hl } });
  while (s.nodes[sid].left != null) {
    sid = s.nodes[sid].left;
    sp.push(sid);
    t.stats.cmp++;
    snap(5, `Keep going left, to ${s.nodes[sid].key}.`, { hl: { [id]: 'remove', ...trail(sp).hl }, ehl: trail([id, ...sp]).ehl });
  }
  const succ = s.nodes[sid];
  snap(5, `${succ.key} has no left child, so it is the successor.`, { hl: { [id]: 'remove', [sid]: 'key' } });
  n.key = succ.key;
  snap(6, `Copy ${succ.key} into the node that held ${key}.`, { hl: { [id]: 'found', [sid]: 'remove' } });
  const sParent = parentOf(s, sid);
  relink(s, sParent, sid, succ.right);
  delete s.nodes[sid];
  snap(7, `Remove the old ${succ.key} node${succ.right != null ? ` and lift its right child ${s.nodes[succ.right].key} up` : ''}.`, { hl: { [id]: 'found' } });
  return { found: true, from: sParent };
}

/** Walk from `id` to the root, rotating wherever |balance| > 1. base = pseudocode line of "walk back up". */
function rebalance(s, t, id, snap, base) {
  const K = (x) => s.nodes[x].key;
  if (id != null) snap(base, 'Walk back up toward the root, checking each balance factor.', { hl: { [id]: 'cmp' } });
  while (id != null) {
    const bf = balance(s, id);
    let top = id;
    if (Math.abs(bf) <= 1) {
      snap(base + 1, `At ${K(id)}: balance = ${bf}. That is within ±1, so it is fine.`, { hl: { [id]: 'cmp' } });
    } else {
      t.stats.rot++;
      snap(base + 1, `At ${K(id)}: balance = ${bf > 0 ? '+' : ''}${bf}. Too ${bf > 0 ? 'left' : 'right'}-heavy, so rotate.`, { hl: { [id]: 'remove' } });
      if (bf > 1) {
        const l = s.nodes[id].left;
        if (balance(s, l) >= 0) {
          snap(base + 2, `LL case: the extra height is in the left child's left side. Rotate right around ${K(id)}.`, { hl: { [id]: 'remove', [l]: 'key' } });
        } else {
          const lr = s.nodes[l].right;
          snap(base + 3, `LR case: the extra height is in the left child's right side. First rotate left around ${K(l)}.`, { hl: { [id]: 'remove', [l]: 'remove', [lr]: 'key' } });
          rotate(s, l, 'left');
          t.stats.rot++;
          snap(base + 3, `Now it is a straight LL line. Rotate right around ${K(id)}.`, { hl: { [id]: 'remove', [lr]: 'key' } });
        }
        top = rotate(s, id, 'right');
      } else {
        const r = s.nodes[id].right;
        if (balance(s, r) <= 0) {
          snap(base + 4, `RR case: the extra height is in the right child's right side. Rotate left around ${K(id)}.`, { hl: { [id]: 'remove', [r]: 'key' } });
        } else {
          const rl = s.nodes[r].left;
          snap(base + 5, `RL case: the extra height is in the right child's left side. First rotate right around ${K(r)}.`, { hl: { [id]: 'remove', [r]: 'remove', [rl]: 'key' } });
          rotate(s, r, 'right');
          t.stats.rot++;
          snap(base + 5, `Now it is a straight RR line. Rotate left around ${K(id)}.`, { hl: { [id]: 'remove', [rl]: 'key' } });
        }
        top = rotate(s, id, 'left');
      }
      snap(base + 1, `${K(top)} is now the root of this subtree and it is balanced again.`, { hl: { [top]: 'found' } });
    }
    id = parentOf(s, top);
  }
}

const insertCode = [
  'node = root',
  'while node is not null:',
  '  if key < node.key: node = node.left',
  '  else if key > node.key: node = node.right',
  '  else: already in the tree, stop',
  'put a new node with key here',
];
const deleteCode = [
  'find the node holding key',
  'if not found: stop',
  'if node has no children: remove it',
  'else if node has one child: lift the child into its place',
  'else:',
  '  succ = leftmost node of node.right',
  '  copy succ.key into node',
  '  remove succ (it has no left child)',
];
const searchCode = [
  'node = root',
  'while node is not null:',
  '  if key == node.key: found',
  '  if key < node.key: node = node.left',
  '  else: node = node.right',
  'not found',
];
const rebalanceCode = [
  'walk back up toward the root:',
  '  bf = height(left) - height(right)',
  '  if bf > 1 and bf(left) >= 0: rotate right            # LL',
  '  if bf > 1 and bf(left) < 0: rotate left(left); rotate right   # LR',
  '  if bf < -1 and bf(right) <= 0: rotate left          # RR',
  '  if bf < -1 and bf(right) > 0: rotate right(right); rotate left # RL',
];

export function makeSearchTree(avl) {
  return {
    stats: [
      { key: 'cmp', label: 'Comparisons', tone: 'text-amber' },
      ...(avl ? [{ key: 'rot', label: 'Rotations', tone: 'text-coral' }] : []),
      { key: 'nodes', label: 'Nodes' },
      { key: 'height', label: 'Height', tone: 'text-violet' },
    ],
    code: {
      insert: avl ? [...insertCode, ...rebalanceCode] : insertCode,
      delete: avl ? [...deleteCode, ...rebalanceCode] : deleteCode,
      search: searchCode,
    },
    empty: emptyBst,
    view: (s, o) => bstView(s, { ...o, avl }),
    /** returns { steps, state } and never mutates `state` */
    run(state, op, key) {
      const s = clone(state);
      const view = (o) => bstView(s, { ...o, avl });
      const { steps } = record(
        view,
        (t) => {
          const snap = (...a) => t.snap(...a);
          if (op === 'insert') {
            const id = insert(s, t, key, snap);
            if (avl && id != null) rebalance(s, t, parentOf(s, id), snap, insertCode.length);
          } else if (op === 'delete') {
            const r = remove(s, t, key, snap);
            if (avl && r.found) rebalance(s, t, r.from, snap, deleteCode.length);
          } else search(s, t, key, snap);
          t.snap(null, doneMsg(op, key, s), {});
        },
        { cmp: 0, rot: 0 },
      );
      return { steps, state: s };
    },
    /** build silently (no trace) from a list of keys */
    build(keys) {
      let st = emptyBst();
      for (const k of keys) st = this.run(st, 'insert', k).state;
      return st;
    },
  };
}

function doneMsg(op, key, s) {
  const n = Object.keys(s.nodes).length;
  const h = height(s, s.root);
  if (op === 'search') return `Search for ${key} finished. The tree is unchanged.`;
  return `Done. The tree has ${n} node${n === 1 ? '' : 's'} and height ${h}.`;
}

// ---------- traversals (read-only) ----------

export const traversalCode = {
  in: ['inorder(node):', '  if node is null: return', '  inorder(node.left)', '  visit(node)', '  inorder(node.right)'],
  pre: ['preorder(node):', '  if node is null: return', '  visit(node)', '  preorder(node.left)', '  preorder(node.right)'],
  post: ['postorder(node):', '  if node is null: return', '  postorder(node.left)', '  postorder(node.right)', '  visit(node)'],
  level: ['queue = [root]', 'while queue is not empty:', '  node = queue.pop_front()', '  visit(node)', '  push node.left and node.right if present'],
};

export function traverse(s, order) {
  const out = [];
  const stack = [];
  const done = new Set();
  const K = (id) => s.nodes[id].key;
  const hlNow = (cur, tone) => {
    const hl = {};
    done.forEach((id) => (hl[id] = 'done'));
    stack.forEach((id) => (hl[id] = hl[id] ?? 'path'));
    if (cur != null) hl[cur] = tone;
    return hl;
  };
  const view = (o) => bstView(s, o);
  const { steps } = record(
    view,
    (t) => {
      const strips = (label, list) => [
        { label, items: list.map((id) => ({ t: String(K(id)), tone: 'amber' })) },
        { label: 'Output', items: out.map((k) => ({ t: String(k), tone: 'mint' })) },
      ];
      const visit = (id, line) => {
        done.add(id);
        out.push(K(id));
        t.stats.visited++;
        t.snap(line, `Visit ${K(id)}. Output so far: ${out.join(', ')}.`, { hl: hlNow(id, 'found'), strips: strips(order === 'level' ? 'Queue' : 'Call stack', stack) });
      };
      if (s.root == null) {
        t.snap(null, 'The tree is empty. Insert some keys first.');
        return;
      }
      if (order === 'level') {
        stack.push(s.root);
        t.snap(0, `Start with the root ${K(s.root)} in the queue.`, { hl: hlNow(s.root, 'cmp'), strips: strips('Queue', stack) });
        while (stack.length) {
          const id = stack.shift();
          t.snap(2, `Take ${K(id)} from the front of the queue.`, { hl: hlNow(id, 'cmp'), strips: strips('Queue', stack) });
          visit(id, 3);
          const kids = [s.nodes[id].left, s.nodes[id].right].filter((c) => c != null);
          if (kids.length) {
            stack.push(...kids);
            t.snap(4, `Queue its children: ${kids.map(K).join(' and ')}.`, { hl: hlNow(id, 'found'), strips: strips('Queue', stack) });
          }
        }
      } else {
        const lines = { in: [2, 3, 4], pre: [3, 2, 4], post: [2, 4, 3] }[order];
        const go = (id) => {
          stack.push(id);
          t.snap(0, `Call on ${K(id)}.`, { hl: hlNow(id, 'cmp'), strips: strips('Call stack', stack) });
          const n = s.nodes[id];
          const parts = { left: () => n.left != null && go(n.left), self: () => visit(id, lines[1]), right: () => n.right != null && go(n.right) };
          const seq = order === 'pre' ? ['self', 'left', 'right'] : order === 'in' ? ['left', 'self', 'right'] : ['left', 'right', 'self'];
          for (const part of seq) {
            if (part !== 'self') {
              const c = n[part];
              if (c == null) continue;
              t.snap(part === 'left' ? lines[0] : lines[2], `From ${K(id)}, go ${part} to ${K(c)}.`, { hl: hlNow(id, 'cmp'), strips: strips('Call stack', stack) });
            }
            parts[part]();
          }
          stack.pop();
        };
        go(s.root);
      }
      t.snap(null, `Done. ${{ in: 'In-order', pre: 'Pre-order', post: 'Post-order', level: 'Level-order' }[order]} traversal: ${out.join(', ')}.${order === 'in' ? ' In a BST that is always sorted.' : ''}`, {
        hl: hlNow(null),
        strips: [{ label: 'Output', items: out.map((k) => ({ t: String(k), tone: 'mint' })) }],
      });
    },
    { visited: 0 },
  );
  return steps;
}

export const bstInternals = { height, balance };
