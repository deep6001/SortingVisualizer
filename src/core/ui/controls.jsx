import { useId } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Button as UIButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider as UISlider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select as UISelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/*
 * The small control kit every module imports. Built on shadcn/ui; the props API
 * predates it and is kept stable so modules don't need to change.
 */

const cx = cn;
const toneToVariant = { primary: 'default', plain: 'outline', ghost: 'ghost', danger: 'destructive' };

export function Button({ tone = 'plain', type = 'button', ...props }) {
  return <UIButton type={type} variant={toneToVariant[tone] ?? 'outline'} {...props} />;
}

export function IconButton({ label, className, children, active, ...props }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <UIButton
          type="button"
          size="icon"
          variant="ghost"
          aria-label={label}
          className={cn(active && 'bg-primary/15 text-indigo-200 hover:bg-primary/20', 'text-muted-foreground', className)}
          {...props}
        >
          {children}
        </UIButton>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** Radio-style choice with an animated pill (Aceternity tabs). options: [{ value, label, icon? }] */
export function Segmented({ value, onChange, options, disabled, size = 'md', label }) {
  const pill = useId();
  return (
    <ToggleGroup
      type="single"
      aria-label={label}
      value={String(value)}
      disabled={disabled}
      onValueChange={(v) => {
        if (!v) return;
        const opt = options.find((o) => String(o.value) === v);
        if (opt) onChange(opt.value);
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <ToggleGroupItem key={String(o.value)} value={String(o.value)} size={size === 'sm' ? 'sm' : 'default'}>
            {active && (
              <motion.span
                layoutId={pill}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
                className="absolute inset-0 rounded-md bg-gradient-to-b from-white/[0.12] to-white/[0.05] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.1)]"
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {o.icon}
              {o.label}
            </span>
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}

export function Slider({ label, value, display, min, max, step = 1, onChange, disabled }) {
  return (
    <div className="flex min-w-[150px] flex-1 flex-col gap-2">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums text-foreground">{display ?? value}</span>
      </div>
      <UISlider
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={[value]}
        disabled={disabled}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}

export function Select({ label, value, onChange, options, disabled }) {
  return (
    <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
      {label}
      <UISelect
        value={String(value)}
        disabled={disabled}
        onValueChange={(v) => {
          const opt = options.find((o) => String(o.value) === v);
          onChange(opt ? opt.value : v);
        }}
      >
        <SelectTrigger aria-label={label} className="min-w-[8rem] text-foreground">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={String(o.value)} value={String(o.value)}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </UISelect>
    </div>
  );
}

export function NumberInput({ label, value, onChange, min, max, className }) {
  return (
    <label className={cn('flex flex-col gap-1.5 text-xs text-muted-foreground', className)}>
      {label}
      <Input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        className="w-24 font-mono tabular-nums text-foreground"
      />
    </label>
  );
}

export { cx };
