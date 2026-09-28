export default {
  id: 'trees',
  title: 'Trees',
  tagline: 'Insert, delete and search in live trees, and watch nodes slide into place as they rebalance.',
  algorithms: [
    { id: 'bst', name: 'Binary search tree', summary: 'Smaller keys go left, larger keys go right. Delete handles leaves, one child and two children.', complexity: { best: 'O(log n)', avg: 'O(log n)', worst: 'O(n)', space: 'O(n)' } },
    { id: 'traversals', name: 'Tree traversals', summary: 'Four orders for visiting every node: in-order, pre-order, post-order and level-order.', complexity: { avg: 'O(n)', space: 'O(h) stack, O(w) queue' } },
    { id: 'avl', name: 'AVL tree', summary: 'A BST that rotates after every change so the two sides of any node differ in height by at most one.', complexity: { best: 'O(log n)', avg: 'O(log n)', worst: 'O(log n)', space: 'O(n)' } },
    { id: 'heap', name: 'Binary heap', summary: 'A complete tree stored in an array. Every parent beats its children, so the best value sits at the root.', complexity: { best: 'O(1)', avg: 'O(log n)', worst: 'O(log n)', space: 'O(n)' } },
    { id: 'trie', name: 'Trie', summary: 'A tree of letters. Words that share a prefix share the path, so prefix lookups are fast.', complexity: { avg: 'O(L) per word', space: 'O(total letters)' } },
    { id: 'segment', name: 'Segment tree', summary: 'Each node stores the sum of a range, so any range sum or point update touches only O(log n) nodes.', complexity: { best: 'O(n) build', avg: 'O(log n) query', worst: 'O(log n) update', space: 'O(n)' } },
  ],
};
