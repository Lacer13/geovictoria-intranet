// Original synthesized cues. Audio is created only after a player gesture.
export function createGameAudio() {
  let context;
  let gain;
  let volume = 0.25;
  return {
    async unlock() {
      try {
        const AudioContext =
          globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!AudioContext) return;
        if (!context) {
          context = new AudioContext();
          gain = context.createGain();
          gain.connect(context.destination);
          gain.gain.value = volume;
        }
        if (context.state === "suspended") await context.resume();
      } catch {
        /* A browser without audio remains fully playable. */
      }
    },
    setVolume(value) {
      volume = value;
      if (gain && context)
        gain.gain.setTargetAtTime(value, context.currentTime, 0.02);
    },
    play(event) {
      if (!context || context.state !== "running" || !volume) return;
      const notes = {
        shoot: [780],
        hit: [220],
        damage: [140, 95],
        dash: [380, 680],
        pickup: [660, 830, 990],
        warning: [330, 330],
        boss: [220, 165],
        victory: [523, 659, 784, 1046],
        defeat: [392, 330, 262],
      }[event];
      if (!notes) return;
      notes.forEach((frequency, i) => {
        const at = context.currentTime + i * 0.085;
        const oscillator = context.createOscillator();
        const envelope = context.createGain();
        oscillator.type = event === "damage" ? "triangle" : "sine";
        oscillator.frequency.setValueAtTime(frequency, at);
        envelope.gain.setValueAtTime(0, at);
        envelope.gain.linearRampToValueAtTime(
          event === "shoot" ? 0.06 : 0.16,
          at + 0.006,
        );
        envelope.gain.exponentialRampToValueAtTime(0.001, at + 0.14);
        oscillator.connect(envelope);
        envelope.connect(gain);
        oscillator.start(at);
        oscillator.stop(at + 0.15);
      });
    },
    pause() {
      if (context?.state === "running") void context.suspend().catch(() => {});
    },
    close() {
      if (context && context.state !== "closed")
        void context.close().catch(() => {});
    },
  };
}
