import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-xl border border-white/[0.07] bg-card/80 text-card-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.04),0_12px_32px_-16px_rgb(0_0_0/0.8)] backdrop-blur',
      className,
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-2.5', className)} {...props} />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn('text-xs font-medium text-muted-foreground', className)} {...props} />
));
CardTitle.displayName = 'CardTitle';

const CardContent = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} className={cn('p-4', className)} {...props} />);
CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardTitle, CardContent };
