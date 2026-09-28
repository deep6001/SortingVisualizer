export default {
  id: 'structures',
  title: 'Data structures',
  tagline: 'Push, pop, link and hash by hand, then watch the crates obey real physics.',
  algorithms: [
    {
      id: 'stack',
      name: 'Stack',
      summary: 'Last in, first out. Crates land on the pile and only the top one can leave.',
      complexity: { best: 'O(1) push / pop', worst: 'O(1) push / pop', space: 'O(n)' },
    },
    {
      id: 'queue',
      name: 'Queue',
      summary: 'First in, first out. Crates join at the back of the belt and leave from the front.',
      complexity: { best: 'O(1) enqueue / dequeue', worst: 'O(1) enqueue / dequeue', space: 'O(n)' },
    },
    {
      id: 'deque',
      name: 'Deque',
      summary: 'A double-ended queue: add or remove at either end in constant time.',
      complexity: { best: 'O(1) at both ends', worst: 'O(1) at both ends', space: 'O(n)' },
    },
    {
      id: 'ring-buffer',
      name: 'Circular buffer',
      summary: 'A fixed array whose head and tail indices wrap around, so a queue never has to shift items.',
      complexity: { best: 'O(1) enqueue / dequeue', worst: 'O(1) enqueue / dequeue', space: 'O(capacity)' },
    },
    {
      id: 'linked-list',
      name: 'Linked list',
      summary: 'Nodes that each hold a value and a pointer to the next node. Watch reversal flip one pointer at a time.',
      complexity: { best: 'O(1) insert at head', avg: 'O(n) search / insert at index', worst: 'O(n)', space: 'O(n)' },
    },
    {
      id: 'hash-table',
      name: 'Hash table',
      summary: 'Hash a key to pick a bucket; colliding keys share a chain. The table doubles when it gets too full.',
      complexity: { best: 'O(1)', avg: 'O(1) insert / lookup', worst: 'O(n) if every key collides', space: 'O(n + m)' },
    },
  ],
};
