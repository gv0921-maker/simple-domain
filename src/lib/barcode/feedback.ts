let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    ctx ??= new (window.AudioContext || (window as any).webkitAudioContext)();
    return ctx;
  } catch {
    return null;
  }
}

function beep(freq: number, durationMs: number, type: OscillatorType = 'sine') {
  const c = getCtx();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0.08;
    osc.connect(gain).connect(c.destination);
    osc.start();
    setTimeout(() => { osc.stop(); }, durationMs);
  } catch { /* ignore */ }
}

export function vibrate(pattern: number | number[]) {
  try { navigator.vibrate?.(pattern); } catch { /* ignore */ }
}

export function feedbackSuccess() {
  beep(880, 90);
  vibrate(40);
}

export function feedbackError() {
  beep(220, 180, 'square');
  vibrate([60, 40, 60]);
}

export function feedbackDuplicate() {
  beep(440, 120, 'triangle');
  vibrate([30, 30, 30]);
}

export function feedbackByResult(result: 'valid' | 'invalid' | 'duplicate' | 'not_expected') {
  if (result === 'valid') feedbackSuccess();
  else if (result === 'duplicate') feedbackDuplicate();
  else feedbackError();
}