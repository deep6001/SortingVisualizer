export default {
  id: 'searching',
  title: 'Searching',
  tagline: 'Find a value by checking every slot, halving a sorted window, or sliding two pointers toward each other.',
  algorithms: [
    { id: 'linear', name: 'Linear search', summary: 'Check each element from left to right until one matches. Works on any order.', complexity: { best: 'O(1)', avg: 'O(n)', worst: 'O(n)', space: 'O(1)' } },
    { id: 'binary', name: 'Binary search', summary: 'Look at the middle of a sorted window and throw away the half that cannot hold the target.', complexity: { best: 'O(1)', avg: 'O(log n)', worst: 'O(log n)', space: 'O(1)' } },
    { id: 'jump', name: 'Jump search', summary: 'Hop through a sorted array in blocks of √n, then scan the one block that could hold the target.', complexity: { best: 'O(1)', avg: 'O(√n)', worst: 'O(√n)', space: 'O(1)' } },
    { id: 'interpolation', name: 'Interpolation search', summary: 'Estimate where the target should be from its value, the way you open a phone book near the right letter.', complexity: { best: 'O(1)', avg: 'O(log log n)', worst: 'O(n)', space: 'O(1)' } },
    { id: 'exponential', name: 'Exponential search', summary: 'Double a bound (1, 2, 4, 8…) until it passes the target, then binary search that last stretch.', complexity: { best: 'O(1)', avg: 'O(log i)', worst: 'O(log n)', space: 'O(1)' } },
    { id: 'ternary', name: 'Ternary search', summary: 'Split a sorted window at two points and keep the one third that can hold the target.', complexity: { best: 'O(1)', avg: 'O(log₃ n)', worst: 'O(log₃ n)', space: 'O(1)' } },
    { id: 'two-pointers', name: 'Two pointers (pair sum)', summary: 'Find two values in a sorted array that add up to a target by walking one pointer in from each end.', complexity: { best: 'O(1)', avg: 'O(n)', worst: 'O(n)', space: 'O(1)' } },
    { id: 'sliding-window', name: 'Sliding window (max sum of k)', summary: 'Find the k neighbours with the largest sum by sliding a window and updating its sum instead of re-adding.', complexity: { best: 'O(n)', avg: 'O(n)', worst: 'O(n)', space: 'O(1)' } },
  ],
};
