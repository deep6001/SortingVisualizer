import { useMemo, useRef, useState } from 'react';
import { Check, Eraser, Pencil } from 'lucide-react';
import usePlayer from '../../core/usePlayer';
import { blip } from '../../core/audio';
import { palette } from '../../core/theme';
import VisualizerLayout from '../../core/ui/VisualizerLayout';
import { Button, Segmented, Select, cx } from '../../core/ui/controls';
import { MAX_STEPS, clashes, parseSudoku, solveSudoku, sudokuCode } from './solvers';
import { Field } from './shared';
import { useElementSize } from './util';

const PRESETS = {
  easy: '020810740700003100090002805009040087400208003160030200302700060005600008076051090',
  medium: '003020600900305001001806400008102900700000008006708200002609500800203009005010300',
  hard: '030050040008010500460000012070502080000603000040109030250000098001020600080060020',
  expert: '000900002050123400030000160908000000070000090000000205091000050007439020400007000',
};

const legend = [
  { color: palette.paper, label: 'Given' },
  { color: palette.amber, label: 'Digit being tried' },
  { color: palette.coral, label: 'Clash' },
  { color: palette.mint, label: 'Placed' },
];

const boxOf = (i) => Math.floor(Math.floor(i / 9) / 3) * 3 + Math.floor((i % 9) / 3);

export default function SudokuPage({ meta, algo }) {
  const [preset, setPreset] = useState('easy');
  const [givens, setGivens] = useState(PRESETS.easy);
  const [editing, setEditing] = useState(false);
  const [mrv, setMrv] = useState(false);
  const grid = useMemo(() => parseSudoku(givens), [givens]);

  const run = useMemo(() => {
    if (editing)
      return { steps: [{ g: grid, line: null, msg: 'Type digits into the grid to set your own givens, then press Done.', stats: { tries: 0, backtracks: 0, filled: 0 }, kind: 'start' }] };
    return solveSudoku(grid, { mrv });
  }, [grid, mrv, editing]);

  const player = usePlayer(run.steps, {
    initialSpeed: 20,
    onStep: (s) => {
      if (s?.kind === 'place') blip(s.d / 9, { gain: 0.03 });
      else if (s?.kind === 'undo') blip(0.05, { type: 'square', gain: 0.02 });
    },
  });
  const step = player.step;
  const empty = grid.filter((v) => !v).length;

  const setCell = (i, d) => setGivens((g) => g.slice(0, i) + d + g.slice(i + 1));

  return (
    <VisualizerLayout
      module={meta}
      algo={algo}
      player={player}
      stage={<SudokuGrid step={step} givens={grid} editing={editing} onEdit={setCell} />}
      code={sudokuCode}
      line={step?.line}
      message={step?.msg}
      legend={legend}
      stats={[
        { label: 'Digits tried', value: step?.stats.tries ?? 0, tone: 'text-amber' },
        { label: 'Backtracks', value: step?.stats.backtracks ?? 0, tone: 'text-coral' },
        { label: 'Filled', value: `${step?.stats.filled ?? 0} / ${empty}`, tone: 'text-mint' },
        { label: 'Givens', value: 81 - empty },
      ]}
      controls={
        <>
          <Select
            label="Puzzle"
            value={preset}
            onChange={(p) => {
              setPreset(p);
              if (PRESETS[p]) {
                setGivens(PRESETS[p]);
                setEditing(false);
              }
            }}
            options={[
              { value: 'easy', label: 'Easy' },
              { value: 'medium', label: 'Medium' },
              { value: 'hard', label: 'Hard' },
              { value: 'expert', label: 'Expert' },
              { value: 'custom', label: 'Your own' },
            ]}
          />
          <Field label="Next cell">
            <Segmented
              size="sm"
              label="Next cell"
              value={mrv ? 'mrv' : 'order'}
              onChange={(v) => setMrv(v === 'mrv')}
              options={[
                { value: 'order', label: 'Reading order' },
                { value: 'mrv', label: 'Fewest options first' },
              ]}
            />
          </Field>
          <Button
            tone={editing ? 'primary' : 'plain'}
            onClick={() => {
              setEditing((e) => !e);
              setPreset('custom');
            }}
          >
            {editing ? <Check size={14} /> : <Pencil size={14} />} {editing ? 'Done' : 'Edit givens'}
          </Button>
          <Button
            tone="danger"
            onClick={() => {
              setGivens('0'.repeat(81));
              setPreset('custom');
              setEditing(true);
            }}
          >
            <Eraser size={14} /> Clear
          </Button>
          {run.capped && (
            <p className="max-w-xs self-center text-xs text-coral">
              This puzzle needs more than {MAX_STEPS.toLocaleString()} steps in reading order; the animation stops there. “Fewest options first” solves it much faster.
            </p>
          )}
        </>
      }
    />
  );
}

