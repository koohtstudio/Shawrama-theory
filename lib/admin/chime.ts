/** A short two-note chime made with Web Audio (no audio file to ship). Needs a prior tap to be allowed. */
let ctx: AudioContext | undefined;

export function unlockAudio() {
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx.state;
}

export function chime() {
  if (!ctx) return;
  const t = ctx.currentTime;
  [660, 880, 1320].forEach((f, i) => {
    const o = ctx!.createOscillator();
    const g = ctx!.createGain();
    o.type = "sine";
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t + i * 0.16);
    g.gain.exponentialRampToValueAtTime(0.3, t + i * 0.16 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.16 + 0.5);
    o.connect(g).connect(ctx!.destination);
    o.start(t + i * 0.16);
    o.stop(t + i * 0.16 + 0.55);
  });
}
