import { palette } from '../../core/theme';

export const IDLE_EDGE = '#47476A';

// Node look per tone (tones are listed in tracer.js)
export const toneStyle = {
  idle: { fill: palette.panel, stroke: palette.sky, text: palette.paper },
  cmp: { fill: palette.amber, stroke: palette.amber, text: palette.ink, glow: true },
  path: { fill: palette.panel, stroke: palette.amber, text: palette.amber },
  remove: { fill: palette.coral, stroke: palette.coral, text: palette.ink, glow: true },
  key: { fill: palette.violet, stroke: palette.violet, text: palette.ink, glow: true },
  found: { fill: palette.mint, stroke: palette.mint, text: palette.ink, glow: true },
  done: { fill: '#173d3a', stroke: palette.mint, text: palette.mint },
  dim: { fill: palette.deep, stroke: palette.line, text: palette.mist },
};
export const edgeTone = { idle: IDLE_EDGE, path: palette.amber, found: palette.mint };
