export default {
  id: 'pathfinding',
  title: 'Pathfinding',
  tagline: 'Draw walls and weights on a grid, carve a maze, then watch searches race from start to goal.',
  algorithms: [
    { id: 'bfs', name: 'Breadth-first search', summary: 'Explore in rings of equal distance, so the first time it reaches the goal is along a shortest path. Ignores weights.', complexity: { best: 'O(1)', avg: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)' } },
    { id: 'dfs', name: 'Depth-first search', summary: 'Follow one corridor as far as it goes before backing up. Finds a path, rarely the shortest one.', complexity: { best: 'O(1)', avg: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)' } },
    { id: 'dijkstra', name: "Dijkstra's algorithm", summary: 'Always expand the cheapest cell found so far. Finds the lowest-cost path, and weighted cells cost 5.', complexity: { best: 'O(1)', avg: 'O((V + E) log V)', worst: 'O((V + E) log V)', space: 'O(V)' } },
    { id: 'astar', name: 'A* search', summary: 'Dijkstra plus a guess of the distance left (Manhattan distance), so it heads toward the goal but still finds the cheapest path.', complexity: { best: 'O(d)', avg: 'O(E log V)', worst: 'O((V + E) log V)', space: 'O(V)' } },
    { id: 'greedy', name: 'Greedy best-first', summary: 'Always expand the cell that looks closest to the goal. Fast, but the path it finds can be long.', complexity: { best: 'O(d)', avg: 'O(E log V)', worst: 'O((V + E) log V)', space: 'O(V)' } },
    { id: 'bidirectional', name: 'Bidirectional BFS', summary: 'Run breadth-first search from both ends and stop where they meet. Still shortest, with far fewer cells visited.', complexity: { best: 'O(1)', avg: 'O(b^(d/2))', worst: 'O(V + E)', space: 'O(V)' } },
    { id: 'maze-dfs', name: 'Maze: recursive backtracker', summary: 'Carve a random walk through the walls and back up at dead ends. Makes long, winding corridors.', complexity: { avg: 'O(V)', space: 'O(V)' } },
    { id: 'maze-prim', name: "Maze: randomized Prim's", summary: 'Grow the maze from a random frontier cell each step. Makes lots of short branches.', complexity: { avg: 'O(V log V)', space: 'O(V)' } },
    { id: 'maze-division', name: 'Maze: recursive division', summary: 'Split an open room with a wall that has one gap, then split each half the same way.', complexity: { avg: 'O(V log V)', space: 'O(log V)' } },
  ],
};
