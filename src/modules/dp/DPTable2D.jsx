import { useRef } from 'react';
import { palette } from '../../core/theme';
import { fmt } from './algorithms';
import { heatOf, useElementSize } from './util';

const GAP = 3;
const key = (p) => (p ? `${p[0]},${p[1]}` : '');

/**
 * The DP table as a grid: amber = cell being computed, violet = cells it reads (with arrows),
 * sky tint = filled (brighter is larger), mint = traceback path.
 */
export default function DPTable2D({ result, step, onCellClick }) {
  const box = useRef(null);
  const { width, height } = useElementSize(box);
  const { rows, cols, rowHeads, colHeads, range, blocked } = result;
  const wideHeads = rowHeads.some((h) => h.sub != null && String(h.sub).length > 2);

  const availW = width - 8;
  const availH = height - 96;
  const hwRatio = wideHeads ? 1.7 : 1;
  const cell = Math.floor(
    Math.max(20, Math.min(60, (availW - GAP * (cols + 1)) / (cols + hwRatio), (availH - GAP * (rows + 1)) / (rows + 0.8))),
  );
  const hw = Math.round(cell * hwRatio);
  const hh = Math.round(cell * 0.8);
  const W = hw + GAP + cols * (cell + GAP);
  const H = hh + GAP + rows * (cell + GAP);
  const cx = (c) => hw + GAP + c * (cell + GAP) + cell / 2;
  const cy = (r) => hh + GAP + r * (cell + GAP) + cell / 2;

  const cur = step?.cur;
  const deps = new Set((step?.deps ?? []).map(key));
  const path = new Set((step?.path ?? []).map(key));
  const font = Math.max(10, Math.round(cell * 0.36));

  return (
    <div className="absolute inset-0 flex flex-col items-center px-4 pb-12 pt-14">
      <div ref={box} className="scroll-thin flex w-full flex-1 overflow-auto">
        <div className="m-auto flex flex-col items-center">
          {(result.rowTitle || result.colTitle) && (
            <p className="mb-2 text-center text-xs text-mist">
              {result.rowTitle && (
                <>
                  rows: <span className="font-mono text-paper">{result.rowTitle}</span>
                </>
              )}
              {result.rowTitle && result.colTitle && <span className="px-2">·</span>}
              {result.colTitle && (
                <>
                  columns: <span className="font-mono text-paper">{result.colTitle}</span>
                </>
              )}
            </p>
          )}
          {width > 0 && step && (
            <div className="relative shrink-0" style={{ width: W, height: H }}>
              {colHeads.map((h, c) => (
                <Head key={`c${c}`} h={h} hot={cur?.[1] === c} style={{ left: hw + GAP + c * (cell + GAP), top: 0, width: cell, height: hh }} font={font} />
              ))}
              {rowHeads.map((h, r) => (
                <Head key={`r${r}`} h={h} hot={cur?.[0] === r} style={{ left: 0, top: hh + GAP + r * (cell + GAP), width: hw, height: cell }} font={font} />
              ))}
              {step.t.map((row, r) =>
                row.map((v, c) => {
                  const k = `${r},${c}`;
                  const isCur = cur && cur[0] === r && cur[1] === c;
                  const isWall = blocked?.has(k);
                  let bg = 'transparent';
                  let color = palette.paper;
                  let border = 'rgba(37,58,87,0.8)';
                  let glow = 'none';
                  if (isWall) {
                    bg = `repeating-linear-gradient(45deg, ${palette.line} 0 4px, transparent 4px 8px)`;
                    color = palette.mist;
                  } else if (v != null) {
                    const h = heatOf(v, range);
                    bg = `rgba(129, 140, 248,${v === Infinity ? 0.04 : 0.07 + 0.5 * h})`;
                    border = `rgba(129, 140, 248,${0.18 + 0.45 * h})`;
                    if (v === Infinity) color = palette.mist;
                  }
                  if (path.has(k)) {
                    bg = palette.mint;
                    color = palette.deep;
                    border = palette.mint;
                    glow = `0 0 12px ${palette.mint}88`;
                  }
                  if (deps.has(k)) {
                    bg = 'rgba(182,156,255,0.3)';
                    border = palette.violet;
                    color = palette.paper;
                  }
                  if (isCur) {
                    bg = palette.amber;
                    color = palette.deep;
                    border = palette.amber;
                    glow = `0 0 18px ${palette.amber}`;
                  }
                  return (
                    <div
                      key={k}
                      onClick={onCellClick ? () => onCellClick(r, c) : undefined}
                      className={`absolute flex items-center justify-center rounded-[4px] border font-mono tabular-nums transition-[background-color,box-shadow,color] duration-150 ${onCellClick ? 'cursor-pointer hover:brightness-125' : ''}`}
                      style={{
                        left: cx(c) - cell / 2,
                        top: cy(r) - cell / 2,
                        width: cell,
                        height: cell,
                        background: bg,
                        color,
                        borderColor: border,
                        boxShadow: glow,
                        fontSize: font,
                        fontWeight: isCur || path.has(k) ? 700 : 500,
                      }}
                    >
                      {isWall ? '' : fmt(v)}
                    </div>
                  );
                }),
              )}
              <Arrows step={step} cx={cx} cy={cy} cell={cell} W={W} H={H} />
            </div>
          )}
          <div className="mt-4 flex min-h-[3rem] max-w-3xl flex-col items-center gap-1 text-center">
            {step?.answer && <p className="font-display text-lg font-semibold text-mint">{step.answer}</p>}
            {result.note && <p className="text-xs text-mist">{result.note}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Head({ h, hot, style, font }) {
  return (
    <div className="absolute flex flex-col items-center justify-center leading-none" style={style}>
      <span className="font-mono font-semibold transition-colors" style={{ fontSize: font, color: hot ? palette.amber : palette.paper }}>
        {h.label}
      </span>
      {h.sub != null && (
        <span className="mt-0.5 font-mono text-[10px]" style={{ color: hot ? palette.amber : palette.mist }}>
          {h.sub}
        </span>
      )}
    </div>
  );
}

/** Arrows from each dependency to the current cell; long hops bow out so they don't cross the cells between. */
function Arrows({ step, cx, cy, cell, W, H }) {
  const cur = step.cur;
  if (!cur || !step.deps?.length) return null;
  const x2 = cx(cur[1]);
  const y2 = cy(cur[0]);
  return (
    <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={W} height={H}>
      <defs>
        <marker id="dp-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={palette.violet} />
        </marker>
      </defs>
      {step.deps.map(([r, c]) => {
        const x1 = cx(c);
        const y1 = cy(r);
        const dx = x2 - x1;
        const dy = y2 - y1;
        const d = Math.hypot(dx, dy) || 1;
        const ux = dx / d;
        const uy = dy / d;
        const s = cell * 0.22;
        const e = cell * 0.5;
        const ax = x1 + ux * s;
        const ay = y1 + uy * s;
        const bx = x2 - ux * e;
        const by = y2 - uy * e;
        const far = d > cell * 1.8;
        // bow toward the upper side of the line
        const bow = far ? Math.min(cell * 1.2, d * 0.22) : 0;
        const nx = uy;
        const ny = -ux;
        const flip = ny > 0 || (ny === 0 && nx > 0) ? -1 : 1;
        const qx = (ax + bx) / 2 + nx * bow * flip;
        const qy = (ay + by) / 2 + ny * bow * flip;
        return (
          <path
            key={`${r},${c}`}
            d={far ? `M${ax},${ay} Q${qx},${qy} ${bx},${by}` : `M${ax},${ay} L${bx},${by}`}
            fill="none"
            stroke={palette.violet}
            strokeWidth={2}
            strokeLinecap="round"
            markerEnd="url(#dp-arrow)"
          />
        );
      })}
    </svg>
  );
}
