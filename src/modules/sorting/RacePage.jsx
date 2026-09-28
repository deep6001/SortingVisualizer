import { useMemo, useState } from 'react';
import { Shuffle, Trophy } from 'lucide-react';
import meta from './meta';
import { sortingRunners } from './algorithms';
import usePlayer from '../../core/usePlayer';
import { presets, trace } from '../../core/arrayTracer';
import Transport from '../../core/ui/Transport';
import ArrayBars2D from '../../core/viz/ArrayBars2D';
import { Button, Segmented, Slider } from '../../core/ui/controls';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const options = meta.algorithms.map((a) => ({ value: a.id, label: a.name }));
const nameOf = (id) => meta.algorithms.find((a) => a.id === id)?.name;

export default function RacePage() {
  const [lanes, setLanes] = useState(['bubble', 'insertion', 'merge', 'quick']);
  const [size, setSize] = useState(40);
  const [preset, setPreset] = useState('random');
  const [input, setInput] = useState(() => presets.random(40));

  const traces = useMemo(() => lanes.map((id) => trace(input, sortingRunners[id].run, { maxSteps: 120000 })), [lanes, input]);
  const longest = useMemo(() => Array.from({ length: Math.max(...traces.map((t) => t.length)) }), [traces]);
  const player = usePlayer(longest, { initialSpeed: 60 });

  const finishOrder = traces
    .map((t, i) => ({ i, len: t.length }))
    .filter((x) => x.len - 1 <= player.index)
    .sort((a, b) => a.len - b.len)
    .map((x) => x.i);

  const regen = (n = size, p = preset) => setInput(presets[p](n));

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 pb-10 pt-6 lg:px-8">
      <header>
        <Badge variant="outline" className="mb-3 border-white/10 bg-white/[0.03]">Sorting</Badge>
        <h1 className="text-gradient font-display text-3xl font-bold tracking-tight sm:text-[2.6rem] sm:leading-[1.1]">Race</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Same input, one operation per tick. Every comparison, swap and write costs one step, so the lane that finishes
          first did the least work.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        {lanes.map((id, li) => {
          const t = traces[li];
          const s = t[Math.min(player.index, t.length - 1)];
          const place = finishOrder.indexOf(li);
          return (
            <section key={li} className="stage h-64 overflow-hidden">
              <div className="absolute left-3 right-3 top-3 z-10 flex items-center justify-between gap-2">
                <Select value={id} onValueChange={(v) => setLanes(lanes.map((x, k) => (k === li ? v : x)))}>
                  <SelectTrigger aria-label={`Lane ${li + 1} algorithm`} className="h-8 w-44 bg-black/50 backdrop-blur">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  {s.stats.cmp} cmp · {s.stats.swaps + s.stats.writes} moves · {t.length} steps
                </span>
              </div>
              {place >= 0 && (
                <div className="absolute right-3 top-14 z-10 inline-flex items-center gap-1.5 rounded-full border border-mint/40 bg-mint/15 px-2.5 py-1 text-xs text-mint shadow-[0_0_20px_-4px_rgb(52_211_153/0.7)]">
                  <Trophy size={12} /> Finished #{place + 1}
                </div>
              )}
              <ArrayBars2D step={s} />
            </section>
          );
        })}
      </div>

      <Transport player={player} sound={false} />

      <Card className="flex flex-wrap items-end gap-x-5 gap-y-4 px-4 py-4">
        <Slider label="Elements" value={size} min={8} max={120} onChange={(n) => { setSize(n); regen(n); }} />
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-mist">Starting order</span>
          <Segmented
            size="sm"
            label="Starting order"
            value={preset}
            onChange={(p) => { setPreset(p); regen(size, p); }}
            options={[
              { value: 'random', label: 'Random' },
              { value: 'nearly', label: 'Nearly sorted' },
              { value: 'reversed', label: 'Reversed' },
              { value: 'few', label: 'Few unique' },
            ]}
          />
        </div>
        <Button onClick={() => regen()}>
          <Shuffle size={14} /> Shuffle
        </Button>
        {finishOrder.length === lanes.length && (
          <p className="text-sm text-paper">
            Winner: <span className="font-semibold text-mint">{nameOf(lanes[finishOrder[0]])}</span>
          </p>
        )}
      </Card>
    </div>
  );
}

