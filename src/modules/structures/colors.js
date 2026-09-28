import { palette } from '../../core/theme';

// role → color, shared by every structure view
export const roleColor = {
  look: palette.amber,
  out: palette.coral,
  new: palette.mint,
  key: palette.violet,
  idle: palette.sky,
};

export const opsLegend = [
  { color: palette.sky, label: 'Stored' },
  { color: palette.amber, label: 'Being read' },
  { color: palette.mint, label: 'Just added / found' },
  { color: palette.coral, label: 'Leaving / collision' },
  { color: palette.violet, label: 'New top / front' },
];
