import { useLayoutEffect, useState } from 'react';

/** Normalised 0..1 heat for a finite cell value. */
export const heatOf = (v, [lo, hi]) => (Number.isFinite(v) ? (v - lo) / (hi - lo || 1) : 0);

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
