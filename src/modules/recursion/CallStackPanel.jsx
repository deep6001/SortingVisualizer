import { AnimatePresence, motion } from 'motion/react';

/**
 * Live call stack overlay for the stage. frames: [{ key, label, note? }] bottom first.
 * The top frame is the one running; everything below is waiting on it.
 */
export default function CallStackPanel({ frames, max = 10, title = 'Call stack' }) {
  const shown = frames.slice(-max).reverse();
  const hidden = frames.length - shown.length;
  return (
    <div className="pointer-events-none absolute right-3 top-14 z-10 w-[min(46%,230px)] rounded-lg border border-white/10 bg-black/80 shadow-lg p-2 backdrop-blur sm:top-3">
      <p className="mb-1.5 flex justify-between text-[11px] text-mist">
        <span>{title}</span>
        <span className="tabular-nums">depth {frames.length}</span>
      </p>
      <ol className="flex flex-col gap-1">
        <AnimatePresence initial={false}>
          {shown.map((f, i) => (
            <motion.li
              key={f.key}
              layout
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.15 }}
              className={`truncate rounded-md border px-1.5 py-0.5 font-mono text-[11px] ${
                i === 0 ? 'border-amber/70 bg-amber/15 text-amber' : 'border-line text-paper/80'
              }`}
            >
              {f.label}
              {f.note && <span className="text-mist"> · {f.note}</span>}
            </motion.li>
          ))}
        </AnimatePresence>
        {frames.length === 0 && <li className="text-[11px] text-mist/70">empty</li>}
        {hidden > 0 && <li className="text-[11px] text-mist">+{hidden} more below</li>}
      </ol>
    </div>
  );
}
