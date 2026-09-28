import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Drives playback over a precomputed trace of steps.
 * `speed` is in steps per second; fractional accumulation keeps slow speeds smooth
 * and lets fast speeds skip several steps per frame.
 */
export default function usePlayer(steps, { initialSpeed = 8, onStep } = {}) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(initialSpeed);
  const last = Math.max(0, steps.length - 1);

  const indexRef = useRef(0);
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;

  useEffect(() => {
    indexRef.current = 0;
    setIndex(0);
    setPlaying(false);
  }, [steps]);

  const seek = useCallback(
    (i) => {
      const next = Math.min(last, Math.max(0, Math.round(i)));
      indexRef.current = next;
      setIndex(next);
    },
    [last],
  );

  useEffect(() => {
    if (!playing) return undefined;
    let raf;
    let prev = performance.now();
    let acc = 0;
    const tick = (now) => {
      acc += ((now - prev) / 1000) * speed;
      prev = now;
      if (acc >= 1) {
        const jump = Math.floor(acc);
        acc -= jump;
        const next = Math.min(last, indexRef.current + jump);
        indexRef.current = next;
        setIndex(next);
        onStepRef.current?.(steps[next]);
        if (next >= last) {
          setPlaying(false);
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, last, steps]);

  const play = useCallback(() => {
    if (indexRef.current >= last) seek(0);
    setPlaying(true);
  }, [last, seek]);
  const pause = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => (playing ? pause() : play()), [playing, play, pause]);
  const stepBy = useCallback(
    (d) => {
      setPlaying(false);
      const next = Math.min(last, Math.max(0, indexRef.current + d));
      indexRef.current = next;
      setIndex(next);
      onStepRef.current?.(steps[next]);
    },
    [last, steps],
  );

  // for one render after `steps` changes the reset effect hasn't run yet, so clamp
  const safe = Math.min(index, last);
  return {
    index: safe,
    step: steps[safe],
    total: steps.length,
    playing,
    speed,
    setSpeed,
    play,
    pause,
    toggle,
    next: () => stepBy(1),
    prev: () => stepBy(-1),
    seek,
    reset: () => {
      setPlaying(false);
      seek(0);
    },
    done: safe >= last,
  };
}
