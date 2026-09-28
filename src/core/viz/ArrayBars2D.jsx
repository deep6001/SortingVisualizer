import { roleColor, roleOf, withSortedSet } from './arrayState';

/** Flat bar chart for an array-trace step, with pointer labels and an optional auxiliary strip. */
export default function ArrayBars2D({ step }) {
  withSortedSet(step);
  if (!step) return null;
  const { a, marks = {} } = step;
  const max = step.max || Math.max(1, ...a);
  const n = a.length;
  const showValues = n <= 32;
  const gap = n > 80 ? 1 : n > 40 ? 2 : 4;
  const aux = marks.aux;
  const ptrs = Object.entries(marks.ptr || {});

  return (
    <div className="absolute inset-0 flex flex-col px-4 pb-9 pt-14 sm:px-8">
      <div className="relative flex min-h-0 flex-1 items-end" style={{ gap }}>
        {a.map((v, i) => {
          const role = roleOf(i, step);
          const hot = role === 'swap' || role === 'write' || role === 'compare';
          return (
            <div key={i} className="relative flex h-full min-w-0 flex-1 flex-col justify-end">
              {showValues && (
                <span
                  className="mb-1 overflow-visible whitespace-nowrap text-center text-[10px] tabular-nums sm:text-xs"
                  style={{ color: hot ? roleColor[role] : '#A1A1B2' }}
                >
                  {v}
                </span>
              )}
              <div
                className="w-full rounded-t-[3px] transition-[height,background-color] duration-75"
                style={{
                  height: `${Math.max(1.5, (v / max) * 100)}%`,
                  background: roleColor[role],
                  opacity: role === 'out' ? 0.55 : 1,
                  boxShadow: hot ? `0 0 14px ${roleColor[role]}` : 'none',
                }}
              />
              {ptrs
                .filter(([, idx]) => idx === i)
                .map(([name]) => (
                  <span key={name} className="absolute -bottom-6 left-1/2 -translate-x-1/2 font-mono text-[11px] text-amber">
                    ▲{name}
                  </span>
                ))}
            </div>
          );
        })}
      </div>
      {aux && <AuxStrip aux={aux} n={n} gap={gap} arrayMax={max} />}
    </div>
  );
}

function AuxStrip({ aux, n, gap, arrayMax }) {
  // a buffer copied from a[offset..] is drawn directly under that slice of the array
  const aligned = aux.offset != null;
  const values = aligned ? Array.from({ length: n }, (_, i) => aux.values[i - aux.offset]) : aux.values;
  const hi = aligned && aux.hi >= 0 ? aux.hi + aux.offset : aux.hi;
  const max = aligned ? arrayMax : Math.max(1, ...aux.values);
  return (
    <div className="mt-3 border-t border-dashed border-line pt-1.5">
      <p className="mb-1 text-[11px] leading-none text-mist">{aux.label}</p>
      <div className="flex h-9 items-end" style={{ gap: aligned ? gap : 1 }}>
        {values.map((v, i) => (
          <div key={i} className="flex h-full min-w-0 flex-1 flex-col justify-end">
            {v != null && (
              <div
                className="w-full rounded-t-[2px]"
                style={{
                  height: `${(v / max) * 100}%`,
                  minHeight: v ? 2 : 0,
                  background: i === hi ? '#FBBF24' : '#E879F9',
                  opacity: i === hi ? 1 : 0.6,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
