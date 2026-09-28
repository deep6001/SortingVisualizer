// Stack, queue, deque and ring buffer. Every operation takes the current state and
// returns { state, steps, log } so the page can replay it and keep the result.
//
// step: { items: [{ id, v }], hl: { [id]: role }, line, msg, op, stats }
// roles: look (amber), out (coral), new (mint), key (violet)

let uid = 0;
export const newId = () => `n${++uid}`;

export const randomValue = () => 1 + Math.floor(Math.random() * 99);

function recorder(state, op) {
  const s = { items: [...state.items], stats: { ...state.stats } };
  const steps = [];
  const snap = (line, msg, hl = {}) =>
    steps.push({ items: [...s.items], hl, line, msg, op, stats: { ...s.stats, size: s.items.length } });
  return { s, steps, snap };
}

export const initialLinear = (values = []) => ({
  items: values.map((v) => ({ id: newId(), v })),
  stats: { ops: 0 },
});

export const introStep = (state, msg) => ({
  items: state.items,
  hl: {},
  line: null,
  msg,
  op: null,
  stats: { ...state.stats, size: state.items.length },
});

/* ---------- stack ---------- */

export const STACK_CAP = 20;

export const stackCode = [
  'push(x):',
  '  if size == capacity: overflow',
  '  top = top + 1',
  '  items[top] = x',
  'pop():',
  '  if size == 0: underflow',
  '  x = items[top]',
  '  top = top - 1; return x',
  'peek():',
  '  if size == 0: underflow',
  '  return items[top]',
];

export const stackOps = {
  push(state, v) {
    const { s, steps, snap } = recorder(state, 'push');
    s.stats.ops++;
    snap(0, `push(${v}): put ${v} on top of the stack.`);
    if (s.items.length >= STACK_CAP) {
      snap(1, `The stack already holds ${STACK_CAP} items, its capacity. Stack overflow: ${v} is rejected.`);
      return { state: s, steps, log: { text: `push ${v}: overflow`, tone: 'bad' } };
    }
    snap(2, `Size ${s.items.length} is below capacity ${STACK_CAP}, so top moves up to index ${s.items.length}.`);
    const item = { id: newId(), v };
    s.items.push(item);
    snap(3, `${v} lands on top. The stack now holds ${s.items.length} item${s.items.length > 1 ? 's' : ''}.`, { [item.id]: 'new' });
    return { state: s, steps, log: { text: `push ${v}`, tone: 'ok' } };
  },
  pop(state) {
    const { s, steps, snap } = recorder(state, 'pop');
    s.stats.ops++;
    snap(4, 'pop(): remove and return the top item.');
    if (!s.items.length) {
      snap(5, 'The stack is empty, so there is nothing to pop. Stack underflow.');
      return { state: s, steps, log: { text: 'pop: underflow', tone: 'bad' } };
    }
    const top = s.items[s.items.length - 1];
    snap(6, `The top item is ${top.v}, the last one pushed.`, { [top.id]: 'out' });
    s.items.pop();
    const below = s.items[s.items.length - 1];
    snap(
      7,
      below ? `${top.v} leaves. ${below.v} is the new top.` : `${top.v} leaves. The stack is now empty.`,
      below ? { [below.id]: 'key' } : {},
    );
    return { state: s, steps, log: { text: `pop → ${top.v}`, tone: 'ok' } };
  },
  peek(state) {
    const { s, steps, snap } = recorder(state, 'peek');
    s.stats.ops++;
    snap(8, 'peek(): look at the top item without removing it.');
    if (!s.items.length) {
      snap(9, 'The stack is empty, so there is no top to look at.');
      return { state: s, steps, log: { text: 'peek: empty', tone: 'bad' } };
    }
    const top = s.items[s.items.length - 1];
    snap(10, `The top item is ${top.v}. Nothing moves.`, { [top.id]: 'look' });
    return { state: s, steps, log: { text: `peek → ${top.v}`, tone: 'info' } };
  },
  /** Push `count` random values, one step each. */
  stress(state, count = 20) {
    const { s, steps, snap } = recorder(state, 'push');
    snap(0, `Stress test: push ${count} values as fast as possible.`);
    let pushed = 0;
    for (let k = 0; k < count; k++) {
      s.stats.ops++;
      if (s.items.length >= STACK_CAP) {
        snap(1, `Capacity ${STACK_CAP} reached after ${pushed} pushes. Stack overflow stops the test.`);
        break;
      }
      const item = { id: newId(), v: randomValue() };
      s.items.push(item);
      pushed++;
      snap(3, `push(${item.v}): lands on top as item ${s.items.length}.`, { [item.id]: 'new' });
    }
    return { state: s, steps, log: { text: `stress: ${pushed} pushes`, tone: pushed < count ? 'bad' : 'ok' } };
  },
  clear(state) {
    const { s, steps, snap } = recorder(state, 'pop');
    snap(4, `Clear: pop all ${s.items.length} items.`);
    while (s.items.length) {
      const top = s.items.pop();
      snap(7, `pop() returns ${top.v}.`);
    }
    return { state: s, steps, log: { text: 'clear', tone: 'info' } };
  },
};

