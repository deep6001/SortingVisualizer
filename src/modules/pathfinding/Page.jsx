import { lazy, Suspense, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrickWall, Dices, Eraser, Route, Shuffle, Trash2, Weight, X } from 'lucide-react';
import meta from './meta';
import { generateMaze, mazes, runMaze, runSearch, searches } from './algorithms.js';
import { WALL, WEIGHT, applyMaze, emptyBoard, frameAt, gridSize, layersFor, randomWalls } from './grid.js';
import Grid2D from './Grid2D';
import useAlgo from '../../core/useAlgo';
import usePlayer from '../../core/usePlayer';
import { blip } from '../../core/audio';
import { palette } from '../../core/theme';
import VisualizerLayout from '../../core/ui/VisualizerLayout';
import ViewToggle from '../../core/ui/ViewToggle';
import { Button, Segmented, Select } from '../../core/ui/controls';

const Grid3D = lazy(() => import('./Grid3D'));
const GridPhysics = lazy(() => import('./GridPhysics'));

const toolOptions = [
  { value: 'wall', label: 'Walls', icon: <BrickWall size={13} /> },
  { value: 'weight', label: 'Weights', icon: <Weight size={13} /> },
  { value: 'erase', label: 'Erase', icon: <Eraser size={13} /> },
];

const mazeOptions = [
  { value: '', label: 'Generate a maze…' },
  { value: 'maze-dfs', label: 'Recursive backtracker' },
  { value: 'maze-prim', label: "Randomized Prim's" },
  { value: 'maze-division', label: 'Recursive division' },
];

const searchLegend = [
  { color: palette.violet, label: 'Start' },
  { color: palette.amber, label: 'Frontier' },
  { color: '#56567F', label: 'Visited' },
  { color: palette.mint, label: 'Goal / path' },
  { color: '#4E4E72', label: 'Wall' },
  { color: '#5B5B7B', label: 'Weight (cost 5)' },
];

const mazeLegend = [
  { color: '#4E4E72', label: 'Wall' },
  { color: palette.amber, label: 'Stack / frontier' },
  { color: palette.coral, label: 'Current cell' },
];

const mazeFrontierLabel = { 'maze-dfs': 'Stack depth', 'maze-prim': 'Frontier', 'maze-division': 'Grid' };

/** A starter board: a wall with a gap and a patch of weights, so the searches differ at a glance. */
function starterBoard() {
  const { W, H } = gridSize();
  const b = emptyBoard(W, H);
  const mid = W >> 1;
  for (let r = 0; r < H - 5; r++) b.cells[r * W + mid] = WALL;
  for (let r = H - 9; r < H; r++) for (let c = mid + 2; c < mid + 5; c++) b.cells[r * W + c] = WEIGHT;
  return b;
}

const newSeed = () => Math.floor(Math.random() * 2 ** 32);

