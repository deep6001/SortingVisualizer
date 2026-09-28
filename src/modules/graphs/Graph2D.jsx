import { palette } from '../../core/theme';
import { BOX, nodeName } from './graph';
import { GROUP_COLORS, edgeLook, fmtDist, nodeColor, nodeState } from './visual';

const R = 19;
const markerColors = [palette.line, palette.amber, palette.coral, palette.mint, ...GROUP_COLORS];
const markerFor = (color) => Math.max(0, markerColors.indexOf(color));

/** Flat SVG drawing of the graph using the precomputed force layout. */
export default function Graph2D({ graph, step, start, onPick }) {
  const { pos, edges, directed } = graph;
  return (
    <svg viewBox={`0 0 ${BOX.w} ${BOX.h}`} className="h-full w-full" role="img" aria-label="Graph">
      <defs>
        {markerColors.map((c, k) => (
          <marker key={k} id={`arr-${k}`} viewBox="0 0 10 10" refX="10" refY="5" markerWidth="11" markerHeight="11" markerUnits="userSpaceOnUse" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" fill={c} />
          </marker>
        ))}
      </defs>

      {edges.map((e) => {
        const [x1, y1] = pos[e.u];
        const [x2, y2] = pos[e.v];
        const len = Math.hypot(x2 - x1, y2 - y1) || 1;
        const ux = (x2 - x1) / len;
        const uy = (y2 - y1) / len;
        const trim = directed ? R + 3 : R;
        const look = edgeLook(step, e);
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        return (
          <g key={e.id}>
            <line
              x1={x1 + ux * R}
              y1={y1 + uy * R}
              x2={x2 - ux * trim}
              y2={y2 - uy * trim}
              stroke={look.color}
              strokeWidth={look.hot ? 4 : look.s === 'tree' ? 3.5 : 2}
              strokeDasharray={look.s === 'reject' ? '6 5' : undefined}
              strokeOpacity={look.dim ? 0.6 : 1}
              markerEnd={directed ? `url(#arr-${markerFor(look.color)})` : undefined}
              style={{ transition: 'stroke .2s, stroke-width .2s', filter: look.hot ? `drop-shadow(0 0 6px ${look.color})` : undefined }}
            />
            <rect x={mx - 13} y={my - 10} width={26} height={19} rx={4} fill={palette.deep} fillOpacity={0.85} />
            <text
              x={mx}
              y={my + 4}
              textAnchor="middle"
              fontSize={13}
              className="font-mono"
              fill={look.hot || look.s === 'tree' ? look.color : e.w < 0 ? palette.coral : palette.mist}
            >
              {e.w}
            </text>
          </g>
        );
      })}

      {pos.map(([x, y], i) => {
        const s = nodeState(step, i);
        const color = nodeColor(step, i);
        const filled = s !== 'idle' || (step?.group?.[i] ?? -1) >= 0;
        const hot = s === 'current';
        const d = step?.dist?.[i];
        const label = step?.label?.[i];
        return (
          <g
            key={i}
            transform={`translate(${x} ${y})`}
            onClick={onPick ? () => onPick(i) : undefined}
            className={onPick ? 'cursor-pointer' : undefined}
          >
            {onPick && i === start && <circle r={R + 6} fill="none" stroke={palette.violet} strokeWidth={2} strokeDasharray="4 4" />}
            <circle
              r={hot ? R + 2 : R}
              fill={filled ? color : palette.panel}
              stroke={color}
              strokeWidth={2.5}
              style={{ transition: 'fill .2s, stroke .2s, r .2s', filter: hot ? `drop-shadow(0 0 10px ${color})` : undefined }}
            />
            <text y={5} textAnchor="middle" fontSize={15} fontWeight={700} fill={filled ? palette.ink : palette.paper} className="pointer-events-none select-none">
              {nodeName(i)}
            </text>
            {d != null && (
              <g transform={`translate(0 ${-R - 14})`}>
                <rect x={-17} y={-11} width={34} height={19} rx={9} fill={palette.deep} stroke={d === Infinity ? palette.line : palette.amber} strokeOpacity={0.7} />
                <text y={3} textAnchor="middle" fontSize={12} className="font-mono" fill={d === Infinity ? palette.mist : palette.paper}>
                  {fmtDist(d)}
                </text>
              </g>
            )}
            {label && (
              <text y={R + 17} textAnchor="middle" fontSize={12} className="font-mono" fill={palette.mist}>
                {label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
