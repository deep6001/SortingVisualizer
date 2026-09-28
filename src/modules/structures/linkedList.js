// Singly linked list. Nodes live in a map { id: { v, next } } so reversal can
// rewire pointers while the drawing keeps each node where it was.
//
// step: { nodes, head, order, detached, ptrs, hl, edge, line, msg, op, stats }
//   order     node ids left to right for layout during this operation
//   detached  id of a freshly created node not yet linked in (drawn below the row)
//   ptrs      { name: id | null } pointer variables
//   edge      id whose next-pointer just changed (drawn hot)

import { newId } from './linear';

export const LL_CAP = 10;

export const llCode = {
  insertHead: ['insertHead(x):', '  node = new Node(x)', '  node.next = head', '  head = node'],
  insertTail: [
    'insertTail(x):',
    '  node = new Node(x)',
    '  if head == null: head = node; return',
    '  curr = head',
    '  while curr.next != null:',
    '    curr = curr.next',
    '  curr.next = node',
  ],
  insertAt: [
    'insertAt(i, x):',
    '  if i == 0: insertHead(x); return',
    '  prev = head',
    '  repeat i - 1 times: prev = prev.next',
    '  node = new Node(x)',
    '  node.next = prev.next',
    '  prev.next = node',
  ],
  remove: [
    'delete(x):',
    '  if head == null: return',
    '  if head.value == x: head = head.next; return',
    '  prev = head; curr = head.next',
    '  while curr != null:',
    '    if curr.value == x:',
    '      prev.next = curr.next; return',
    '    prev = curr; curr = curr.next',
    '  x was not found',
  ],
  reverse: [
    'reverse():',
    '  prev = null; curr = head',
    '  while curr != null:',
    '    next = curr.next',
    '    curr.next = prev',
    '    prev = curr',
    '    curr = next',
    '  head = prev',
  ],
  middle: [
    'middle():',
    '  slow = head; fast = head',
    '  while fast != null and fast.next != null:',
    '    slow = slow.next',
    '    fast = fast.next.next',
    '  return slow',
  ],
};

