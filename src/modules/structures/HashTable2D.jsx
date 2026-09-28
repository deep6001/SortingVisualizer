import { AnimatePresence, motion } from 'motion/react';
import { palette } from '../../core/theme';
import { roleColor } from './colors';
import { showKey } from './hashTable';

const TOP = 78;
const RH = 38;
const BH = 30;
const IW = 44;
const KW = 74;
const KGAP = 18;
const spring = { type: 'spring', stiffness: 240, damping: 28 };

const tableWidth = (buckets) => IW + 24 + Math.max(2, ...buckets.map((b) => b.length)) * (KW + KGAP);

function Table({ tx, m, buckets, label, hot, faded }) {
  return (
    <g opacity={faded ? 0.55 : 1}>
      <text x={tx} y={TOP - 14} fontSize={12} fill={palette.mist}>
        {label}
      </text>
      {Array.from({ length: m }, (_, i) => {
        const h = hot && hot.i === i ? roleColor[hot.role] : null;
        const y = TOP + i * RH;
        const n = buckets[i]?.length ?? 0;
        return (
          <g key={i}>
            <rect x={tx} y={y} width={IW} height={BH} rx={4} fill={h ? `${h}33` : palette.panel} stroke={h ?? palette.line} strokeWidth={h ? 2.5 : 1.2} />
            <text x={tx + IW / 2} y={y + BH / 2 + 1} textAnchor="middle" dominantBaseline="middle" fontSize={13} fill={h ?? palette.mist} className="font-mono">
              {i}
            </text>
            {n === 0 ? (
              <line x1={tx + IW + 8} y1={y + BH / 2} x2={tx + IW + 20} y2={y + BH / 2} stroke={palette.line} strokeWidth={1.2} />
            ) : (
              Array.from({ length: n }, (_, k) => {
                // arrow into key k (from the index cell, or from key k-1)
                const x2 = tx + IW + 21 + k * (KW + KGAP);
                const x1 = k === 0 ? tx + IW + 2 : x2 - KGAP + 2;
                return (
                  <line key={k} x1={x1} y1={y + BH / 2} x2={x2} y2={y + BH / 2} stroke={palette.mist} strokeWidth={1.2} markerEnd="url(#ht-arrow)" />
                );
              })
            )}
          </g>
        );
      })}
    </g>
  );
}

export default function HashTable2D({ step }) {
  if (!step) return null;
  const { old } = step;
  const oldW = old ? tableWidth(old.buckets) + 50 : 0;
  const newX = 20 + oldW;
  const W = Math.max(720, newX + tableWidth(step.buckets) + 20);
  const H = TOP + Math.max(step.m, old?.m ?? 0) * RH + 20;

  // every key, wherever it currently lives, keyed by id so it glides between tables
  const keys = [];
  const collect = (buckets, tx) =>
    buckets.forEach((chain, i) =>
      chain.forEach((it, k) => keys.push({ ...it, x: tx + IW + 22 + k * (KW + KGAP), y: TOP + i * RH })),
    );
  if (old) collect(old.buckets, 20);
  collect(step.buckets, newX);

  const hot = step.bucket;
  return (
    <div className="absolute inset-0 flex flex-col px-3 pb-5 pt-12">
      <div className="mb-2 min-h-[28px] self-center rounded-lg border border-white/10 bg-black/80 shadow-lg px-3 py-1 font-mono text-xs text-amber sm:text-sm">
        {step.calc ?? `m = ${step.m} buckets · load factor ${(step.stats.size / step.m).toFixed(2)} (resize above 0.75)`}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="min-h-0 w-full flex-1" preserveAspectRatio="xMidYMin meet">
        <defs>
          <marker id="ht-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0 0 L10 5 L0 10 z" fill={palette.mist} />
          </marker>
        </defs>
        {old && <Table tx={20} m={old.m} buckets={old.buckets} label={`old table, m = ${old.m}`} hot={hot?.table === 'old' ? hot : null} faded />}
        <Table
          tx={newX}
          m={step.m}
          buckets={step.buckets}
          label={old ? `new table, m = ${step.m}` : `m = ${step.m}`}
          hot={hot?.table === 'new' ? hot : null}
        />
        <AnimatePresence>
          {keys.map((it) => {
            const role = step.hl[it.id];
            const c = role ? roleColor[role] : palette.sky;
            return (
              <motion.g
                key={it.id}
                initial={{ opacity: 0, x: it.x + 30, y: it.y }}
                animate={{ opacity: 1, x: it.x, y: it.y }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={spring}
              >
                <rect
                  width={KW}
                  height={BH}
                  rx={5}
                  fill={role ? `${c}30` : palette.panel}
                  stroke={c}
                  strokeWidth={role ? 2.5 : 1.4}
                  style={role ? { filter: `drop-shadow(0 0 6px ${c})` } : undefined}
                />
                <text x={KW / 2} y={BH / 2 + 1} textAnchor="middle" dominantBaseline="middle" fontSize={13} fill={palette.paper} className="font-mono">
                  {showKey(it.key)}
                </text>
              </motion.g>
            );
          })}
        </AnimatePresence>
      </svg>
    </div>
  );
}
