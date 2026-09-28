export default {
  id: 'graphs',
  title: 'Graphs',
  tagline: 'Traverse, route and span random graphs on a live force layout you can drag, shake and drop.',
  algorithms: [
    { id: 'bfs', name: 'Breadth-first search', summary: 'Explore in rings: every node one hop away, then two hops, using a queue.', complexity: { avg: 'O(V + E)', space: 'O(V)' } },
    { id: 'dfs', name: 'Depth-first search', summary: 'Follow one path as deep as it goes, then back up and try the next branch.', complexity: { avg: 'O(V + E)', space: 'O(V)' } },
    { id: 'dijkstra', name: "Dijkstra's shortest paths", summary: 'Always settle the closest unsettled node next. Works when no edge is negative.', complexity: { avg: 'O((V + E) log V)', space: 'O(V + E)' } },
    { id: 'bellman-ford', name: 'Bellman–Ford', summary: 'Relax every edge n-1 times. Slower than Dijkstra, but handles negative weights and spots negative cycles.', complexity: { best: 'O(E)', avg: 'O(V·E)', worst: 'O(V·E)', space: 'O(V)' } },
    { id: 'prim', name: "Prim's MST", summary: 'Grow one tree from a start node, always adding the lightest edge that reaches a new node.', complexity: { avg: 'O(E log V)', space: 'O(E)' } },
    { id: 'kruskal', name: "Kruskal's MST", summary: 'Take edges from lightest to heaviest, skipping any that would close a cycle. Union-find tracks the pieces.', complexity: { avg: 'O(E log E)', space: 'O(V)' } },
    { id: 'topo', name: 'Topological sort', summary: "Kahn's algorithm: repeatedly output a node with nothing pointing into it.", complexity: { avg: 'O(V + E)', space: 'O(V)' } },
    { id: 'scc', name: 'Strongly connected components', summary: "Tarjan's algorithm finds groups where every node can reach every other, in a single DFS.", complexity: { avg: 'O(V + E)', space: 'O(V)' } },
    { id: 'floyd', name: 'Floyd–Warshall', summary: 'Shortest paths between every pair, by allowing one more intermediate node at a time.', complexity: { avg: 'O(V³)', space: 'O(V²)' } },
  ],
};
