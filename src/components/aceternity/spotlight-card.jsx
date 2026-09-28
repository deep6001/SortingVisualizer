import { motion, useMotionTemplate, useMotionValue } from 'motion/react';
import { cn } from '@/lib/utils';

/** Aceternity-style card whose border and surface light up under the cursor. */
export function SpotlightCard({ children, className, radius = 320, color = 'rgb(99 102 241 / 0.16)', as: Tag = 'div', ...props }) {
  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);
  const bg = useMotionTemplate`radial-gradient(${radius}px circle at ${x}px ${y}px, ${color}, transparent 80%)`;
  const border = useMotionTemplate`radial-gradient(${radius * 0.8}px circle at ${x}px ${y}px, rgb(165 180 252 / 0.5), transparent 70%)`;

  return (
    <Tag
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - r.left);
        y.set(e.clientY - r.top);
      }}
      onMouseLeave={() => {
        x.set(-1000);
        y.set(-1000);
      }}
      className={cn('group relative rounded-xl border border-white/[0.07] bg-card/70', className)}
      {...props}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: border,
          WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: 1,
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: bg }}
      />
      {children}
    </Tag>
  );
}
