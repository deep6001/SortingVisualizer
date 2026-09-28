import { palette } from '../theme';

/** Visual role of slot i in an array-trace step. Order matters: the most specific role wins. */
export function roleOf(i, step) {
  if (!step) return 'idle';
  if (step.swp?.includes(i)) return 'swap';
  if (step.wr === i) return 'write';
  if (step.cmp?.includes(i)) return 'compare';
  if (step.found === i) return 'found';
  if (step.marks?.pivot === i) return 'pivot';
  if (step.sortedSet ? step.sortedSet.has(i) : step.sorted?.includes(i)) return 'sorted';
  const r = step.marks?.range;
  if (r && (i < r[0] || i > r[1])) return 'out';
  return 'idle';
}

export const roleColor = {
  swap: palette.coral,
  write: palette.coral,
  compare: palette.amber,
  found: palette.mint,
  pivot: palette.violet,
  sorted: palette.mint,
  out: '#52527A',
  idle: palette.sky,
};

export const arrayLegend = [
  { color: palette.amber, label: 'Comparing' },
  { color: palette.coral, label: 'Swap / write' },
  { color: palette.violet, label: 'Pivot / key' },
  { color: palette.mint, label: 'In final place' },
];

/** Cache a Set of sorted indices on the step so roleOf is O(1) per bar. */
export function withSortedSet(step) {
  if (step && step.sorted && !step.sortedSet) step.sortedSet = new Set(step.sorted);
  return step;
}
