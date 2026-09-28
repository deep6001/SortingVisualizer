import { lazy, Suspense, useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Eye, Flame, RotateCcw } from 'lucide-react';
import meta from './meta';
import useOps from './useOps';
import {
  DEQUE_CAP,
  QUEUE_CAP,
  STACK_CAP,
  dequeCode,
  dequeOps,
  initialLinear,
  introStep,
  queueCode,
  queueOps,
  randomValue,
  stackCode,
  stackOps,
} from './linear';
import Linear2D from './Linear2D';
import { OpsLog, StageLoading, ValueField } from './ui';
import { opsLegend } from './colors';
import { blip } from '../../core/audio';
import VisualizerLayout from '../../core/ui/VisualizerLayout';
import ViewToggle from '../../core/ui/ViewToggle';
import { Button } from '../../core/ui/controls';

const CratePhysics = lazy(() => import('./CratePhysics'));

const configs = {
  stack: {
    code: stackCode,
    cap: STACK_CAP,
    modes: ['2d', 'physics'],
    seed: [12, 47, 5],
    intro: 'Three crates are already stacked. Push a value, or pop the top one off.',
  },
  queue: {
    code: queueCode,
    cap: QUEUE_CAP,
    modes: ['2d', 'physics'],
    seed: [31, 8, 64],
    intro: 'Three crates wait on the belt. Enqueue adds at the back; dequeue takes from the front.',
  },
  deque: {
    code: dequeCode,
    cap: DEQUE_CAP,
    modes: ['2d'],
    seed: [4, 19, 23],
    intro: 'A deque with three items. Add or remove at either end.',
  },
};

export default function LinearPage({ algo }) {
  const kind = algo.id;
  const cfg = configs[kind];
  const [view, setView] = useState(cfg.modes.includes('physics') ? 'physics' : '2d');
  const [value, setValue] = useState('');
  const make = (s, msg) => introStep(s, msg ?? cfg.intro);
  const { state, log, run, reset, player } = useOps(() => initialLinear(cfg.seed), make, {
    onStep: (s) => {
      const role = s && Object.values(s.hl)[0];
      if (role) blip(role === 'out' ? 0.25 : 0.7, { type: role === 'out' ? 'square' : 'triangle', gain: 0.04 });
    },
  });
  const step = player.step;

  const takeValue = () => {
    const n = Number(value);
    const v = value.trim() && Number.isFinite(n) ? Math.round(n) : randomValue();
    setValue('');
    return Math.max(-999, Math.min(999, v));
  };

  const items = step?.items ?? [];
  const physics = view === 'physics';
  const stage = physics ? (
    <Suspense fallback={<StageLoading />}>
      <CratePhysics step={step} mode={kind} capacity={cfg.cap} />
    </Suspense>
  ) : (
    <Linear2D step={step} kind={kind} capacity={cfg.cap} />
  );

  const endLabel = kind === 'stack' ? 'Top' : 'Front';
  const endValue = kind === 'stack' ? items[items.length - 1]?.v : items[0]?.v;

  let buttons;
  if (kind === 'stack') {
    buttons = (
      <>
        <Button tone="primary" onClick={() => run((s) => stackOps.push(s, takeValue()))}>
          <ArrowDownToLine size={14} /> Push
        </Button>
        <Button onClick={() => run(stackOps.pop)}>
          <ArrowUpFromLine size={14} /> Pop
        </Button>
        <Button onClick={() => run(stackOps.peek)}>
          <Eye size={14} /> Peek
        </Button>
        <Button tone="danger" onClick={() => run((s) => stackOps.stress(s, 20))}>
          <Flame size={14} /> Stress test
        </Button>
      </>
    );
  } else if (kind === 'queue') {
    buttons = (
      <>
        <Button tone="primary" onClick={() => run((s) => queueOps.enqueue(s, takeValue()))}>
          <ArrowDownToLine size={14} /> Enqueue
        </Button>
        <Button onClick={() => run(queueOps.dequeue)}>
          <ArrowUpFromLine size={14} /> Dequeue
        </Button>
        <Button onClick={() => run(queueOps.peek)}>
          <Eye size={14} /> Peek
        </Button>
        <Button tone="danger" onClick={() => run((s) => queueOps.stress(s))}>
          <Flame size={14} /> Stress test
        </Button>
      </>
    );
  } else {
    buttons = (
      <>
        <Button tone="primary" onClick={() => run((s) => dequeOps.pushFront(s, takeValue()))}>
          Push front
        </Button>
        <Button tone="primary" onClick={() => run((s) => dequeOps.pushBack(s, takeValue()))}>
          Push back
        </Button>
        <Button onClick={() => run(dequeOps.popFront)}>Pop front</Button>
        <Button onClick={() => run(dequeOps.popBack)}>Pop back</Button>
      </>
    );
  }

  return (
    <VisualizerLayout
      module={meta}
      algo={algo}
      player={player}
      stage={stage}
      stageBar={cfg.modes.length > 1 && <ViewToggle value={view} onChange={setView} modes={cfg.modes} />}
      code={cfg.code}
      line={step?.line}
      message={step?.msg}
      legend={opsLegend}
      stats={[
        { label: 'Size', value: `${items.length} / ${cfg.cap}` },
        { label: endLabel, value: endValue ?? '—', tone: 'text-violet' },
        { label: 'Operations', value: step?.stats.ops ?? 0 },
        { label: 'Each op costs', value: 'O(1)', tone: 'text-mint' },
      ]}
      controls={
        <>
          <ValueField
            value={value}
            onChange={setValue}
            placeholder="random"
            onEnter={() => run((s) => (kind === 'stack' ? stackOps.push : kind === 'queue' ? queueOps.enqueue : dequeOps.pushBack)(s, takeValue()))}
          />
          <div className="flex flex-wrap gap-2">{buttons}</div>
          <Button tone="ghost" onClick={() => reset(initialLinear(cfg.seed))} disabled={!state.items.length && !log.length}>
            <RotateCcw size={14} /> Reset
          </Button>
          <OpsLog log={log} />
        </>
      }
    />
  );
}
