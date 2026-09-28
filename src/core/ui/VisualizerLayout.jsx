import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Code2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import Transport from './Transport';
import { cx } from './controls';

/**
 * Shared page frame for every visualizer.
 *
 * props:
 *  module       meta object from the module's meta.js (id, title, algorithms[])
 *  algo         the active algorithm entry from module.algorithms
 *  player       return value of usePlayer
 *  stage        the visual (2D/3D) element; fills the stage frame
 *  stageBar     optional controls rendered over the top of the stage (e.g. view mode)
 *  controls     module-specific inputs (array size, input editor, …)
 *  code         array of pseudocode lines
 *  line         active line index (0-based) or null
 *  message      narration for the current step
 *  stats        [{ label, value, tone? }]
 *  legend       [{ color, label }]
 */
export default function VisualizerLayout({
  module,
  algo,
  player,
  stage,
  stageBar,
  controls,
  code = [],
  line,
  message,
  stats = [],
  legend = [],
  sound = true,
}) {
  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 pb-10 pt-6 lg:px-8">
      <header className="flex flex-col gap-4">
        <div className="min-w-0">
          <Badge variant="outline" className="mb-3 border-white/10 bg-white/[0.03]">
            {module.title}
            <span className="text-muted-foreground/60">·</span>
            <span className="font-mono">{module.algorithms.length}</span>
          </Badge>
          <h1 className="text-gradient font-display text-3xl font-bold tracking-tight sm:text-[2.6rem] sm:leading-[1.1]">
            {algo.name}
          </h1>
          {algo.summary && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{algo.summary}</p>}
        </div>
        {module.algorithms.length > 1 && <AlgoTabs module={module} active={algo.id} />}
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="stage h-[52vh] min-h-[340px] overflow-hidden lg:h-[60vh]">
            {stage}
            {stageBar && <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">{stageBar}</div>}
          </div>
          {legend.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Legend">
              {legend.map((l) => (
                <li
                  key={l.label}
                  className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-xs text-muted-foreground"
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: l.color, boxShadow: `0 0 8px ${l.color}` }} />
                  {l.label}
                </li>
              ))}
            </ul>
          )}
          <Transport player={player} sound={sound} />
          {controls && (
            <Card className="flex flex-wrap items-end gap-x-5 gap-y-4 px-4 py-4">{controls}</Card>
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-3">
          <Narration message={message} index={player.index} />
          {code.length > 0 && <CodePanel code={code} line={line} />}
          {stats.length > 0 && (
            <dl className="grid grid-cols-2 gap-3">
              {stats.map((s) => (
                <Card key={s.label} className="px-4 py-3">
                  <dt className="text-xs text-muted-foreground">{s.label}</dt>
                  <dd className={cx('mt-1 font-display text-2xl font-semibold tabular-nums tracking-tight text-foreground', s.tone)}>{s.value}</dd>
                </Card>
              ))}
            </dl>
          )}
          {algo.complexity && <Complexity c={algo.complexity} />}
        </aside>
      </div>
    </div>
  );
}

/** Algorithm switcher with a sliding highlight (Aceternity tabs). */
function AlgoTabs({ module, active }) {
  const navigate = useNavigate();
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [active]);
  return (
    <nav
      ref={ref}
      aria-label={`${module.title} algorithms`}
      className="scroll-thin -mx-1 flex max-w-full gap-1 overflow-x-auto px-1 pb-1 [mask-image:linear-gradient(90deg,#000_92%,transparent)]"
    >
      {module.algorithms.map((a) => {
        const on = a.id === active;
        return (
          <button
            key={a.id}
            type="button"
            data-active={on}
            onClick={() => navigate(`/${module.id}/${a.id}`)}
            className={cx(
              'relative h-8 shrink-0 rounded-full px-3.5 text-[13px] transition-colors',
              on ? 'text-white' : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground',
            )}
          >
            {on && (
              <motion.span
                layoutId={`algo-tab-${module.id}`}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                className="absolute inset-0 rounded-full border border-indigo-400/40 bg-gradient-to-b from-indigo-500/30 to-indigo-500/10 shadow-[0_0_20px_-6px_rgb(129_140_248/0.8)]"
              />
            )}
            <span className="relative z-10">{a.name}</span>
          </button>
        );
      })}
    </nav>
  );
}

function Narration({ message, index }) {
  return (
    <Card className="edge-glow relative overflow-hidden px-4 py-3.5" aria-live="polite">
      <div className="pointer-events-none absolute -left-10 -top-10 h-28 w-28 rounded-full bg-indigo-500/20 blur-2xl" />
      <p className="relative flex items-center gap-1.5 text-xs font-medium text-indigo-200/80">
        <Sparkles size={13} /> What is happening
      </p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 4, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, transition: { duration: 0.08 } }}
          transition={{ duration: 0.18 }}
          className="relative mt-1.5 min-h-[2.75rem] text-[15px] leading-relaxed text-foreground"
        >
          {message || 'Press play, or step through with the arrow keys.'}
        </motion.p>
      </AnimatePresence>
    </Card>
  );
}

export function CodePanel({ code, line }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [line]);
  return (
    <Card className="overflow-hidden bg-black/50">
      <CardHeader className="py-2">
        <CardTitle className="flex items-center gap-1.5">
          <Code2 size={13} /> Pseudocode
        </CardTitle>
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
        </div>
      </CardHeader>
      <ol ref={ref} className="scroll-thin max-h-[300px] overflow-auto py-2 font-mono text-[12.5px] leading-6">
        {code.map((c, i) => {
          const active = i === line;
          return (
            <li key={i} data-active={active} className="relative flex whitespace-pre pr-3">
              {active && (
                <motion.span
                  layoutId="code-line"
                  transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
                  className="absolute inset-0 border-l-2 border-amber bg-gradient-to-r from-amber/20 to-amber/[0.02]"
                />
              )}
              <span className={cx('relative w-10 shrink-0 select-none pr-3 text-right', active ? 'text-amber' : 'text-white/20')}>
                {i + 1}
              </span>
              <span className={cx('relative', active ? 'text-foreground' : 'text-muted-foreground')}>{c}</span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

function Complexity({ c }) {
  const rows = [
    ['Best', c.best, 'text-mint'],
    ['Average', c.avg ?? c.time, 'text-amber'],
    ['Worst', c.worst, 'text-coral'],
    ['Space', c.space, 'text-indigo-300'],
  ].filter(([, v]) => v);
  return (
    <Card>
      <CardHeader className="py-2">
        <CardTitle>Complexity</CardTitle>
      </CardHeader>
      <dl className="divide-y divide-white/[0.05]">
        {rows.map(([k, v, tone]) => (
          <div key={k} className="flex items-center justify-between gap-3 px-4 py-2">
            <dt className="text-sm text-muted-foreground">{k}</dt>
            <dd className={cx('rounded-md bg-white/[0.03] px-2 py-0.5 font-mono text-[13px]', tone)}>{v}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
