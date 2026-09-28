import { useEffect, useRef, useState } from 'react';
import usePlayer from '../../core/usePlayer';

/**
 * Operation-driven playback. The committed structure lives in `state`; each
 * operation replaces the trace with its own short run of steps and auto-plays it.
 * `makeIntro(state)` builds the resting step shown before any operation.
 */
export default function useOps(initial, makeIntro, { speed = 4, onStep } = {}) {
  const [state, setState] = useState(initial);
  const stateRef = useRef(state);
  const [steps, setSteps] = useState(() => [makeIntro(state)]);
  const [log, setLog] = useState([]);
  const autoplay = useRef(false);
  const seq = useRef(0);

  const player = usePlayer(steps, { initialSpeed: speed, onStep });

  useEffect(() => {
    if (!autoplay.current) return;
    autoplay.current = false;
    player.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps]);

  /** op(state) → { state, steps, log: { text, tone } } */
  const run = (op) => {
    const r = op(stateRef.current);
    stateRef.current = r.state;
    setState(r.state);
    setSteps(r.steps.length ? r.steps : [makeIntro(r.state)]);
    if (r.log) setLog((l) => [...l.slice(-39), { ...r.log, id: ++seq.current }]);
    autoplay.current = r.steps.length > 1;
  };

  const reset = (next, msg) => {
    stateRef.current = next;
    setState(next);
    setSteps([makeIntro(next, msg)]);
    setLog([]);
  };

  return { state, steps, log, run, reset, player };
}
