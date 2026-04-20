/** ボトルを流すときの「シュッ…波へ」風の短いSE */
export function playThrowWhoosh(): void {
  if (typeof window === "undefined") return;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  try {
    const ctx = new Ctx();
    const t = ctx.currentTime;
    const dur = 0.35;

    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) {
      const env = Math.pow(1 - i / ch.length, 0.9);
      ch[i] = (Math.random() * 2 - 1) * env * 0.55;
    }
    const n = ctx.createBufferSource();
    n.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.setValueAtTime(1400, t);
    f.frequency.exponentialRampToValueAtTime(5200, t + dur * 0.55);
    f.Q.value = 0.55;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(f).connect(g).connect(ctx.destination);
    n.start(t);
    n.stop(t + dur);

    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(220, t);
    o.frequency.exponentialRampToValueAtTime(980, t + dur * 0.7);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.05, t + 0.05);
    og.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(og).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur);

    void ctx.resume().catch(() => {});
    window.setTimeout(() => void ctx.close().catch(() => {}), 500);
  } catch {
    /* ignore */
  }
}