export function listOrder(nodes, head) {
  const out = [];
  const seen = new Set();
  for (let id = head; id && !seen.has(id); id = nodes[id].next) {
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function listValues(state) {
  return listOrder(state.nodes, state.head).map((id) => state.nodes[id].v);
}

export function initialList(values) {
  const nodes = {};
  let head = null;
  for (let i = values.length - 1; i >= 0; i--) {
    const id = newId();
    nodes[id] = { v: values[i], next: head };
    head = id;
  }
  return { nodes, head, stats: { ops: 0 } };
}

const cloneNodes = (nodes) => Object.fromEntries(Object.entries(nodes).map(([k, n]) => [k, { ...n }]));

function recorder(state, op) {
  const s = { nodes: cloneNodes(state.nodes), head: state.head, stats: { ...state.stats, ops: state.stats.ops + 1 } };
  const steps = [];
  let order = listOrder(s.nodes, s.head);
  let detached = null;
  const t = {
    s,
    steps,
    get order() {
      return order;
    },
    setOrder(o) {
      order = o;
    },
    detach(id) {
      detached = id;
    },
    snap(line, msg, { ptrs = {}, hl = {}, edge = null } = {}) {
      steps.push({
        nodes: cloneNodes(s.nodes),
        head: s.head,
        order: [...order],
        detached,
        ptrs: { head: s.head, ...ptrs },
        hl,
        edge,
        line,
        msg,
        op,
        stats: { ...s.stats, length: listOrder(s.nodes, s.head).length },
      });
    },
    relayout() {
      order = listOrder(s.nodes, s.head);
      detached = null;
    },
  };
  return t;
}

export const introStep = (state, msg) => {
  const order = listOrder(state.nodes, state.head);
  return {
    nodes: state.nodes,
    head: state.head,
    order,
    detached: null,
    ptrs: { head: state.head },
    hl: {},
    edge: null,
    line: null,
    msg,
    op: null,
    stats: { ...state.stats, length: order.length },
  };
};

const v = (s, id) => (id ? s.nodes[id].v : 'null');

export const llOps = {
  insertHead(state, x) {
    const t = recorder(state, 'insertHead');
    const { s } = t;
    if (t.order.length >= LL_CAP) {
      t.snap(0, `The demo list is capped at ${LL_CAP} nodes. Delete one first.`);
      return { state, steps: t.steps, log: { text: `insert ${x}: full`, tone: 'bad' } };
    }
    t.snap(0, `insertHead(${x}): put ${x} in front of the current head.`);
    const id = newId();
    s.nodes[id] = { v: x, next: null };
    t.setOrder([id, ...t.order]);
    t.detach(id);
    t.snap(1, `Create a node holding ${x}. Its next pointer is null for now.`, { ptrs: { node: id }, hl: { [id]: 'new' } });
    s.nodes[id].next = s.head;
    t.snap(2, s.head ? `Point node.next at the old head, ${v(s, s.head)}.` : 'The list was empty, so node.next stays null.', {
      ptrs: { node: id },
      hl: { [id]: 'new' },
      edge: id,
    });
    s.head = id;
    t.relayout();
    t.snap(3, `Move head to the new node. ${x} is first; nothing else moved. O(1).`, { hl: { [id]: 'new' } });
    return { state: s, steps: t.steps, log: { text: `insert head ${x}`, tone: 'ok' } };
  },

  insertTail(state, x) {
    const t = recorder(state, 'insertTail');
    const { s } = t;
    if (t.order.length >= LL_CAP) {
      t.snap(0, `The demo list is capped at ${LL_CAP} nodes. Delete one first.`);
      return { state, steps: t.steps, log: { text: `insert ${x}: full`, tone: 'bad' } };
    }
    t.snap(0, `insertTail(${x}): walk to the last node and hang ${x} after it.`);
    const id = newId();
    s.nodes[id] = { v: x, next: null };
    t.setOrder([...t.order, id]);
    t.detach(id);
    t.snap(1, `Create a node holding ${x}.`, { ptrs: { node: id }, hl: { [id]: 'new' } });
    if (!s.head) {
      s.head = id;
      t.relayout();
      t.snap(2, `The list was empty, so the new node becomes head.`, { hl: { [id]: 'new' } });
      return { state: s, steps: t.steps, log: { text: `insert tail ${x}`, tone: 'ok' } };
    }
    let curr = s.head;
    t.snap(3, `Start curr at head (${v(s, curr)}).`, { ptrs: { curr, node: id }, hl: { [curr]: 'look', [id]: 'new' } });
    while (s.nodes[curr].next) {
      t.snap(4, `curr.next is ${v(s, s.nodes[curr].next)}, not null, so keep walking.`, {
        ptrs: { curr, node: id },
        hl: { [curr]: 'look', [id]: 'new' },
      });
      curr = s.nodes[curr].next;
      t.snap(5, `curr moves to ${v(s, curr)}.`, { ptrs: { curr, node: id }, hl: { [curr]: 'look', [id]: 'new' } });
    }
    t.snap(4, `curr.next is null: ${v(s, curr)} is the last node.`, { ptrs: { curr, node: id }, hl: { [curr]: 'key', [id]: 'new' } });
    s.nodes[curr].next = id;
    t.relayout();
    t.snap(6, `Link ${v(s, curr)}.next to the new node. Reaching the tail took a full walk: O(n).`, {
      ptrs: { curr },
      hl: { [id]: 'new' },
      edge: curr,
    });
    return { state: s, steps: t.steps, log: { text: `insert tail ${x}`, tone: 'ok' } };
  },

  insertAt(state, i, x) {
    const n = listOrder(state.nodes, state.head).length;
    if (i <= 0) {
      const r = llOps.insertHead(state, x);
      return { ...r, log: { ...r.log, text: `insert ${x} at 0` } };
    }
    const t = recorder(state, 'insertAt');
    const { s } = t;
    if (n >= LL_CAP) {
      t.snap(0, `The demo list is capped at ${LL_CAP} nodes. Delete one first.`);
      return { state, steps: t.steps, log: { text: `insert ${x}: full`, tone: 'bad' } };
    }
    if (i > n) {
      t.snap(0, `Index ${i} is past the end: the list has ${n} nodes, so valid positions are 0 to ${n}.`);
      return { state, steps: t.steps, log: { text: `insert at ${i}: bad index`, tone: 'bad' } };
    }
    t.snap(0, `insertAt(${i}, ${x}): the new node should end up at position ${i}.`);
    t.snap(1, `i is ${i}, not 0, so we need the node just before position ${i}.`);
    let prev = s.head;
    t.snap(2, `Start prev at head (${v(s, prev)}).`, { ptrs: { prev }, hl: { [prev]: 'look' } });
    for (let k = 1; k < i; k++) {
      prev = s.nodes[prev].next;
      t.snap(3, `Step ${k} of ${i - 1}: prev moves to ${v(s, prev)}.`, { ptrs: { prev }, hl: { [prev]: 'look' } });
    }
    const id = newId();
    s.nodes[id] = { v: x, next: null };
    const o = [...t.order];
    o.splice(i, 0, id);
    t.setOrder(o);
    t.detach(id);
    t.snap(4, `Create a node holding ${x}.`, { ptrs: { prev, node: id }, hl: { [prev]: 'key', [id]: 'new' } });
    s.nodes[id].next = s.nodes[prev].next;
    t.snap(5, `node.next = prev.next: the new node points at ${v(s, s.nodes[id].next)}. Do this first so the rest of the list is not lost.`, {
      ptrs: { prev, node: id },
      hl: { [prev]: 'key', [id]: 'new' },
      edge: id,
    });
    s.nodes[prev].next = id;
    t.relayout();
    t.snap(6, `prev.next = node: ${v(s, prev)} now points at ${x}. Two pointer writes, no shifting.`, {
      ptrs: { prev },
      hl: { [id]: 'new' },
      edge: prev,
    });
    return { state: s, steps: t.steps, log: { text: `insert ${x} at ${i}`, tone: 'ok' } };
  },

  remove(state, x) {
    const t = recorder(state, 'remove');
    const { s } = t;
    t.snap(0, `delete(${x}): find the first node holding ${x} and unlink it.`);
    if (!s.head) {
      t.snap(1, 'The list is empty. Nothing to delete.');
      return { state, steps: t.steps, log: { text: `delete ${x}: empty`, tone: 'bad' } };
    }
    const drop = (id, line, msg, ptrs) => {
      t.snap(line, msg, { ptrs, hl: { [id]: 'out' }, edge: ptrs.prev ?? null });
      delete s.nodes[id];
      t.relayout();
      t.snap(line, `Nothing points at ${x} any more, so the node is freed.`);
    };
    if (s.nodes[s.head].v === x) {
      const old = s.head;
      t.snap(2, `head holds ${x}. Move head to the second node.`, { hl: { [old]: 'out' } });
      s.head = s.nodes[old].next;
      drop(old, 2, `head now points at ${v(s, s.head)}; ${x} is cut off.`, {});
      return { state: s, steps: t.steps, log: { text: `delete ${x}`, tone: 'ok' } };
    }
    let prev = s.head;
    let curr = s.nodes[prev].next;
    t.snap(3, `head holds ${v(s, prev)}, not ${x}. Start prev at head and curr at the next node.`, {
      ptrs: { prev, curr },
      hl: { [prev]: 'key', ...(curr ? { [curr]: 'look' } : {}) },
    });
    while (curr) {
      t.snap(5, `Does ${v(s, curr)} equal ${x}? ${s.nodes[curr].v === x ? 'Yes.' : 'No.'}`, {
        ptrs: { prev, curr },
        hl: { [prev]: 'key', [curr]: 'look' },
      });
      if (s.nodes[curr].v === x) {
        s.nodes[prev].next = s.nodes[curr].next;
        drop(curr, 6, `prev.next = curr.next: ${v(s, prev)} now skips over ${x} to ${v(s, s.nodes[prev].next)}.`, { prev, curr });
        return { state: s, steps: t.steps, log: { text: `delete ${x}`, tone: 'ok' } };
      }
      prev = curr;
      curr = s.nodes[curr].next;
      t.snap(7, curr ? `Advance: prev = ${v(s, prev)}, curr = ${v(s, curr)}.` : 'Advance: curr falls off the end (null).', {
        ptrs: { prev, curr },
        hl: { [prev]: 'key', ...(curr ? { [curr]: 'look' } : {}) },
      });
    }
    t.snap(8, `Reached the end without seeing ${x}. The list is unchanged.`);
    return { state, steps: t.steps, log: { text: `delete ${x}: not found`, tone: 'bad' } };
  },

  reverse(state) {
    const t = recorder(state, 'reverse');
    const { s } = t;
    t.snap(0, 'reverse(): flip every next pointer so the list runs the other way.');
    let prev = null;
    let curr = s.head;
    let next = null;
    t.snap(1, 'prev starts at null (the new tail will point there); curr starts at head.', {
      ptrs: { prev, curr },
      hl: curr ? { [curr]: 'look' } : {},
    });
    while (curr) {
      const hl = { [curr]: 'look', ...(prev ? { [prev]: 'key' } : {}) };
      t.snap(2, `curr is ${v(s, curr)}, not null, so keep going.`, { ptrs: { prev, curr, next }, hl });
      next = s.nodes[curr].next;
      t.snap(3, `Save next = ${v(s, next)} before we overwrite curr.next, or we would lose the rest of the list.`, {
        ptrs: { prev, curr, next },
        hl,
      });
      s.nodes[curr].next = prev;
      t.snap(4, `curr.next = prev: ${v(s, curr)} now points back at ${v(s, prev)}.`, {
        ptrs: { prev, curr, next },
        hl: { ...hl, [curr]: 'out' },
        edge: curr,
      });
      prev = curr;
      t.snap(5, `prev steps forward to ${v(s, prev)}.`, { ptrs: { prev, curr, next }, hl: { [prev]: 'key' } });
      curr = next;
      t.snap(6, curr ? `curr steps forward to ${v(s, curr)}.` : 'curr steps forward to null.', {
        ptrs: { prev, curr, next },
        hl: { ...(prev ? { [prev]: 'key' } : {}), ...(curr ? { [curr]: 'look' } : {}) },
      });
    }
    t.snap(2, 'curr is null: every pointer has been flipped.', { ptrs: { prev, curr, next }, hl: prev ? { [prev]: 'key' } : {} });
    s.head = prev;
    t.relayout();
    t.snap(7, prev ? `head = prev. ${v(s, prev)} is the new first node. One pass, O(n) time, O(1) extra space.` : 'The list was empty.', {
      hl: prev ? { [prev]: 'new' } : {},
    });
    return { state: s, steps: t.steps, log: { text: 'reverse', tone: 'ok' } };
  },

  middle(state) {
    const t = recorder(state, 'middle');
    const { s } = t;
    t.snap(0, 'middle(): fast moves two nodes per turn, slow moves one. When fast runs out, slow is halfway.');
    if (!s.head) {
      t.snap(5, 'The list is empty, so there is no middle.');
      return { state, steps: t.steps, log: { text: 'middle: empty', tone: 'bad' } };
    }
    let slow = s.head;
    let fast = s.head;
    const hl = () => ({ [slow]: 'key', ...(fast ? { [fast]: 'look' } : {}) });
    t.snap(1, `slow and fast both start at head (${v(s, slow)}).`, { ptrs: { slow, fast }, hl: hl() });
    for (;;) {
      const go = fast && s.nodes[fast].next;
      t.snap(2, go ? 'fast and fast.next both exist, so both pointers move.' : `${fast ? 'fast.next' : 'fast'} is null: stop.`, {
        ptrs: { slow, fast },
        hl: hl(),
      });
      if (!go) break;
      slow = s.nodes[slow].next;
      t.snap(3, `slow takes one step to ${v(s, slow)}.`, { ptrs: { slow, fast }, hl: hl() });
      fast = s.nodes[s.nodes[fast].next].next;
      t.snap(4, `fast takes two steps to ${v(s, fast)}.`, { ptrs: { slow, fast }, hl: hl() });
    }
    t.snap(5, `The middle node is ${v(s, slow)}, found in one pass without knowing the length.`, {
      ptrs: { slow },
      hl: { [slow]: 'new' },
    });
    return { state: { ...state, stats: s.stats }, steps: t.steps, log: { text: `middle → ${v(s, slow)}`, tone: 'info' } };
  },
};
