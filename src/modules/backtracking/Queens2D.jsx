import { useRef } from 'react';
import { ChessQueen } from 'lucide-react';
import { palette } from '../../core/theme';
import { attackLine } from './solvers';
import { queenRole, roleColor, tile, useElementSize } from './util';

/** Flat board: queens as icons, the attacked line in coral, the tried square as a ghost. */
export default function Queens2D({ n, step }) {
  const box = useRef(null);
  const { width, height } = useElementSize(box);
  if (!step) return null;
  const size = Math.max(160, Math.min(width, height));
  const cell = size / n;
  const hot = new Set(step.conflict ? attackLine(n, step.at, step.conflict.kind) : []);
  const ghost = step.kind === 'conflict' || step.kind === 'remove' ? step.at : null;

  return (
    <div className="absolute inset-0 flex px-4 pb-12 pt-14">
      <div ref={box} className="flex flex-1 items-center justify-center">
        {width > 0 && (
          <div className="grid border border-line shadow-[0_0_40px_rgba(129, 140, 248,0.08)]" style={{ width: size, height: size, gridTemplateColumns: `repeat(${n}, 1fr)` }}>
            {Array.from({ length: n * n }, (_, i) => {
              const r = Math.floor(i / n);
              const c = i % n;
              const hasQueen = step.q[r] === c;
              const isGhost = ghost && ghost[0] === r && ghost[1] === c;
              const deadRow = step.kind === 'dead' && step.row === r;
              const role = hasQueen ? queenRole(step, r) : null;
              return (
                <div key={i} className="relative flex items-center justify-center transition-colors duration-150" style={{ background: tile(r, c) }}>
                  {(hot.has(i) || deadRow) && <div className="absolute inset-0" style={{ background: 'rgba(255,107,107,0.28)' }} />}
                  {hasQueen && (
                    <ChessQueen
                      size={cell * 0.62}
                      strokeWidth={1.6}
                      className="relative transition-colors"
                      style={{ color: roleColor[role], filter: role !== 'idle' ? `drop-shadow(0 0 8px ${roleColor[role]})` : 'none' }}
                    />
                  )}
                  {isGhost && (
                    <ChessQueen
                      size={cell * 0.62}
                      strokeWidth={1.6}
                      className="relative"
                      style={{ color: step.kind === 'conflict' ? palette.amber : palette.coral, opacity: step.kind === 'conflict' ? 0.75 : 0.35, transform: step.kind === 'remove' ? 'translateY(-18%)' : 'none' }}
                    />
                  )}
                  {isGhost && step.kind === 'conflict' && (
                    <span className="absolute right-1 top-0.5 font-mono font-bold text-coral" style={{ fontSize: Math.max(10, cell * 0.22) }}>
                      ✕
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
