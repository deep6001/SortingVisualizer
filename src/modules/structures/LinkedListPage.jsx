import { lazy, Suspense, useState } from 'react';
import { ArrowLeftRight, Crosshair, RotateCcw, Trash2 } from 'lucide-react';
import meta from './meta';
import useOps from './useOps';
import { LL_CAP, initialList, introStep, llCode, llOps } from './linkedList';
import { randomValue } from './linear';
import LinkedList2D from './LinkedList2D';
import { OpsLog, StageLoading, ValueField } from './ui';
import { roleColor } from './colors';
import { palette } from '../../core/theme';
import VisualizerLayout from '../../core/ui/VisualizerLayout';
import ViewToggle from '../../core/ui/ViewToggle';
import { Button } from '../../core/ui/controls';

const LinkedList3D = lazy(() => import('./LinkedList3D'));

const SEED = [3, 14, 15, 92, 65];
const INTRO = 'A list of five nodes. Try Reverse and watch the next pointers flip one at a time.';

const legend = [
  { color: roleColor.look, label: 'curr / fast' },
  { color: roleColor.key, label: 'prev / slow' },
  { color: roleColor.new, label: 'New / found' },
  { color: roleColor.out, label: 'Pointer being rewritten' },
];

export default function LinkedListPage({ algo }) {
  const [view, setView] = useState('2d');
  const [value, setValue] = useState('');
  const [index, setIndex] = useState('2');
  const { state, log, run, reset, player } = useOps(
    () => initialList(SEED),
    (s, msg) => introStep(s, msg ?? INTRO),
    { speed: 3 },
  );
  const step = player.step;
  const length = step?.stats.length ?? 0;

  const takeValue = () => {
    const n = Number(value);
    setValue('');
    return value.trim() && Number.isFinite(n) ? Math.max(-99, Math.min(999, Math.round(n))) : randomValue();
  };

  const stage =
    view === '2d' ? (
      <LinkedList2D step={step} />
    ) : (
      <Suspense fallback={<StageLoading />}>
        <LinkedList3D step={step} />
      </Suspense>
    );

  const existing = () => {
    const n = Number(value);
    if (value.trim() && Number.isFinite(n)) return n;
    const ids = Object.keys(state.nodes);
    return ids.length ? state.nodes[ids[Math.floor(Math.random() * ids.length)]].v : 0;
  };

  return (
    <VisualizerLayout
      module={meta}
      algo={algo}
      player={player}
      stage={stage}
      stageBar={<ViewToggle value={view} onChange={setView} modes={['2d', '3d']} />}
      code={llCode[step?.op] ?? llCode.reverse}
      line={step?.line}
      message={step?.msg}
      legend={legend}
      stats={[
        { label: 'Length', value: `${length} / ${LL_CAP}` },
        { label: 'Head', value: step?.head ? step.nodes[step.head]?.v : 'null', tone: 'text-violet' },
        { label: 'Operations', value: step?.stats.ops ?? 0 },
        { label: 'Steps in this op', value: player.total },
      ]}
      controls={
        <>
          <ValueField value={value} onChange={setValue} placeholder="random" onEnter={() => run((s) => llOps.insertTail(s, takeValue()))} />
          <div className="flex flex-wrap gap-2">
            <Button tone="primary" onClick={() => run((s) => llOps.insertHead(s, takeValue()))}>
              Insert head
            </Button>
            <Button tone="primary" onClick={() => run((s) => llOps.insertTail(s, takeValue()))}>
              Insert tail
            </Button>
          </div>
          <div className="flex items-end gap-2">
            <ValueField label="Index" value={index} onChange={setIndex} width="w-14" />
            <Button onClick={() => run((s) => llOps.insertAt(s, Math.max(0, Math.round(Number(index) || 0)), takeValue()))}>
              Insert at
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button tone="danger" onClick={() => run((s) => llOps.remove(s, existing()))} title="Deletes the typed value, or a random one">
              <Trash2 size={14} /> Delete
            </Button>
            <Button onClick={() => run(llOps.reverse)}>
              <ArrowLeftRight size={14} /> Reverse
            </Button>
            <Button onClick={() => run(llOps.middle)}>
              <Crosshair size={14} /> Find middle
            </Button>
          </div>
          <Button tone="ghost" onClick={() => reset(initialList(SEED))}>
            <RotateCcw size={14} /> Reset
          </Button>
          <OpsLog log={log} />
          <p className="w-full text-xs text-mist">
            Delete removes the value in the box, or a random node if the box is empty. Pointer names:{' '}
            <span style={{ color: palette.violet }}>head</span>, <span style={{ color: palette.amber }}>curr / prev / next / slow</span>,{' '}
            <span style={{ color: palette.coral }}>fast</span>.
          </p>
        </>
      }
    />
  );
}
