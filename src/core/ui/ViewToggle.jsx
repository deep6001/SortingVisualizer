import { Atom, Box, Square } from 'lucide-react';
import { Segmented } from './controls';

const all = {
  '2d': { value: '2d', label: '2D', icon: <Square size={13} /> },
  '3d': { value: '3d', label: '3D', icon: <Box size={13} /> },
  physics: { value: 'physics', label: 'Physics', icon: <Atom size={13} /> },
};

/** Stage view switcher. `modes` picks which of 2d / 3d / physics this page supports. */
export default function ViewToggle({ value, onChange, modes = ['2d', '3d', 'physics'] }) {
  return <Segmented label="View" size="sm" value={value} onChange={onChange} options={modes.map((m) => all[m])} />;
}
