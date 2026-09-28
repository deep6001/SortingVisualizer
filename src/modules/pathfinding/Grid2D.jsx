import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { palette } from '../../core/theme';
import { CLOSED, EMPTY, OPEN, PATH, WALL, WEIGHT } from './grid.js';

const PAD = { top: 52, bottom: 34, x: 12 };
const GROW_MS = 320;

const fill = {
  cell: '#1E1E2D',
  wall: '#40405E',
  wallTop: '#5A5A86',
  weight: '#0E0E14',
  hatch: '#5B5B7B',
  [OPEN]: palette.amber,
  [CLOSED]: '#474769',
  [PATH]: '#1E5A4B',
};

const ease = (p) => 1 + 2.2 * (p - 1) ** 3 + 1.2 * (p - 1) ** 2; // soft overshoot

/**
 * Canvas grid. Draws base cells, the search overlay, the path as a glowing line, and
 * start / goal markers. When `editable`, dragging paints walls or weights and moves the
 * start and goal; the edit is kept as a draft and committed on pointer up.
 */
export default function Grid2D({ board, base, overlay, path, pathN, cur, editable, tool, onCommit, maze }) {
  const { W, H } = board;
  const wrap = useRef(null);
  const canvas = useRef(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const drag = useRef(null);
  const born = useRef({ at: new Float64Array(W * H), prev: null, last: 0 });
  const raf = useRef(0);
  const props = useRef();
  props.current = { board, base, overlay, path, pathN, cur, maze };

  useLayoutEffect(() => {
    const el = wrap.current;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cell = Math.max(4, Math.floor(Math.min((box.w - PAD.x * 2) / W, (box.h - PAD.top - PAD.bottom) / H)));
  const ox = Math.floor((box.w - cell * W) / 2);
  const oy = PAD.top + Math.floor((box.h - PAD.top - PAD.bottom - cell * H) / 2);
  const geo = useRef();
  geo.current = { cell, ox, oy };

  const draw = useCallback(() => {
    const cv = canvas.current;
    if (!cv) return false;
    const ctx = cv.getContext('2d');
    const { cell: s, ox: x0, oy: y0 } = geo.current;
    const p = props.current;
    const d = drag.current;
    const b = d?.draft ?? p.board;
    const cells = d ? b.cells : p.base;
    const ov = d ? null : p.overlay;
    const now = performance.now();
    const at = born.current.at;
    let animating = false;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    const gap = s > 10 ? 1 : 0.5;

    for (let i = 0; i < W * H; i++) {
      const x = x0 + (i % W) * s;
      const y = y0 + Math.floor(i / W) * s;
      const kind = cells[i];
      if (kind === WALL) {
        ctx.fillStyle = fill.wall;
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = fill.wallTop;
        ctx.fillRect(x, y, s, Math.max(1, s * 0.14));
        continue;
      }
      ctx.fillStyle = kind === WEIGHT ? fill.weight : fill.cell;
      ctx.fillRect(x + gap, y + gap, s - gap * 2, s - gap * 2);
      const o = ov ? ov[i] : 0;
      if (o) {
        const age = (now - at[i]) / GROW_MS;
        const k = age >= 1 ? 1 : ease(Math.max(0, age));
        if (age < 1) animating = true;
        const sz = (s - gap * 2) * k;
        ctx.globalAlpha = o === OPEN ? 0.9 : kind === WEIGHT ? 0.55 : 1;
        // freshly closed cells flash bright, then settle into their state color
        ctx.fillStyle = age < 0.5 && o === CLOSED ? '#8F98FF' : fill[o];
        ctx.fillRect(x + s / 2 - sz / 2, y + s / 2 - sz / 2, sz, sz);
        ctx.globalAlpha = 1;
      }
      if (kind === WEIGHT) hatch(ctx, x + gap, y + gap, s - gap * 2);
    }

    if (ov && p.cur >= 0) {
      const x = x0 + (p.cur % W) * s;
      const y = y0 + Math.floor(p.cur / W) * s;
      ctx.strokeStyle = p.maze ? palette.coral : palette.paper;
      ctx.lineWidth = Math.max(1.5, s * 0.12);
      ctx.shadowColor = p.maze ? palette.coral : palette.amber;
      ctx.shadowBlur = s * 0.8;
      ctx.strokeRect(x + 1.5, y + 1.5, s - 3, s - 3);
      ctx.shadowBlur = 0;
    }

    if (ov && p.pathN > 1) {
      const c = (i) => [x0 + (i % W) * s + s / 2, y0 + Math.floor(i / W) * s + s / 2];
      ctx.beginPath();
      p.path.slice(0, p.pathN).forEach((i, k) => (k ? ctx.lineTo(...c(i)) : ctx.moveTo(...c(i))));
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = palette.mint;
      ctx.shadowColor = palette.mint;
      ctx.shadowBlur = s * 0.9;
      ctx.lineWidth = Math.max(2, s * 0.26);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#D9FFF0';
      ctx.lineWidth = Math.max(1, s * 0.08);
      ctx.stroke();
    }

    if (!p.maze || d) {
      marker(ctx, b.start, palette.violet, 'start', s, x0, y0, W);
      marker(ctx, b.goal, palette.mint, 'goal', s, x0, y0, W);
    }
    return animating;
  }, [W, H]);

  // stamp cells whose overlay just changed, then animate until they settle
  useEffect(() => {
    const st = born.current;
    if (st.at.length !== W * H) st.at = new Float64Array(W * H);
    const now = performance.now();
    if (st.prev && st.prev.length === overlay.length) {
      for (let i = 0; i < overlay.length; i++) if (overlay[i] && overlay[i] !== st.prev[i]) st.at[i] = now;
    } else st.at.fill(0);
    st.prev = overlay;
    cancelAnimationFrame(raf.current);
    const loop = () => {
      if (draw()) raf.current = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf.current);
  }, [overlay, base, board, path, pathN, cur, box, draw, W, H]);

  const cellAt = (e) => {
    const r = canvas.current.getBoundingClientRect();
    const c = Math.floor((e.clientX - r.left - ox) / cell);
    const row = Math.floor((e.clientY - r.top - oy) / cell);
    return c < 0 || row < 0 || c >= W || row >= H ? -1 : row * W + c;
  };

  const paintLine = (from, to) => {
    const d = drag.current;
    let [c0, r0] = [from % W, Math.floor(from / W)];
    const [c1, r1] = [to % W, Math.floor(to / W)];
    const dc = Math.abs(c1 - c0);
    const dr = -Math.abs(r1 - r0);
    const sc = c0 < c1 ? 1 : -1;
    const sr = r0 < r1 ? 1 : -1;
    let err = dc + dr;
    for (;;) {
      const i = r0 * W + c0;
      if (i !== d.draft.start && i !== d.draft.goal && d.draft.cells[i] !== d.value) {
        d.draft.cells[i] = d.value;
        d.changed = true;
      }
      if (c0 === c1 && r0 === r1) break;
      const e2 = 2 * err;
      if (e2 >= dr) {
        err += dr;
        c0 += sc;
      }
      if (e2 <= dc) {
        err += dc;
        r0 += sr;
      }
    }
  };

  const onDown = (e) => {
    if (!editable || e.button > 0) return;
    const i = cellAt(e);
    if (i < 0) return;
    canvas.current.setPointerCapture(e.pointerId);
    const draft = { ...board, cells: board.cells.slice() };
    if (i === board.start || i === board.goal) {
      drag.current = { mode: i === board.start ? 'start' : 'goal', draft, last: i };
    } else {
      const brush = e.shiftKey ? 'weight' : tool;
      let value = brush === 'erase' ? EMPTY : brush === 'wall' ? WALL : WEIGHT;
      if (brush !== 'erase' && board.cells[i] === value) value = EMPTY; // starting on a wall erases
      drag.current = { mode: 'paint', value, draft, last: i };
      paintLine(i, i);
    }
    draw();
  };

  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const i = cellAt(e);
    if (i < 0 || i === d.last) return;
    if (d.mode === 'paint') paintLine(d.last, i);
    else {
      const other = d.mode === 'start' ? d.draft.goal : d.draft.start;
      if (i === other || d.draft.cells[i] === WALL) return;
      d.draft[d.mode] = i;
      d.changed = true;
    }
    d.last = i;
    draw();
  };

  const onUp = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    if (d.changed) onCommit(d.draft);
    else draw();
  };

  const hover = (e) => {
    if (!editable || drag.current) return;
    const i = cellAt(e);
    canvas.current.style.cursor = i === board.start || i === board.goal ? 'grab' : i >= 0 ? 'crosshair' : 'default';
  };

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  return (
    <div ref={wrap} className="absolute inset-0">
      <canvas
        ref={canvas}
        width={Math.max(1, Math.round(box.w * dpr))}
        height={Math.max(1, Math.round(box.h * dpr))}
        style={{ width: box.w, height: box.h, touchAction: editable ? 'none' : 'auto' }}
        onPointerDown={onDown}
        onPointerMove={(e) => {
          onMove(e);
          hover(e);
        }}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        aria-label="Pathfinding grid. Drag to draw walls."
      />
    </div>
  );
}

function hatch(ctx, x, y, s) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, s, s);
  ctx.clip();
  ctx.strokeStyle = fill.hatch;
  ctx.lineWidth = Math.max(1, s * 0.08);
  ctx.beginPath();
  for (let k = -s; k < s; k += Math.max(3, s / 3)) {
    ctx.moveTo(x + k, y + s);
    ctx.lineTo(x + k + s, y);
  }
  ctx.stroke();
  ctx.restore();
}

function marker(ctx, i, color, kind, s, x0, y0, W) {
  const cx = x0 + (i % W) * s + s / 2;
  const cy = y0 + Math.floor(i / W) * s + s / 2;
  const r = s * 0.4;
  ctx.shadowColor = color;
  ctx.shadowBlur = s;
  ctx.fillStyle = color;
  ctx.beginPath();
  if (kind === 'start') {
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = palette.deep;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.35, cy - r * 0.5);
    ctx.lineTo(cx + r * 0.55, cy);
    ctx.lineTo(cx - r * 0.35, cy + r * 0.5);
    ctx.fill();
  } else {
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = palette.deep;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}
