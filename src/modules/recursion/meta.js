export default {
  id: 'recursion',
  title: 'Recursion',
  tagline: 'Watch functions call themselves: call trees grow, stacks pile up and unwind, disks hop between pegs.',
  algorithms: [
    {
      id: 'hanoi',
      name: 'Tower of Hanoi',
      summary: 'Move a tower of disks to another peg, one disk at a time, never placing a larger disk on a smaller one.',
      complexity: { best: 'O(2ⁿ)', avg: 'O(2ⁿ)', worst: 'O(2ⁿ)', space: 'O(n) call stack' },
    },
    {
      id: 'fibonacci',
      name: 'Fibonacci call tree',
      summary: 'fib(n) = fib(n-1) + fib(n-2). The naive tree repeats itself; a memo cuts it down to a single path.',
      complexity: { best: 'O(n) memoized', avg: 'O(φⁿ) naive', worst: 'O(φⁿ) naive', space: 'O(n)' },
    },
    {
      id: 'factorial',
      name: 'Factorial and the call stack',
      summary: 'Each call waits on a smaller one, so frames pile up until the base case, then unwind with the answer.',
      complexity: { best: 'O(n)', avg: 'O(n)', worst: 'O(n)', space: 'O(n) stack frames' },
    },
    {
      id: 'permutations',
      name: 'Permutations',
      summary: 'Pick a letter, recurse on the rest, then undo the pick and try the next one.',
      complexity: { best: 'O(n · n!)', avg: 'O(n · n!)', worst: 'O(n · n!)', space: 'O(n) depth' },
    },
    {
      id: 'subsets',
      name: 'Power set',
      summary: 'For every element, branch twice: take it or leave it. The leaves are all 2ⁿ subsets.',
      complexity: { best: 'O(n · 2ⁿ)', avg: 'O(n · 2ⁿ)', worst: 'O(n · 2ⁿ)', space: 'O(n) depth' },
    },
    {
      id: 'flood-fill',
      name: 'Flood fill',
      summary: 'Paint a cell, then ask each of its four neighbours to do the same. The paint-bucket tool, recursively.',
      complexity: { best: 'O(cells)', avg: 'O(cells)', worst: 'O(cells)', space: 'O(cells) recursion depth' },
    },
    {
      id: 'merge-tree',
      name: 'Merge sort tree',
      summary: 'Split the array in half until every piece is one element, then merge sorted halves on the way back up.',
      complexity: { best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' },
    },
  ],
};
