/**
 * Notification sound playback. Tries to play an audio file from /sounds first,
 * and falls back to a Web Audio API beep so the system works without bundled
 * audio assets.
 */

export type NotifTone = 'chat' | 'general' | 'urgent';

const SOUND_FILES: Record<NotifTone, string> = {
  chat: '/sounds/chat-notification.mp3',
  general: '/sounds/general-notification.mp3',
  urgent: '/sounds/urgent.mp3',
};

const TONE_PROFILE: Record<NotifTone, { freq: number; duration: number; type: OscillatorType }> = {
  chat:    { freq: 880, duration: 0.12, type: 'sine' },
  general: { freq: 660, duration: 0.18, type: 'sine' },
  urgent:  { freq: 440, duration: 0.35, type: 'square' },
};

let audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor: typeof AudioContext | undefined =
    (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) {
    try { audioCtx = new Ctor(); } catch { return null; }
  }
  return audioCtx;
}

function beep(tone: NotifTone) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const profile = TONE_PROFILE[tone];
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = profile.type;
  osc.frequency.value = profile.freq;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + profile.duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + profile.duration + 0.02);
  if (tone === 'urgent') {
    // double pulse
    setTimeout(() => beepOnce(tone), 220);
  }
}

function beepOnce(tone: NotifTone) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const profile = TONE_PROFILE[tone];
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = profile.type;
  osc.frequency.value = profile.freq;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + profile.duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + profile.duration + 0.02);
}

export function playNotificationSound(tone: NotifTone = 'general') {
  if (typeof window === 'undefined') return;
  try {
    const audio = new Audio(SOUND_FILES[tone]);
    audio.volume = 0.5;
    const p = audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => beep(tone));
    }
  } catch {
    beep(tone);
  }
}