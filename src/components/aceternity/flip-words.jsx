import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';

// per-letter colour stops, since background-clip gradients don't reach transformed inline-block letters
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
function letterColor(stops, i, n) {
  if (!stops) return undefined;
  const t = n <= 1 ? 0 : i / (n - 1);
  const seg = Math.min(stops.length - 2, Math.floor(t * (stops.length - 1)));
  const local = t * (stops.length - 1) - seg;
  return `rgb(${mix(stops[seg], stops[seg + 1], local).join(' ')})`;
}

/** Aceternity "Flip Words": cycles through words, blurring each letter in. */
export function FlipWords({ words, duration = 2600, className, gradient }) {
  const [current, setCurrent] = useState(words[0]);
  const [animating, setAnimating] = useState(false);

  const next = useCallback(() => {
    setCurrent(words[(words.indexOf(current) + 1) % words.length]);
    setAnimating(true);
  }, [current, words]);

  useEffect(() => {
    if (animating) return undefined;
    const t = setTimeout(next, duration);
    return () => clearTimeout(t);
  }, [animating, duration, next]);

  return (
    <AnimatePresence onExitComplete={() => setAnimating(false)}>
      <motion.span
        key={current}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 10 }}
        exit={{ opacity: 0, y: -40, x: 40, filter: 'blur(8px)', scale: 2, position: 'absolute' }}
        className={cn('relative z-10 inline-block', className)}
      >
        {current.split('').map((letter, i) => (
          <motion.span
            key={current + i}
            initial={{ opacity: 0, y: 10, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="inline-block"
            style={{ color: letterColor(gradient, i, current.length) }}
          >
            {letter === ' ' ? ' ' : letter}
          </motion.span>
        ))}
      </motion.span>
    </AnimatePresence>
  );
}
