import { palette } from '../../core/theme';

// Categorical colours for components (Kruskal sets, SCCs). Kept apart from the idle sky.
export const GROUP_COLORS = ['#FF8FD8', '#7FE7F5', '#C8F068', '#FBBF24', '#E879F9', '#FF9E6B', '#34D399', '#F5F0A0'];

export const nodeColors = {
  idle: palette.sky,
  start: palette.violet,
  key: palette.violet,
  frontier: palette.amber,
  current: palette.amber,
  done: palette.mint,
  bad: palette.coral,
};

export const edgeColors = {
  idle: palette.line,
  check: palette.amber,
  relax: palette.coral,
  reject: palette.coral,
  frontier: palette.amber,
  tree: palette.mint,
};

export const nodeState = (step, i) => step?.hn?.[i] ?? step?.ns[i] ?? 'idle';
export const edgeState = (step, id) => step?.he?.[id] ?? step?.es[id] ?? 'idle';

export function nodeColor(step, i) {
  const s = nodeState(step, i);
  const g = step?.group?.[i];
  if (s === 'idle' && g != null && g >= 0) return GROUP_COLORS[g];
  return nodeColors[s];
}

/** Returns { color, hot, dim } for an edge. Idle edges inside one component take its colour. */
export function edgeLook(step, e) {
  const s = edgeState(step, e.id);
  if (s === 'idle') {
    const gu = step?.group?.[e.u];
    if (gu != null && gu >= 0 && gu === step.group[e.v]) return { color: GROUP_COLORS[gu], hot: false, dim: false, s };
  }
  return { color: edgeColors[s], hot: s === 'check' || s === 'relax', dim: s === 'reject' || s === 'frontier', s };
}

export const isHotNode = (s) => s === 'current';

export const fmtDist = (d) => (d == null ? '' : d === Infinity ? '∞' : String(d));

export const graphLegend = (algoId) => {
  if (algoId === 'kruskal' || algoId === 'scc')
    return [
      { color: palette.amber, label: algoId === 'scc' ? 'On stack / current' : 'Current edge' },
      { color: palette.coral, label: 'Rejected / checking' },
      { color: palette.mint, label: 'Tree edge' },
      { color: GROUP_COLORS[0], label: 'Colour = one component' },
    ];
  if (algoId === 'floyd')
    return [
      { color: palette.violet, label: 'Via node k' },
      { color: palette.amber, label: 'Pair i → j' },
      { color: palette.coral, label: 'Improved cell' },
    ];
  return [
    { color: palette.violet, label: 'Start' },
    { color: palette.amber, label: 'Current / frontier' },
    { color: palette.coral, label: 'Relaxing / rejected' },
    { color: palette.mint, label: 'Visited / tree' },
  ];
};
