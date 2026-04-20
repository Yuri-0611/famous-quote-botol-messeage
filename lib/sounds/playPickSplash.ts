/** 波が「ざぶーん」と寄せるような低音中心のSE（Web Audio） */
export function playPickSplash(): void {
  if (typeof window === "undefined") return;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  try {
    const ctx = new Ctx();
    const t = ctx.currentTime;
    const dur = 0.42;

    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) {
      const env = Math.pow(1 - i / ch.length, 1.35);
      ch[i] = (Math.random() * 2 - 1) * env * 1.15;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.setValueAtTime(420, t);
    low.frequency.exponentialRampToValueAtTime(140, t + dur * 0.92);
    low.Q.value = 0.7;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(0.42, t + 0.05);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    noise.connect(low).connect(ng).connect(ctx.destination);
    noise.start(t);
    noise.stop(t + dur + 0.02);

    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.setValueAtTime(62, t);
    sub.frequency.exponentialRampToValueAtTime(34, t + dur * 0.88);
    const sg = ctx.createGain();
    sg.gain.setValueAtTime(0.0001, t);
    sg.gain.exponentialRampToValueAtTime(0.22, t + 0.06);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    sub.connect(sg).connect(ctx.destination);
    sub.start(t);
    sub.stop(t + dur + 0.02);

    const wash = ctx.createOscillator();
    wash.type = "sawtooth";
    wash.frequency.setValueAtTime(118, t);
    wash.frequency.exponentialRampToValueAtTime(72, t + dur * 0.75);
    const wf = ctx.createBiquadFilter();
    wf.type = "lowpass";
    wf.frequency.value = 520;
    const wg = ctx.createGain();
    wg.gain.setValueAtTime(0.0001, t);
    wg.gain.exponentialRampToValueAtTime(0.05, t + 0.08);
    wg.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.85);
    wash.connect(wf).connect(wg).connect(ctx.destination);
    wash.start(t);
    wash.stop(t + dur);

    void ctx.resume().catch(() => {});
    window.setTimeout(() => {
      void ctx.close().catch(() => {});
    }, 700);
  } catch {
    /* ignore */
  }
}
