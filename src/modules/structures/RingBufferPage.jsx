import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowDownToLine, ArrowUpFromLine, Flame, RotateCcw } from 'lucide-react';
import meta from './meta';
import useOps from './useOps';
import { RING_CAP, initialRing, randomValue, ringCode, ringIntro, ringOps } from './linear';
import { OpsLog, ValueField } from './ui';
import { opsLegend, roleColor } from './colors';
import { palette } from '../../core/theme';
import VisualizerLayout from '../../core/ui/VisualizerLayout';
import { Button } from '../../core/ui/controls';

const CX = 190;
const CY = 175;
const R0 = 70;
const R1 = 130;

const polar = (r, a) => [CX + r * Math.cos(a), CY + r * Math.sin(a)];
const angleOf = (i) => -Math.PI / 2 + (i / RING_CAP) * Math.PI * 2;

function sector(i) {
  const gap = 0.03;
  const a0 = angleOf(i) - Math.PI / RING_CAP + gap;
  const a1 = angleOf(i) + Math.PI / RING_CAP - gap;
  const [x0, y0] = polar(R1, a0);
  const [x1, y1] = polar(R1, a1);
  const [x2, y2] = polar(R0, a1);
  const [x3, y3] = polar(R0, a0);
  return `M${x0} ${y0} A${R1} ${R1} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${R0} ${R0} 0 0 0 ${x3} ${y3} Z`;
}

