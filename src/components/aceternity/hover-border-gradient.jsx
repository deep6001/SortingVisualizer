import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

const directions = ['TOP', 'LEFT', 'BOTTOM', 'RIGHT'];
const map = {
  TOP: 'radial-gradient(20.7% 50% at 50% 0%, #a5b4fc 0%, rgba(255,255,255,0) 100%)',
  LEFT: 'radial-gradient(16.6% 43.1% at 0% 50%, #a5b4fc 0%, rgba(255,255,255,0) 100%)',
  BOTTOM: 'radial-gradient(20.7% 50% at 50% 100%, #e879f9 0%, rgba(255,255,255,0) 100%)',
  RIGHT: 'radial-gradient(16.2% 41.2% at 100% 50%, #e879f9 0%, rgba(255,255,255,0) 100%)',
};
const highlight = 'radial-gradient(75% 181% at 50% 50%, #818cf8 0%, rgba(255,255,255,0) 100%)';

/** Aceternity "Hover Border Gradient": a light that travels around the border. */
export function HoverBorderGradient({ children, containerClassName, className, as: Tag = 'button', duration = 1, ...props }) {
  const [hovered, setHovered] = useState(false);
  const [direction, setDirection] = useState('TOP');

  useEffect(() => {
    if (hovered) return undefined;
    const t = setInterval(() => setDirection((d) => directions[(directions.indexOf(d) - 1 + 4) % 4]), duration * 1000);
    return () => clearInterval(t);
  }, [hovered, duration]);

  return (
    <Tag
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'relative flex h-min w-fit items-center justify-center overflow-visible rounded-full border border-white/10 bg-black/20 p-px transition duration-500 hover:bg-black/10',
        containerClassName,
      )}
      {...props}
    >
      <div className={cn('z-10 w-auto rounded-[inherit] bg-black px-5 py-2.5 text-white', className)}>{children}</div>
      <motion.div
        className="absolute inset-0 z-0 flex-none overflow-hidden rounded-[inherit]"
        style={{ filter: 'blur(2px)', position: 'absolute', width: '100%', height: '100%' }}
        initial={{ background: map[direction] }}
        animate={{ background: hovered ? [map[direction], highlight] : map[direction] }}
        transition={{ ease: 'linear', duration }}
      />
      <div className="absolute inset-[2px] z-[1] flex-none rounded-[100px] bg-black" />
    </Tag>
  );
}
