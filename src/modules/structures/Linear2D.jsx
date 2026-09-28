import { AnimatePresence, motion } from 'motion/react';
import { roleColor } from './colors';

const spring = { type: 'spring', stiffness: 420, damping: 32 };

function Box({ item, role, className, style, enter, exit, children }) {
  const color = roleColor[role ?? 'idle'];
  const hot = role && role !== 'idle';
  return (
    <motion.div
      layout
      initial={enter}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={exit}
      transition={spring}
      className={`relative flex shrink-0 items-center justify-center rounded-md border-2 font-mono font-semibold tabular-nums ${className}`}
      style={{
        borderColor: color,
        background: hot ? `${color}26` : '#13131A',
        color: hot ? color : '#F4F4F7',
        boxShadow: hot ? `0 0 16px ${color}66` : 'none',
        ...style,
      }}
    >
      {item.v}
      {children}
    </motion.div>
  );
}

/** Vertical pile, bottom at index 0. */
function Stack2D({ step, capacity }) {
  const items = step.items;
  const h = `min(38px, calc((100% - ${capacity * 4}px) / ${capacity}))`;
  return (
    <div className="absolute inset-0 flex justify-center px-4 pb-5 pt-14">
      <div className="relative flex h-full w-44 flex-col-reverse gap-1 border-x-2 border-b-2 border-line px-2 pb-2">
        <AnimatePresence initial={false}>
          {items.map((it, i) => (
            <Box
              key={it.id}
              item={it}
              role={step.hl[it.id]}
              className="w-full text-sm"
              style={{ height: h }}
              enter={{ opacity: 0, y: -120 }}
              exit={{ opacity: 0, x: 140, rotate: 20 }}
            >
              <span className="absolute -left-10 text-[10px] font-normal text-mist">{i}</span>
              {i === items.length - 1 && (
                <span className="absolute -right-16 text-xs font-normal text-violet">← top</span>
              )}
            </Box>
          ))}
        </AnimatePresence>
        {items.length === 0 && <p className="m-auto text-xs text-mist">empty</p>}
      </div>
    </div>
  );
}

/** Horizontal line, front on the left. */
function Row2D({ step, capacity, double }) {
  const items = step.items;
  const w = `min(64px, calc((100% - ${capacity * 8}px) / ${capacity}))`;
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 pb-5 pt-14">
      <div className="flex w-full max-w-4xl items-center justify-between text-xs text-mist">
        <span className="text-violet">{double ? '⇄ front' : '← front (dequeue)'}</span>
        <span>{double ? 'back ⇄' : 'back (enqueue) ←'}</span>
      </div>
      <div className="flex min-h-[88px] w-full max-w-4xl items-center gap-2 border-y-2 border-dashed border-line px-2 py-3">
        <AnimatePresence initial={false}>
          {items.map((it, i) => (
            <Box
              key={it.id}
              item={it}
              role={step.hl[it.id]}
              className="aspect-square text-sm"
              style={{ width: w }}
              enter={{ opacity: 0, y: -60 }}
              exit={{ opacity: 0, y: 60, scale: 0.6 }}
            >
              <span className="absolute -bottom-6 text-[10px] font-normal text-mist">{i}</span>
            </Box>
          ))}
        </AnimatePresence>
        {items.length === 0 && <p className="m-auto text-xs text-mist">empty</p>}
      </div>
    </div>
  );
}

export default function Linear2D({ step, kind, capacity }) {
  if (!step) return null;
  return kind === 'stack' ? <Stack2D step={step} capacity={capacity} /> : <Row2D step={step} capacity={capacity} double={kind === 'deque'} />;
}
