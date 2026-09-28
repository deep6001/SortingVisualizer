import { lazy, Suspense, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import meta from './meta';
import { factCode, factTrace, factorial } from './algorithms';
import usePlayer from '../../core/usePlayer';
import { blip } from '../../core/audio';
import { palette } from '../../core/theme';
import VisualizerLayout from '../../core/ui/VisualizerLayout';
import ViewToggle from '../../core/ui/ViewToggle';
import { Slider } from '../../core/ui/controls';
import { StageLoading } from '../structures/ui';

const CratePhysics = lazy(() => import('../structures/CratePhysics'));

const frameColor = { active: palette.amber, waiting: palette.sky, returning: palette.mint };
const roleOf = { active: 'look', returning: 'new' };

const legend = [
  { color: palette.amber, label: 'Running frame' },
  { color: palette.sky, label: 'Waiting frame' },
  { color: palette.mint, label: 'Returning a value' },
];

function Stack2D({ step }) {
  if (!step) return null;
  const { frames } = step;
  return (
    <div className="absolute inset-0 flex justify-center px-4 pb-5 pt-14">
      <div className="flex h-full w-full max-w-sm flex-col-reverse gap-1.5 border-b-2 border-line pb-2">
        <AnimatePresence initial={false}>
          {frames.map((f, i) => {
            const c = frameColor[f.state];
            const below = frames[i + 1];
            return (
              <motion.div
                key={f.id}
                layout
                initial={{ opacity: 0, y: -80 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 120 }}
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                className="flex shrink-0 items-center justify-between gap-3 rounded-md border-2 px-3 font-mono text-sm"
                style={{
                  height: 'min(44px, calc((100% - 72px) / 12))',
                  borderColor: c,
                  background: f.state === 'waiting' ? palette.panel : `${c}22`,
                  boxShadow: f.state === 'active' ? `0 0 14px ${c}66` : 'none',
                }}
              >
                <span className="text-paper">fact({f.n})</span>
                <span className="truncate text-xs" style={{ color: c }}>
                  {f.state === 'returning'
                    ? `returns ${f.value}`
                    : f.state === 'waiting'
                      ? `n = ${f.n}, waiting on fact(${below?.n ?? f.n - 1})`
                      : `n = ${f.n}, running`}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {frames.length === 0 && <p className="m-auto text-xs text-mist">call stack is empty</p>}
      </div>
    </div>
  );
}

export default function FactorialPage({ algo }) {
  const [view, setView] = useState('physics');
  const [n, setN] = useState(5);
  const steps = useMemo(() => factTrace(n), [n]);
  const player = usePlayer(steps, {
    initialSpeed: 2,
    onStep: (s) => s && blip(s.frames.length / 12, { type: 'triangle', gain: 0.04 }),
  });
  const step = player.step;

  // frames as crates for the physics stack: label on the front, state underneath
  const crateStep = useMemo(() => {
    if (!step) return null;
    const hl = {};
    const items = step.frames.map((f) => {
      if (roleOf[f.state]) hl[f.id] = roleOf[f.state];
      return { id: f.id, v: `fact(${f.n})`, sub: f.value != null ? `= ${f.value}` : 'waiting' };
    });
    return { items, hl };
  }, [step]);

  const top = step?.frames[step.frames.length - 1];

  return (
    <VisualizerLayout
      module={meta}
      algo={algo}
      player={player}
      stage={
        view === '2d' ? (
          <Stack2D step={step} />
        ) : (
          <Suspense fallback={<StageLoading />}>
            <CratePhysics step={crateStep} mode="stack" capacity={12} gauge={false} />
          </Suspense>
        )
      }
      stageBar={<ViewToggle value={view} onChange={setView} modes={['2d', 'physics']} />}
      code={factCode}
      line={step?.line}
      message={step?.msg}
      legend={legend}
      stats={[
        { label: 'Stack depth', value: step?.stats.depth ?? 0, tone: 'text-violet' },
        { label: 'Max depth', value: step?.stats.maxDepth ?? 0 },
        { label: 'Calls', value: step?.stats.calls ?? 0, tone: 'text-amber' },
        { label: 'Running', value: top ? `fact(${top.n})` : '—' },
      ]}
      controls={
        <>
          <Slider label="n" value={n} min={1} max={12} onChange={setN} />
          <p className="max-w-md flex-[2] text-xs text-mist">
            fact({n}) = {factorial(n).toLocaleString()}. Every call leaves a frame on the stack until the one it called returns,
            so memory grows with n. A deep enough n overflows a real stack.
          </p>
        </>
      }
    />
  );
}