function Pointer({ index, label, color, r }) {
  const a = angleOf(index);
  const [x, y] = polar(r, a);
  const [tx, ty] = polar(R0 - 6, a);
  return (
    <motion.g animate={{ opacity: 1 }}>
      <motion.line
        x1={CX}
        y1={CY}
        animate={{ x2: tx, y2: ty }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
        stroke={color}
        strokeWidth={2}
        markerEnd={`url(#ring-arrow-${label})`}
      />
      <motion.text
        animate={{ x, y }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={12}
        fill={color}
        className="font-mono"
      >
        {label}
      </motion.text>
    </motion.g>
  );
}

function Ring2D({ step }) {
  if (!step) return null;
  const { buf, head, tail, hl } = step;
  return (
    <div className="absolute inset-0 px-4 pb-5 pt-12">
      <svg viewBox="0 0 760 350" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          {[
            ['head', palette.violet],
            ['tail', palette.amber],
          ].map(([k, c]) => (
            <marker key={k} id={`ring-arrow-${k}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0 0 L10 5 L0 10 z" fill={c} />
            </marker>
          ))}
        </defs>
        {buf.map((it, i) => {
          const role = hl[i];
          const c = role ? roleColor[role] : it ? palette.sky : palette.line;
          const [tx, ty] = polar((R0 + R1) / 2, angleOf(i));
          const [ix, iy] = polar(R1 + 14, angleOf(i));
          return (
            <g key={i}>
              <path d={sector(i)} fill={it ? `${c}33` : 'transparent'} stroke={c} strokeWidth={role ? 2.5 : 1.5} />
              <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize={15} fill={it ? palette.paper : palette.line} className="font-mono">
                {it ? it.v : '·'}
              </text>
              <text x={ix} y={iy} textAnchor="middle" dominantBaseline="middle" fontSize={10} fill={palette.mist}>
                {i}
              </text>
            </g>
          );
        })}
        <Pointer index={head} label="head" color={palette.violet} r={28} />
        <Pointer index={tail} label="tail" color={palette.amber} r={44} />

        {/* the same memory laid out flat */}
        <text x={400} y={112} fontSize={12} fill={palette.mist}>
          The same array in memory
        </text>
        {buf.map((it, i) => {
          const role = hl[i];
          const c = role ? roleColor[role] : it ? palette.sky : palette.line;
          const x = 400 + i * 42;
          return (
            <g key={i}>
              <rect x={x} y={125} width={38} height={38} rx={4} fill={it ? `${c}33` : 'transparent'} stroke={c} strokeWidth={role ? 2.5 : 1.5} />
              <text x={x + 19} y={145} textAnchor="middle" dominantBaseline="middle" fontSize={13} fill={palette.paper} className="font-mono">
                {it ? it.v : ''}
              </text>
              <text x={x + 19} y={177} textAnchor="middle" fontSize={10} fill={palette.mist}>
                {i}
              </text>
            </g>
          );
        })}
        <motion.text animate={{ x: 400 + head * 42 + 19 }} y={198} textAnchor="middle" fontSize={11} fill={palette.violet} className="font-mono">
          ▲head
        </motion.text>
        <motion.text animate={{ x: 400 + tail * 42 + 19 }} y={214} textAnchor="middle" fontSize={11} fill={palette.amber} className="font-mono">
          ▲tail
        </motion.text>
        <text x={400} y={250} fontSize={12} fill={palette.mist}>
          {step.count === 0 ? 'Empty: head == tail and count is 0.' : step.count === RING_CAP ? 'Full: head == tail and count is the capacity.' : `${step.count} of ${RING_CAP} slots in use.`}
        </text>
      </svg>
    </div>
  );
}

const seedRing = () => {
  let s = initialRing();
  [7, 21, 42, 3, 15, 9].forEach((v) => (s = ringOps.enqueue(s, v).state));
  s = ringOps.dequeue(s).state;
  s = ringOps.dequeue(s).state;
  s = ringOps.dequeue(s).state;
  return { ...s, stats: { ops: 0, wraps: 0 } };
};

export default function RingBufferPage({ algo }) {
  const [value, setValue] = useState('');
  const intro = 'Three items sit in slots 3 to 5. Keep enqueuing and watch tail wrap from 7 back to 0.';
  const { log, run, reset, player } = useOps(seedRing, (s, msg) => ringIntro(s, msg ?? intro));
  const step = player.step;

  const take = () => {
    const n = Number(value);
    setValue('');
    return value.trim() && Number.isFinite(n) ? Math.round(n) : randomValue();
  };

  return (
    <VisualizerLayout
      module={meta}
      algo={algo}
      player={player}
      stage={<Ring2D step={step} />}
      code={ringCode}
      line={step?.line}
      message={step?.msg}
      legend={opsLegend}
      stats={[
        { label: 'Count', value: `${step?.count ?? 0} / ${RING_CAP}` },
        { label: 'head / tail', value: `${step?.head ?? 0} / ${step?.tail ?? 0}`, tone: 'text-violet' },
        { label: 'Wrap-arounds', value: step?.stats.wraps ?? 0, tone: 'text-amber' },
        { label: 'Operations', value: step?.stats.ops ?? 0 },
      ]}
      controls={
        <>
          <ValueField value={value} onChange={setValue} placeholder="random" onEnter={() => run((s) => ringOps.enqueue(s, take()))} />
          <div className="flex flex-wrap gap-2">
            <Button tone="primary" onClick={() => run((s) => ringOps.enqueue(s, take()))}>
              <ArrowDownToLine size={14} /> Enqueue
            </Button>
            <Button onClick={() => run(ringOps.dequeue)}>
              <ArrowUpFromLine size={14} /> Dequeue
            </Button>
            <Button
              tone="danger"
              onClick={() =>
                run((s) => {
                  // fill to capacity in one trace, so the wrap and the overflow check both show
                  let cur = s;
                  const all = [];
                  for (let k = 0; k <= RING_CAP - s.count; k++) {
                    const r = ringOps.enqueue(cur, randomValue());
                    all.push(...r.steps);
                    cur = r.state;
                  }
                  return { state: cur, steps: all, log: { text: 'fill until full', tone: 'bad' } };
                })
              }
            >
              <Flame size={14} /> Fill until full
            </Button>
          </div>
          <Button tone="ghost" onClick={() => reset(seedRing())}>
            <RotateCcw size={14} /> Reset
          </Button>
          <OpsLog log={log} />
        </>
      }
    />
  );
}
