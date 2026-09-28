# AlgoAnimate

An interactive visualizer for data structures and algorithms. Every algorithm records each step before playback, so you can play, pause, step forward and back, or scrub the timeline while the matching line of pseudocode is highlighted and a sentence explains what just happened.

Views:

- **2D**: clean bars, grids, tables and trees.
- **3D**: three.js scenes you can orbit, with lit, glowing elements.
- **Physics**: Rapier rigid bodies. Bars rain down and can be knocked over with a wrecking ball, stack crates land with real collisions, queens drop onto the board, and marbles roll through mazes.

## Modules

| Module | What's inside |
|---|---|
| Sorting | 18 algorithms: bubble, cocktail, selection, insertion, gnome, shell, comb, odd–even, cycle, pancake, merge, quick, heap, tim, counting, radix, bucket, bitonic. Plus a **race** mode that runs four side by side on the same input. |
| Searching | Linear, binary, jump, interpolation, exponential, ternary, two pointers, sliding window |
| Pathfinding | BFS, DFS, Dijkstra, A*, greedy best-first, bidirectional BFS on a grid you draw on, plus maze generators |
| Graphs | Traversals, shortest paths, minimum spanning trees, topological sort and more on a live force-directed 3D graph |
| Trees | BST, traversals, AVL rotations, heaps, trie |
| Data structures | Stack, queue, linked list, hash table |
| Dynamic programming | Fibonacci, coin change, knapsack, LCS, edit distance, LIS, Kadane and more, with tables and 3D "DP landscapes" |
| Backtracking | N-Queens, Sudoku, rat in a maze, subset sum, knight's tour |
| Recursion | Tower of Hanoi, call trees, call stack, permutations, subsets |

Keyboard: `Space` play/pause, `←` `→` step, `R` reset. Sound can be turned on in the transport bar: pitch follows the value being touched.

## Run it

```bash
npm install
npm run dev
```

## Stack

React 19, Vite, Tailwind CSS, three.js with @react-three/fiber and drei, @react-three/rapier for physics, @react-three/postprocessing for bloom, motion, lucide-react.

## Adding an algorithm

See [MODULE_GUIDE.md](MODULE_GUIDE.md). In short: write a pure function that records steps, list it in the module's `meta.js`, and the shared player, transport, pseudocode panel and stats handle the rest.
