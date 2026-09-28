export default {
  id: 'backtracking',
  title: 'Backtracking',
  tagline: 'Try a choice, go deeper, and undo it the moment it leads nowhere. Watch queens drop, digits get erased and a knight hop.',
  algorithms: [
    { id: 'n-queens', name: 'N-Queens', summary: 'Place n queens on an n×n board so that no two share a row, column or diagonal.', complexity: { best: 'O(n²)', worst: 'O(n!)', space: 'O(n)' } },
    { id: 'sudoku', name: 'Sudoku solver', summary: 'Fill the empty cells one at a time, trying digits 1 to 9 and erasing any that lead to a dead end.', complexity: { worst: 'O(9^m), m = empty cells', space: 'O(m)' } },
    { id: 'rat-maze', name: 'Rat in a maze', summary: 'Find a route from the top-left corner to the exit, backing out of every dead end.', complexity: { worst: 'O(n²) (visited cells are remembered)', space: 'O(n²)' } },
    { id: 'knights-tour', name: 'Knight’s tour', summary: 'Move a knight so it lands on every square exactly once. Warnsdorff’s rule makes it almost instant.', complexity: { best: 'O(n²) with Warnsdorff', worst: 'O(8^(n²)) plain', space: 'O(n²)' } },
    { id: 'subset-sum', name: 'Subset sum', summary: 'Decide whether some of the numbers add up to a target, drawing each include/skip choice as a tree.', complexity: { worst: 'O(2^n)', space: 'O(n)' } },
  ],
};
