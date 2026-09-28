import { useEffect, useState } from 'react';
import { Gauge, Pause, Play, RotateCcw, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { Slider as UISlider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { IconButton } from './controls';
import { isSoundEnabled, setSoundEnabled } from '../audio';

// slider 0..100 maps to 1..1000 steps per second on a log scale
const toSpeed = (v) => Math.max(1, Math.round(10 ** ((v / 100) * 3)));
const fromSpeed = (s) => (Math.log10(s) / 3) * 100;

export default function Transport({ player, sound = true }) {
  const { playing, toggle, next, prev, reset, index, total, seek, speed, setSpeed } = player;
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input, select, textarea, [contenteditable], [role="slider"], [role="combobox"]')) return;
      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'r' || e.key === 'R') reset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, next, prev, reset]);

  return (
    <div className="edge-glow flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-white/[0.07] bg-card/80 px-3 py-2.5 shadow-[0_12px_32px_-16px_rgb(0_0_0/0.8)] backdrop-blur">
      <div className="flex items-center gap-1">
        <IconButton label="Reset (R)" onClick={reset}>
          <RotateCcw />
        </IconButton>
        <IconButton label="Previous step (←)" onClick={prev} disabled={index === 0}>
          <SkipBack />
        </IconButton>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? 'Pause' : 'Play'}
              className="relative mx-1 inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 via-indigo-500 to-fuchsia-500 text-white shadow-[0_0_0_1px_rgb(255_255_255/0.15)_inset,0_8px_30px_-6px_rgb(129_140_248/0.8)] transition-transform hover:scale-105 active:scale-95"
            >
              {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
            </button>
          </TooltipTrigger>
          <TooltipContent>{playing ? 'Pause (Space)' : 'Play (Space)'}</TooltipContent>
        </Tooltip>
        <IconButton label="Next step (→)" onClick={next} disabled={index >= total - 1}>
          <SkipForward />
        </IconButton>
      </div>

      <div className="flex min-w-[200px] flex-1 items-center gap-3">
        <UISlider aria-label="Timeline" min={0} max={Math.max(0, total - 1)} value={[index]} onValueChange={([v]) => seek(v)} />
        <span className="w-24 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
          <span className="text-foreground">{index + 1}</span> / {total}
        </span>
      </div>

      <Separator orientation="vertical" className="hidden h-6 bg-white/10 sm:block" />

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Gauge size={14} aria-hidden />
        <UISlider
          aria-label="Speed"
          className="w-24"
          min={0}
          max={100}
          value={[fromSpeed(speed)]}
          onValueChange={([v]) => setSpeed(toSpeed(v))}
        />
        <span className="w-12 font-mono tabular-nums text-foreground">{speed}/s</span>
      </div>

      {sound && (
        <IconButton
          label={soundOn ? 'Mute' : 'Turn sound on'}
          active={soundOn}
          onClick={() => {
            setSoundEnabled(!soundOn);
            setSoundOn(!soundOn);
          }}
        >
          {soundOn ? <Volume2 /> : <VolumeX />}
        </IconButton>
      )}
    </div>
  );
}
