import { cn } from '@/lib/utils';
import { SpotlightCard } from './spotlight-card';

/** Aceternity "Bento Grid": uneven tiles; wide tiles span two columns. */
export function BentoGrid({ className, children }) {
  return <div className={cn('mx-auto grid grid-cols-1 gap-4 md:grid-flow-row-dense md:auto-rows-[minmax(12rem,auto)] md:grid-cols-3', className)}>{children}</div>;
}

export function BentoGridItem({ className, title, description, header, icon, footer }) {
  return (
    <SpotlightCard className={cn('flex flex-col gap-4 p-5 transition duration-200 hover:-translate-y-0.5', className)}>
      {header}
      <div className="relative transition duration-200 group-hover:translate-x-1">
        {icon}
        <div className="mb-1 mt-1 font-display text-lg font-semibold text-foreground">{title}</div>
        <div className="text-sm leading-relaxed text-muted-foreground">{description}</div>
      </div>
      {footer && <div className="relative mt-auto">{footer}</div>}
    </SpotlightCard>
  );
}
