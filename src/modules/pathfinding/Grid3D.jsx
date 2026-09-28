import Scene from '../../core/three/Scene';
import { Beacons, GridCells, PathTube, Runner, usePathCurve } from './gridParts3D';

/** The grid as lit blocks: walls extrude, explored cells rise, the path glows and a runner travels it. */
export default function Grid3D({ board, base, overlay, cur, path, pathN, finished, maze }) {
  const { W, H } = board;
  const curve = usePathCurve(W, H, path, maze ? 0 : pathN);
  return (
    <Scene camera={{ position: [0, 26, 19], fov: 42 }} target={[0, 0, 0.5]} fitWidth={W}>
      <GridCells W={W} H={H} base={base} overlay={overlay} cur={cur} maze={maze} />
      {!maze && <Beacons W={W} H={H} start={board.start} goal={board.goal} />}
      <PathTube curve={curve} n={pathN} />
      {finished && <Runner curve={curve} />}
    </Scene>
  );
}