function SudokuGrid({ step, givens, editing, onEdit }) {
  const box = useRef(null);
  const { width, height } = useElementSize(box);
  const inputs = useRef([]);
  if (!step) return null;
  const size = Math.max(200, Math.min(width, height - 40));
  const cell = size / 9;
  const cur = step.cur;
  const bad = new Set(step.bad ?? []);
  const trying = step.kind === 'try';
  const scope = (i) => cur != null && trying && (Math.floor(i / 9) === Math.floor(cur / 9) || i % 9 === cur % 9 || boxOf(i) === boxOf(cur));

  // for a failing try: which of row / column / box rejected the digit
  const why = trying ? clashes(step.g, cur, step.d) : null;

  return (
    <div className="absolute inset-0 flex px-4 pb-12 pt-14">
      <div ref={box} className="flex flex-1 flex-col items-center justify-center gap-3">
        {width > 0 && (
          <div className="grid border-2 border-sky/60" style={{ width: size, height: size, gridTemplateColumns: 'repeat(9, 1fr)' }}>
            {Array.from({ length: 81 }, (_, i) => {
              const r = Math.floor(i / 9);
              const c = i % 9;
              const given = givens[i] > 0;
              const isCur = i === cur;
              let v = step.g[i];
              let color = given ? palette.paper : palette.mint;
              let bg = 'transparent';
              let ring = 'none';
              if (scope(i)) bg = 'rgba(182,156,255,0.07)';
              if (bad.has(i)) {
                bg = 'rgba(255,107,107,0.3)';
                color = palette.coral;
              }
              if (isCur) {
                if (step.kind === 'try') {
                  v = step.d;
                  color = palette.amber;
                  bg = 'rgba(255,181,71,0.16)';
                  ring = `inset 0 0 0 2px ${palette.amber}`;
                } else if (step.kind === 'place') {
                  bg = 'rgba(94,226,176,0.22)';
                  ring = `inset 0 0 0 2px ${palette.mint}, 0 0 16px ${palette.mint}`;
                } else if (step.kind === 'undo') {
                  v = step.d;
                  color = palette.coral;
                  ring = `inset 0 0 0 2px ${palette.coral}`;
                } else if (step.kind === 'dead') ring = `inset 0 0 0 2px ${palette.coral}`;
              }
              const borders = cx(c % 3 === 2 && c < 8 ? 'border-r-2 border-r-sky/60' : 'border-r border-r-line', r % 3 === 2 && r < 8 ? 'border-b-2 border-b-sky/60' : 'border-b border-b-line');
              if (editing)
                return (
                  <input
                    key={i}
                    ref={(el) => (inputs.current[i] = el)}
                    aria-label={`Row ${r + 1} column ${c + 1}`}
                    inputMode="numeric"
                    value={givens[i] || ''}
                    onChange={(e) => {
                      const d = e.target.value.replace(/[^1-9]/g, '').slice(-1);
                      onEdit(i, d || '0');
                      if (d) inputs.current[i + 1]?.focus();
                    }}
                    onKeyDown={(e) => {
                      const move = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 9, ArrowUp: -9 }[e.key];
                      if (move) inputs.current[i + move]?.focus();
                    }}
                    className={cx('bg-transparent text-center font-display font-bold text-paper caret-sky focus:bg-sky/10 focus:outline-none', borders)}
                    style={{ fontSize: cell * 0.5 }}
                  />
                );
              return (
                <div
                  key={i}
                  className={cx('flex items-center justify-center font-display tabular-nums transition-colors duration-100', borders, isCur && step.kind === 'undo' && 'line-through', given ? 'font-bold' : 'font-medium')}
                  style={{ background: bg, boxShadow: ring, color, fontSize: cell * 0.5 }}
                >
                  {v || ''}
                </div>
              );
            })}
          </div>
        )}
        <div className="flex h-6 items-center gap-2 text-xs">
          {why &&
            [
              ['row', why.row],
              ['column', why.col],
              ['box', why.box],
            ].map(([k, hit]) => (
              <span key={k} className={cx('rounded border px-2 py-0.5 font-mono', hit != null ? 'border-coral/60 text-coral' : 'border-line text-mist')}>
                {hit != null ? '✕' : '✓'} {k}
              </span>
            ))}
          {trying && <span className="text-mist">for {step.d}</span>}
        </div>
      </div>
    </div>
  );
}
