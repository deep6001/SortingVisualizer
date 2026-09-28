import { useEffect, useRef } from 'react';
import { cx } from '../../core/ui/controls';

/** Text field used by the operation bars. */
export function ValueField({ label = 'Value', value, onChange, placeholder, width = 'w-24', onEnter }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs text-mist">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
        placeholder={placeholder}
        className={cx(
          'h-9 rounded-md border border-input bg-background/60 px-3 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40 font-mono text-sm text-paper placeholder:text-mist/60 focus:border-primary/60',
          width,
        )}
      />
    </label>
  );
}

const toneClass = { ok: 'text-paper', bad: 'text-coral', info: 'text-amber' };

/** Recent operations, newest last. */
export function OpsLog({ log }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollLeft = ref.current.scrollWidth;
  }, [log]);
  return (
    <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
      <span className="text-xs text-mist">Operations log</span>
      <ol ref={ref} className="scroll-thin flex h-9 items-center gap-1.5 overflow-x-auto rounded-md border border-line bg-deep px-2">
        {log.length === 0 && <li className="text-xs text-mist/70">No operations yet.</li>}
        {log.map((l, i) => (
          <li
            key={l.id}
            className={cx(
              'shrink-0 rounded border border-line px-1.5 py-0.5 font-mono text-[11px]',
              toneClass[l.tone],
              i === log.length - 1 && 'border-sky/60 bg-sky/10',
            )}
          >
            {l.text}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function StageLoading() {
  return <div className="absolute inset-0 grid place-items-center text-sm text-mist">Loading 3D scene…</div>;
}

/** Small overlay button for physics stages (matches the sorting physics view). */
export function StageButton({ onClick, icon, label, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium backdrop-blur-md transition-colors',
        active ? 'border-mint/50 bg-mint/15 text-mint shadow-[0_0_16px_-4px_rgb(52_211_153/0.7)]' : 'border-white/10 bg-black/50 text-foreground hover:border-indigo-400/50 hover:bg-indigo-500/10',
      )}
    >
      {icon}
      {label}
    </button>
  );
}
