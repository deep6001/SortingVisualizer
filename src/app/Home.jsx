import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Play, Swords } from 'lucide-react';
import { algorithmCount, modules } from './catalog';
import usePlayer from '../core/usePlayer';
import { presets, trace } from '../core/arrayTracer';
import { sortingRunners } from '../modules/sorting/algorithms';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { Spotlight } from '@/components/aceternity/spotlight';
import { FlipWords } from '@/components/aceternity/flip-words';
import { HoverBorderGradient } from '@/components/aceternity/hover-border-gradient';
import { BentoGrid, BentoGridItem } from '@/components/aceternity/bento-grid';
import { cn } from '@/lib/utils';

const ArrayBarsPhysics = lazy(() => import('../core/viz/ArrayBarsPhysics'));

const heroAlgos = ['quick', 'merge', 'heap', 'shell', 'cocktail'];
const flip = ['sorting', 'graphs', 'recursion', 'pathfinding', 'backtracking'];

// which modules get a double-width bento tile
const wide = new Set(['sorting', 'graphs', 'dp']);

function HeroStage() {
  const [round, setRound] = useState(0);
  const algoId = heroAlgos[round % heroAlgos.length];
  const steps = useMemo(
    () => trace(presets.random(24), sortingRunners[algoId].run),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [round],
  );
  const player = usePlayer(steps, { initialSpeed: 14 });
  const { play, done } = player;

  useEffect(() => {
    const t = setTimeout(play, 2600);
    return () => clearTimeout(t);
  }, [steps, play]);

  useEffect(() => {
    if (!done) return undefined;
    const t = setTimeout(() => setRound((r) => r + 1), 2500);
    return () => clearTimeout(t);
  }, [done]);

  const name = modules[0].meta.algorithms.find((a) => a.id === algoId)?.name;

  return (
    // gradient frame with a soft glow behind it (Aceternity "background gradient")
    <div className="group relative rounded-2xl p-px">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/60 via-fuchsia-500/30 to-cyan-400/40 opacity-70 blur-xl transition-opacity duration-500 group-hover:opacity-100" />
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-400/70 via-white/10 to-fuchsia-400/60" />
      <div className="stage relative h-[46vh] min-h-[320px] overflow-hidden rounded-[15px] sm:h-[56vh]">
        <Suspense fallback={null}>
          <ArrayBarsPhysics step={player.step} />
        </Suspense>
        <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
          </span>
          Now playing <span className="text-foreground">{name}</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="#a5b4fc" />
      <div className="relative mx-auto w-full max-w-[1400px] px-4 pb-24 pt-10 lg:px-8">
        <section className="grid items-center gap-10 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
          <div>
            <Badge variant="outline" className="mb-6 border-white/10 bg-white/[0.03] py-1 pl-1.5 pr-3 text-muted-foreground">
              <span className="rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-2 py-px text-[11px] font-semibold text-white">
                {algorithmCount}
              </span>
              algorithms in 2D, 3D and real physics
            </Badge>
            <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl 2xl:text-7xl">
              <span className="text-gradient">See</span>
              <br />
              <FlipWords words={flip} gradient={[[129, 140, 248], [192, 132, 252], [232, 121, 249]]} className="pb-1" />
              <br />
              <span className="text-gradient">move.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
              Scrub any run backwards and forwards, read the line of code behind each step, switch to 3D, or drop the data
              into a physics world and knock it over.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <HoverBorderGradient as={Link} to="/sorting/quick" className="flex items-center gap-2 text-sm font-medium">
                <Play size={15} fill="currentColor" /> Start with quick sort
              </HoverBorderGradient>
              <Button asChild variant="ghost" size="lg" className="rounded-full text-muted-foreground">
                <Link to="/race">
                  <Swords className="text-amber" /> Race four sorts
                </Link>
              </Button>
            </div>
            <p className="mt-7 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <Kbd>Space</Kbd> play or pause <span className="mx-1 text-white/15">/</span> <Kbd>←</Kbd>
              <Kbd>→</Kbd> step <span className="mx-1 text-white/15">/</span> <Kbd>R</Kbd> reset
            </p>
          </div>
          <HeroStage />
        </section>

        <section aria-labelledby="index-heading" className="mt-24">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="index-heading" className="text-gradient font-display text-3xl font-bold tracking-tight">
                Everything you can open
              </h2>
              <p className="mt-2 text-muted-foreground">Nine modules. Every one steps, scrubs and explains itself.</p>
            </div>
          </div>
          <BentoGrid>
            {modules.map(({ meta, icon: Icon }) => (
              <Link key={meta.id} to={`/${meta.id}`} className={cn('block rounded-xl', wide.has(meta.id) && 'md:col-span-2')}>
                <BentoGridItem
                  className="h-full"
                  header={
                    <div className="flex items-start justify-between">
                      <span className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-gradient-to-br from-indigo-500/25 to-fuchsia-500/10 text-indigo-200 shadow-[0_0_20px_-6px_rgb(129_140_248/0.6)]">
                        <Icon size={18} />
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground transition-colors group-hover:text-indigo-200">
                        {meta.algorithms.length} algorithms <ArrowUpRight size={14} />
                      </span>
                    </div>
                  }
                  title={meta.title}
                  description={meta.tagline}
                  footer={
                    <ul className="flex flex-wrap gap-1.5">
                      {meta.algorithms.slice(0, wide.has(meta.id) ? 8 : 4).map((a) => (
                        <li key={a.id} className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-0.5 text-xs text-foreground/80">
                          {a.name}
                        </li>
                      ))}
                      {meta.algorithms.length > (wide.has(meta.id) ? 8 : 4) && (
                        <li className="px-1 py-0.5 text-xs text-muted-foreground">
                          +{meta.algorithms.length - (wide.has(meta.id) ? 8 : 4)} more
                        </li>
                      )}
                    </ul>
                  }
                />
              </Link>
            ))}
          </BentoGrid>
        </section>
      </div>
    </div>
  );
}
