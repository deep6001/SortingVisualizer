import { useLayoutEffect, useState } from 'react';
import { palette } from '../../core/theme';

export function useElementSize(ref) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([e]) => setSize({ width: e.contentRect.width, height: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

export const tile = (r, c) => ((r + c) % 2 ? '#13131A' : '#1C1C26');

export const cellPos = (n, r, c) => [c - (n - 1) / 2, r - (n - 1) / 2];

export const isSolved = (step) => step && (step.kind === 'solution' || (step.kind === 'end' && step.q.every((c) => c >= 0)));

/** Role colour for the queen in row r of this step. */
export function queenRole(step, r) {
  if (isSolved(step)) return 'solution';
  if (step.kind === 'place' && step.at[0] === r) return 'new';
  if (step.conflict && step.conflict.by[0] === r) return 'attacker';
  return 'idle';
}

export const roleColor = { solution: palette.mint, new: palette.amber, attacker: palette.coral, idle: palette.sky };
