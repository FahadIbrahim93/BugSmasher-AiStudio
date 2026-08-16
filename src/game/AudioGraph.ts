/**
 * AudioGraph — WebAudio effects processors for the master chain.
 * Reverb (send/return convolver) + master compressor. Built by
 * SoundManager.init(); split out of SoundManager (A-07).
 */

// ─── Audio Effects Processors ───────────────────────────────────────────

export class ReverbProcessor {
  private ctx: AudioContext;
  private convolver: ConvolverNode | null = null;
  private wetGain: GainNode;
  private dryGain: GainNode;

  constructor(ctx: AudioContext, dest: AudioNode) {
    this.ctx = ctx;
    this.wetGain = ctx.createGain();
    this.dryGain = ctx.createGain();
    this.wetGain.gain.value = 0.3;
    this.dryGain.gain.value = 0.7;
    this.wetGain.connect(dest);
    this.dryGain.connect(dest);
    this.createImpulseResponse(2.0, 3.0); // Default medium hall
  }

  private createImpulseResponse(duration: number, decay: number) {
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }

    this.convolver = this.ctx.createConvolver();
    this.convolver.buffer = impulse;
    this.convolver.connect(this.wetGain);
  }

  getWetInput(): AudioNode { return this.convolver!; }

  setMix(wet: number) {
    this.wetGain.gain.setTargetAtTime(wet, this.ctx.currentTime, 0.05);
    this.dryGain.gain.setTargetAtTime(1 - wet, this.ctx.currentTime, 0.05);
  }

  setDecay(duration: number, decay: number) {
    this.createImpulseResponse(duration, decay);
  }
}

export class CompressorProcessor {
  private compressor: DynamicsCompressorNode;

  constructor(ctx: AudioContext, dest: AudioNode) {
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -20;
    this.compressor.knee.value = 10;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.005;
    this.compressor.release.value = 0.1;
    this.compressor.connect(dest);
  }

  getInput(): AudioNode { return this.compressor; }

  setThreshold(db: number) {
    this.compressor.threshold.setTargetAtTime(db, this.compressor.context.currentTime, 0.05);
  }
}