/* ---------- queue ---------- */

export const QUEUE_CAP = 10;

export const queueCode = [
  'enqueue(x):',
  '  if size == capacity: overflow',
  '  items[back] = x; back = back + 1',
  'dequeue():',
  '  if size == 0: underflow',
  '  x = items[front]',
  '  front = front + 1; return x',
  'peek():',
  '  return items[front]',
];

export const queueOps = {
  enqueue(state, v) {
    const { s, steps, snap } = recorder(state, 'enqueue');
    s.stats.ops++;
    snap(0, `enqueue(${v}): ${v} joins the back of the line.`);
    if (s.items.length >= QUEUE_CAP) {
      snap(1, `The queue is full (${QUEUE_CAP} items). ${v} is turned away.`);
      return { state: s, steps, log: { text: `enqueue ${v}: full`, tone: 'bad' } };
    }
    const item = { id: newId(), v };
    s.items.push(item);
    snap(2, `${v} is now at the back, position ${s.items.length} in line.`, { [item.id]: 'new' });
    return { state: s, steps, log: { text: `enqueue ${v}`, tone: 'ok' } };
  },
  dequeue(state) {
    const { s, steps, snap } = recorder(state, 'dequeue');
    s.stats.ops++;
    snap(3, 'dequeue(): remove the item that has waited longest.');
    if (!s.items.length) {
      snap(4, 'The queue is empty. Queue underflow.');
      return { state: s, steps, log: { text: 'dequeue: underflow', tone: 'bad' } };
    }
    const front = s.items[0];
    snap(5, `The front item is ${front.v}; it arrived before everything else still waiting.`, { [front.id]: 'out' });
    s.items.shift();
    const next = s.items[0];
    snap(
      6,
      next ? `${front.v} leaves. ${next.v} is the new front.` : `${front.v} leaves. The queue is empty.`,
      next ? { [next.id]: 'key' } : {},
    );
    return { state: s, steps, log: { text: `dequeue → ${front.v}`, tone: 'ok' } };
  },
  peek(state) {
    const { s, steps, snap } = recorder(state, 'peek');
    s.stats.ops++;
    if (!s.items.length) {
      snap(7, 'The queue is empty, so there is no front to look at.');
      return { state: s, steps, log: { text: 'peek: empty', tone: 'bad' } };
    }
    snap(8, `The front item is ${s.items[0].v}. Nothing moves.`, { [s.items[0].id]: 'look' });
    return { state: s, steps, log: { text: `peek → ${s.items[0].v}`, tone: 'info' } };
  },
  stress(state, count = QUEUE_CAP) {
    const { s, steps, snap } = recorder(state, 'enqueue');
    snap(0, `Stress test: enqueue ${count} values in a row.`);
    let added = 0;
    for (let k = 0; k < count; k++) {
      s.stats.ops++;
      if (s.items.length >= QUEUE_CAP) {
        snap(1, `The belt is full after ${added} enqueues.`);
        break;
      }
      const item = { id: newId(), v: randomValue() };
      s.items.push(item);
      added++;
      snap(2, `enqueue(${item.v}) at position ${s.items.length}.`, { [item.id]: 'new' });
    }
    return { state: s, steps, log: { text: `stress: ${added} enqueues`, tone: added < count ? 'bad' : 'ok' } };
  },
};

/* ---------- deque ---------- */

export const DEQUE_CAP = 10;

export const dequeCode = [
  'pushFront(x):',
  '  if size == capacity: overflow',
  '  front = front - 1; items[front] = x',
  'pushBack(x):',
  '  if size == capacity: overflow',
  '  items[back] = x; back = back + 1',
  'popFront():',
  '  if size == 0: underflow',
  '  x = items[front]; front = front + 1',
  'popBack():',
  '  if size == 0: underflow',
  '  back = back - 1; x = items[back]',
];

function dequePush(state, v, atFront) {
  const { s, steps, snap } = recorder(state, atFront ? 'pushFront' : 'pushBack');
  const base = atFront ? 0 : 3;
  s.stats.ops++;
  snap(base, `${atFront ? 'pushFront' : 'pushBack'}(${v}): add ${v} at the ${atFront ? 'front' : 'back'}.`);
  if (s.items.length >= DEQUE_CAP) {
    snap(base + 1, `The deque is full (${DEQUE_CAP} items).`);
    return { state: s, steps, log: { text: `push ${atFront ? 'front' : 'back'} ${v}: full`, tone: 'bad' } };
  }
  const item = { id: newId(), v };
  if (atFront) s.items.unshift(item);
  else s.items.push(item);
  snap(base + 2, `${v} is the new ${atFront ? 'front' : 'back'}. Nothing else had to move.`, { [item.id]: 'new' });
  return { state: s, steps, log: { text: `push ${atFront ? 'front' : 'back'} ${v}`, tone: 'ok' } };
}

