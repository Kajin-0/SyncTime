
/**
 * Optimized Audio Service for mobile performance.
 * Pre-allocates buffers and manages context suspension to save battery.
 * Features the 'Ghost Click' sound signature for a premium, subtle feel.
 */

class AudioService {
  private ctx: AudioContext | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)({
        // 24kHz is plenty for UI sounds and significantly lighter on mobile CPU than 48kHz
        sampleRate: 24000,
      });
      this.precomputeNoise();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Pre-calculates white noise once to avoid real-time calculation and GC pressure.
   */
  private precomputeNoise() {
    if (!this.ctx) return;
    const size = this.ctx.sampleRate * 0.1; // 100ms
    this.noiseBuffer = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
    const output = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < size; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }

  /**
   * Subtle Ghost Click.
   * A high-passed, pure sine pop that mimics a high-end tactile physical switch.
   * Extremely low CPU usage and minimal main-thread impact.
   */
  playClick() {
    const ctx = this.initContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    // Frequency sweep gives it a "pop" rather than a "beep"
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.03);

    // High-pass ensures it stays out of the way of lower-frequency UI sounds
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1500, now);
    filter.Q.setValueAtTime(1, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.04, now + 0.002);
    // Using setTargetAtTime for the release phase is more efficient on mobile
    gain.gain.setTargetAtTime(0, now + 0.01, 0.015);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Efficient Glassy Chime (Clock-In).
   * Layered sine waves with optimized envelopes.
   */
  playClockIn() {
    const ctx = this.initContext();
    const now = ctx.currentTime;

    const chime = (freq: number, offset: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + offset);

      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.linearRampToValueAtTime(0.08, now + offset + 0.01);
      gain.gain.setTargetAtTime(0, now + offset + 0.05, 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + offset);
      osc.stop(now + offset + 0.8);
    };

    chime(1046.50, 0); // C6
    chime(1567.98, 0.04); // G6
  }

  /**
   * Efficient Muted Tap (Clock-Out).
   */
  playClockOut() {
    const ctx = this.initContext();
    const now = ctx.currentTime;

    const tap = (freq: number, offset: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + offset);
      osc.frequency.setTargetAtTime(freq * 0.5, now + offset, 0.05);

      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.linearRampToValueAtTime(0.06, now + offset + 0.005);
      gain.gain.setTargetAtTime(0, now + offset + 0.02, 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + offset);
      osc.stop(now + offset + 0.2);
    };

    tap(440, 0);
    tap(330, 0.06);
  }

  /**
   * Low-CPU Error Thud.
   */
  playError() {
    const ctx = this.initContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.setTargetAtTime(60, now, 0.1);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.005);
    gain.gain.setTargetAtTime(0, now + 0.02, 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }
}

export const audioService = new AudioService();
