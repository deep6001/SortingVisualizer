// Tiny WebAudio blip: pitch follows the value being touched, so a sort "sounds" sorted.
let ctx;
let enabled = false;

export const setSoundEnabled = (on) => {
  enabled = on;
  if (on && !ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (on && ctx?.state === 'suspended') ctx.resume();
};

export const isSoundEnabled = () => enabled;

export function blip(ratio = 0.5, { duration = 0.06, type = 'triangle', gain = 0.05 } = {}) {
  if (!enabled || !ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = 180 + Math.max(0, Math.min(1, ratio)) * 900;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(g).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration);
}