function dequePop(state, atFront) {
  const { s, steps, snap } = recorder(state, atFront ? 'popFront' : 'popBack');
  const base = atFront ? 6 : 9;
  s.stats.ops++;
  snap(base, `${atFront ? 'popFront' : 'popBack'}(): remove the ${atFront ? 'first' : 'last'} item.`);
  if (!s.items.length) {
    snap(base + 1, 'The deque is empty. Underflow.');
    return { state: s, steps, log: { text: `pop ${atFront ? 'front' : 'back'}: underflow`, tone: 'bad' } };
  }
  const it = atFront ? s.items[0] : s.items[s.items.length - 1];
  snap(base + 2, `Take ${it.v} from the ${atFront ? 'front' : 'back'}.`, { [it.id]: 'out' });
  if (atFront) s.items.shift();
  else s.items.pop();
  snap(base + 2, `${it.v} is gone. ${s.items.length} item${s.items.length === 1 ? '' : 's'} left.`);
  return { state: s, steps, log: { text: `pop ${atFront ? 'front' : 'back'} → ${it.v}`, tone: 'ok' } };
}

export const dequeOps = {
  pushFront: (state, v) => dequePush(state, v, true),
  pushBack: (state, v) => dequePush(state, v, false),
  popFront: (state) => dequePop(state, true),
  popBack: (state) => dequePop(state, false),
};

/* ---------- ring buffer ---------- */
// step: { buf: [{ id, v } | null], head, tail, count, hl: { [slot]: role }, line, msg, stats }

export const RING_CAP = 8;

export const ringCode = [
  'enqueue(x):',
  '  if count == capacity: overflow',
  '  buf[tail] = x',
  '  tail = (tail + 1) mod capacity; count += 1',
  'dequeue():',
  '  if count == 0: underflow',
  '  x = buf[head]; buf[head] = empty',
  '  head = (head + 1) mod capacity; count -= 1',
  '  return x',
];

export const initialRing = () => ({
  buf: Array(RING_CAP).fill(null),
  head: 0,
  tail: 0,
  count: 0,
  stats: { ops: 0, wraps: 0 },
});

function ringRecorder(state, op) {
  const s = { ...state, buf: [...state.buf], stats: { ...state.stats } };
  const steps = [];
  const snap = (line, msg, hl = {}) =>
    steps.push({ buf: [...s.buf], head: s.head, tail: s.tail, count: s.count, hl, line, msg, op, stats: { ...s.stats, size: s.count } });
  return { s, steps, snap };
}

export const ringIntro = (state, msg) => ({
  buf: state.buf,
  head: state.head,
  tail: state.tail,
  count: state.count,
  hl: {},
  line: null,
  msg,
  stats: { ...state.stats, size: state.count },
});

export const ringOps = {
  enqueue(state, v) {
    const { s, steps, snap } = ringRecorder(state, 'enqueue');
    s.stats.ops++;
    snap(0, `enqueue(${v}): write at the tail index ${s.tail}.`, { [s.tail]: 'look' });
    if (s.count === RING_CAP) {
      snap(1, `All ${RING_CAP} slots are in use: tail has caught up with head. Overflow.`, { [s.tail]: 'out' });
      return { state: s, steps, log: { text: `enqueue ${v}: full`, tone: 'bad' } };
    }
    s.buf[s.tail] = { id: newId(), v };
    snap(2, `Store ${v} in slot ${s.tail}.`, { [s.tail]: 'new' });
    const old = s.tail;
    s.tail = (s.tail + 1) % RING_CAP;
    s.count++;
    if (s.tail < old) s.stats.wraps++;
    snap(
      3,
      s.tail < old
        ? `Tail wraps from ${old} back to 0: (${old} + 1) mod ${RING_CAP} = 0. No shifting needed.`
        : `Tail moves to (${old} + 1) mod ${RING_CAP} = ${s.tail}. ${s.count} of ${RING_CAP} slots used.`,
      { [old]: 'new' },
    );
    return { state: s, steps, log: { text: `enqueue ${v}`, tone: 'ok' } };
  },
  dequeue(state) {
    const { s, steps, snap } = ringRecorder(state, 'dequeue');
    s.stats.ops++;
    snap(4, `dequeue(): read from the head index ${s.head}.`, { [s.head]: 'look' });
    if (s.count === 0) {
      snap(5, 'Count is 0, the buffer is empty. Underflow.');
      return { state: s, steps, log: { text: 'dequeue: underflow', tone: 'bad' } };
    }
    const it = s.buf[s.head];
    snap(6, `Take ${it.v} out of slot ${s.head} and mark the slot empty.`, { [s.head]: 'out' });
    s.buf[s.head] = null;
    const old = s.head;
    s.head = (s.head + 1) % RING_CAP;
    s.count--;
    if (s.head < old) s.stats.wraps++;
    snap(
      7,
      s.head < old
        ? `Head wraps from ${old} back to 0. ${s.count} item${s.count === 1 ? '' : 's'} left.`
        : `Head moves to (${old} + 1) mod ${RING_CAP} = ${s.head}. ${s.count} item${s.count === 1 ? '' : 's'} left.`,
    );
    snap(8, `Return ${it.v}.`);
    return { state: s, steps, log: { text: `dequeue → ${it.v}`, tone: 'ok' } };
  },
};
