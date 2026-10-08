export type Sound = 'tap' | 'scan' | 'discovery' | 'xp' | 'achievement' | 'launch';
let context: AudioContext | undefined;
let enabled = false;
export function setSoundEnabled(value: boolean) {
  enabled = value;
}
export function playSound(kind: Sound) {
  if (!enabled) return;
  try {
    context ??= new AudioContext();
    void context.resume();
    const tones = {
      tap: [520],
      scan: [330, 440],
      discovery: [523, 659, 784, 1047],
      xp: [880, 1047],
      achievement: [659, 784, 1047],
      launch: [262, 392, 523, 784],
    }[kind];
    tones.forEach((frequency, i) => {
      const oscillator = context!.createOscillator();
      const gain = context!.createGain();
      const time = context!.currentTime + i * 0.09;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, time);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.055, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
      oscillator.connect(gain);
      gain.connect(context!.destination);
      oscillator.start(time);
      oscillator.stop(time + 0.23);
    });
  } catch {
    /* Audio is optional; keep gameplay available when unsupported. */
  }
}
