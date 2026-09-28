import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Code2, Menu, Swords } from 'lucide-react';
import { modules } from './catalog';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { TooltipProvider } from '@/components/ui/tooltip';

export function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-[0_0_24px_-4px_rgb(129_140_248/0.8)]">
        <svg width="16" height="16" viewBox="0 0 26 26" aria-hidden>
          <rect x="2" y="14" width="5" height="10" rx="1.5" fill="white" fillOpacity="0.7" />
          <rect x="10.5" y="8" width="5" height="16" rx="1.5" fill="white" fillOpacity="0.85" />
          <rect x="19" y="2" width="5" height="22" rx="1.5" fill="white" />
        </svg>
      </span>
      <span className="font-display text-[17px] font-bold tracking-tight">AlgoAnimate</span>
    </Link>
  );
}

function NavItem({ to, icon: Icon, children, count, active, onNavigate, pillId }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={cn(
        'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        active ? 'text-white' : 'text-muted-foreground hover:bg-white/[0.03] hover:text-foreground',
      )}
    >
      {active && (
        <motion.span
          layoutId={pillId}
          transition={{ type: 'spring', bounce: 0.15, duration: 0.45 }}
          className="absolute inset-0 rounded-lg border border-white/[0.08] bg-gradient-to-r from-indigo-500/20 via-indigo-500/10 to-transparent"
        />
      )}
      <Icon size={16} className={cn('relative z-10', active && 'text-indigo-300')} />
      <span className="relative z-10 flex-1">{children}</span>
      {count != null && (
        <span className={cn('relative z-10 font-mono text-[11px] tabular-nums', active ? 'text-indigo-200' : 'text-muted-foreground/50')}>
          {count}
        </span>
      )}
    </NavLink>
  );
}

function Nav({ onNavigate, pillId }) {
  const { pathname } = useLocation();
  return (
    <nav aria-label="Modules" className="scroll-thin flex-1 overflow-y-auto px-3 pb-6">
      <p className="px-3 pb-2 pt-1 text-[11px] font-medium text-muted-foreground/60">Modules</p>
      <ul className="flex flex-col gap-0.5">
        {modules.map(({ meta, icon }) => {
          const open = pathname.startsWith(`/${meta.id}`);
          return (
            <li key={meta.id}>
              <NavItem to={`/${meta.id}`} icon={icon} count={meta.algorithms.length} active={open} onNavigate={onNavigate} pillId={pillId}>
                {meta.title}
              </NavItem>
              {open && meta.algorithms.length > 1 && (
                <motion.ul
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-2 ml-[1.4rem] mt-1 overflow-hidden border-l border-white/[0.07]"
                >
                  {meta.algorithms.map((a, i) => (
                    <li key={a.id}>
                      <NavLink
                        to={`/${meta.id}/${a.id}`}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          cn(
                            '-ml-px block border-l py-1 pl-4 text-[13px] transition-colors',
                            isActive || (i === 0 && pathname === `/${meta.id}`)
                              ? 'border-indigo-400 text-foreground'
                              : 'border-transparent text-muted-foreground hover:text-foreground',
                          )
                        }
                      >
                        {a.name}
                      </NavLink>
                    </li>
                  ))}
                </motion.ul>
              )}
            </li>
          );
        })}
      </ul>
      <p className="px-3 pb-2 pt-5 text-[11px] font-medium text-muted-foreground/60">Compare</p>
      <NavItem to="/race" icon={Swords} active={pathname === '/race'} onNavigate={onNavigate} pillId={pillId}>
        Sorting race
      </NavItem>
    </nav>
  );
}

export default function Shell() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <TooltipProvider delayDuration={250}>
      <div className="flex min-h-full">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/[0.06] bg-black/40 backdrop-blur-xl lg:flex">
          <div className="px-6 pb-6 pt-5">
            <Logo />
          </div>
          <Nav pillId="nav-pill" />
          <a
            href="https://github.com/deep6001/SortingVisualizer"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 border-t border-white/[0.06] px-6 py-3.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Code2 size={14} /> Source on GitHub
          </a>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.06] bg-background/70 px-4 backdrop-blur-xl lg:hidden">
            <Logo />
            <Button variant="ghost" size="icon" aria-label="Open menu" onClick={() => setOpen(true)}>
              <Menu />
            </Button>
          </header>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent>
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="px-6 py-5">
                <Logo />
              </div>
              <Nav onNavigate={() => setOpen(false)} pillId="nav-pill-mobile" />
            </SheetContent>
          </Sheet>

          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