export default function PathfindingPage() {
  const algo = useAlgo(meta);
  const navigate = useNavigate();
  const isMaze = algo.id in mazes;
  const [board, setBoard] = useState(starterBoard);
  const [tool, setTool] = useState('wall');
  const [seed, setSeed] = useState(newSeed);
  const [viewPick, setView] = useState('2d');
  const view = isMaze && viewPick === 'physics' ? '3d' : viewPick;
  const { W, H } = board;

  const trace = useMemo(
    () => (isMaze ? runMaze(algo.id, W, H, seed) : runSearch(algo.id, board)),
    [isMaze, algo.id, board, W, H, seed],
  );
  const player = usePlayer(trace.steps, {
    initialSpeed: isMaze ? 120 : 60,
    onStep: (s) => {
      if (s?.pathN > 0 && trace.path.length) blip(s.pathN / trace.path.length, { gain: 0.03 });
    },
  });

  // the player resets a frame after the trace changes, so clamp the index meanwhile
  const k = Math.min(player.index, trace.steps.length - 1);
  const step = trace.steps[k];
  const frame = useMemo(() => frameAt(trace, k), [trace, k]);
  const { base, overlay } = useMemo(() => layersFor(trace, frame, board), [trace, frame, board]);
  const pathN = step?.pathN ?? 0;
  const finished = !isMaze && k === trace.steps.length - 1 && trace.path.length > 0;

  const commit = (b) => setBoard(b);
  const keepEnds = (cells) => ({ ...board, cells });

  const stageProps = { board, base, overlay, cur: step?.cur ?? -1, path: trace.path, pathN, finished, maze: isMaze };
  const stage =
    view === '2d' ? (
      <Grid2D {...stageProps} editable={!isMaze} tool={tool} onCommit={commit} />
    ) : (
      <Suspense fallback={<StageLoading />}>
        {view === '3d' ? <Grid3D {...stageProps} /> : <GridPhysics {...stageProps} />}
      </Suspense>
    );

  const s = step?.stats ?? {};
  const stats = isMaze
    ? [
        { label: mazes[algo.id].statLabel, value: s.visited ?? 0, tone: 'text-mint' },
        { label: mazeFrontierLabel[algo.id], value: algo.id === 'maze-division' ? `${W} × ${H}` : s.frontier ?? 0, tone: 'text-amber' },
      ]
    : [
        { label: 'Visited', value: s.visited ?? 0, tone: 'text-sky' },
        { label: 'Frontier', value: s.frontier ?? 0, tone: 'text-amber' },
        { label: 'Path length', value: s.pathLen ? s.pathLen : '–', tone: 'text-mint' },
        { label: 'Path cost', value: s.cost ? s.cost : '–' },
      ];

  const weightNote =
    !isMaze && !searches[algo.id].weighted && board.cells.includes(WEIGHT)
      ? `${algo.name} ignores weights, so it treats weighted cells like any other. Its path can cost more.`
      : null;

  return (
    <VisualizerLayout
      module={meta}
      algo={algo}
      player={player}
      stage={stage}
      stageBar={<ViewToggle value={view} onChange={setView} modes={isMaze ? ['2d', '3d'] : ['2d', '3d', 'physics']} />}
      code={isMaze ? mazes[algo.id].code : searches[algo.id].code}
      line={step?.line}
      message={step?.msg}
      legend={isMaze ? mazeLegend : searchLegend}
      stats={stats}
      controls={
        isMaze ? (
          <>
            <Button onClick={() => setSeed(newSeed())}>
              <Shuffle size={14} /> New maze
            </Button>
            <Button
              tone="primary"
              onClick={() => {
                setBoard(applyMaze(board, trace.walls));
                navigate('/pathfinding/astar');
              }}
            >
              <Route size={14} /> Search this maze
            </Button>
            <p className="basis-full text-xs text-mist sm:basis-auto sm:flex-1">
              Cells sit on odd rows and columns and walls on the even lines between them, so the grid is always an odd size.
            </p>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-mist">Brush</span>
              <Segmented size="sm" label="Brush" value={tool} options={toolOptions} onChange={setTool} />
            </div>
            <Button onClick={player.reset}>
              <X size={14} /> Clear path
            </Button>
            <Button onClick={() => setBoard(keepEnds(new Uint8Array(W * H)))}>
              <Trash2 size={14} /> Clear board
            </Button>
            <Button onClick={() => setBoard(randomWalls(board))}>
              <Dices size={14} /> Random walls
            </Button>
            <Select
              label="Maze"
              value=""
              options={mazeOptions}
              onChange={(id) => id && setBoard(applyMaze(board, generateMaze(id, W, H)))}
            />
            <p className="basis-full text-xs text-mist">
              Drag on the grid to draw. Hold Shift (or pick Weights) to paint cells that cost 5 to enter. Drag the violet
              start or the mint goal to move them. {weightNote}
            </p>
          </>
        )
      }
    />
  );
}

function StageLoading() {
  return <div className="absolute inset-0 grid place-items-center text-sm text-mist">Loading 3D scene…</div>;
}
