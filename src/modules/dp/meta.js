export default {
  id: 'dp',
  title: 'Dynamic programming',
  tagline: 'Fill a table one cell at a time, see which earlier cells each answer reads, then walk back to recover the solution.',
  algorithms: [
    { id: 'fibonacci', name: 'Fibonacci', summary: 'Store each Fibonacci number once so F(n) needs n additions instead of an exponential tree of calls.', complexity: { time: 'O(n)', space: 'O(n)' } },
    { id: 'coin-change', name: 'Coin change', summary: 'Find the fewest coins that make an amount, or count every way to make it.', complexity: { time: 'O(k · amount)', space: 'O(k · amount)' } },
    { id: 'knapsack', name: '0/1 knapsack', summary: 'Pick items with the most total value that still fit in the bag. Each item is taken whole or not at all.', complexity: { time: 'O(n · W)', space: 'O(n · W)' } },
    { id: 'lcs', name: 'Longest common subsequence', summary: 'The longest run of letters that appears in both strings in order, though not necessarily side by side.', complexity: { time: 'O(m · n)', space: 'O(m · n)' } },
    { id: 'edit-distance', name: 'Edit distance', summary: 'The fewest inserts, deletes and replacements that turn one word into another (Levenshtein distance).', complexity: { time: 'O(m · n)', space: 'O(m · n)' } },
    { id: 'lis', name: 'Longest increasing subsequence', summary: 'The longest set of values, kept in order, where each is bigger than the one before.', complexity: { time: 'O(n²)', space: 'O(n)' } },
    { id: 'unique-paths', name: 'Unique paths', summary: 'Count the routes across a grid moving only right or down, with blocked cells in the way.', complexity: { time: 'O(R · C)', space: 'O(R · C)' } },
    { id: 'kadane', name: 'Maximum subarray (Kadane)', summary: 'At each index, either extend the running sum or restart from here. The best value seen is the answer.', complexity: { time: 'O(n)', space: 'O(1) (table shown for clarity)' } },
  ],
};
