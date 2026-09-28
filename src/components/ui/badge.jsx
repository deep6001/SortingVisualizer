import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors', {
  variants: {
    variant: {
      default: 'border-primary/30 bg-primary/15 text-indigo-200',
      secondary: 'border-transparent bg-secondary text-secondary-foreground',
      outline: 'border-border text-muted-foreground',
      success: 'border-mint/30 bg-mint/10 text-mint',
      warning: 'border-amber/30 bg-amber/10 text-amber',
    },
  },
  defaultVariants: { variant: 'default' },
});

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
