/**
 * Generates minimal high-quality organic WAV assets for SoundManager.
 * Run: node scripts/generate-sfx.mjs
 */
/* global Buffer, process, console */
import fs from 'fs';
import path from 'path';

const OUT = 'public/audio';
const SAMPLE_RATE = 22050;

function writeWavHeader(dataSize) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // Linear PCM
  header.writeUInt16LE(1, 22); // Mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28); // Byte rate
  header.writeUInt16LE(2, 32); // Block align
  header.writeUInt16LE(16, 34); // Bits per sample
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  return header;
}

// Write shoot.wav: Satisfying blunt mallet impact / bug whacking sound
function generateShootWav() {
  const durationSec = 0.15;
  const numSamples = Math.floor(SAMPLE_RATE * durationSec);
  const data = Buffer.alloc(numSamples * 2);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const envFast = Math.exp(-t * 22); // fast slap dampening
    const envSlower = Math.exp(-t * 10); // deeper punch body

    // 1. Initial slap crack (noise + transient triangle pitch)
    const slName = (Math.random() * 2 - 1) * 0.18;
    const slTone = Math.sin(2 * Math.PI * 340 * t) * 0.25;
    const slap = (slName + slTone) * envFast;

    // 2. Heavy mallet body (low sine punch sliding downwards)
    const body = Math.sin(2 * Math.PI * 110 * Math.exp(-t * 10) * t) * 0.38 * envSlower;

    // 3. Very subtle gooey trailing sound
    const gooey = (Math.random() * 2 - 1) * 0.08 * Math.exp(-t * 15);

    const s = slap + body + gooey;
    const v = Math.max(-1, Math.min(1, s * 0.5));
    data.writeInt16LE(Math.floor(v * 32767), i * 2);
  }

  const header = writeWavHeader(data.length);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'shoot.wav'), Buffer.concat([header, data]));
}

// Write splat.wav: Visceral organic bug squish & squeak sound
function generateSplatWav() {
  const durationSec = 0.35;
  const numSamples = Math.floor(SAMPLE_RATE * durationSec);
  const data = Buffer.alloc(numSamples * 2);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const envClick = Math.exp(-t * 40); // Initial crush transient
    const envBody = Math.exp(-t * 7);    // Wet squishy decay
    const envSquirt = Math.exp(-t * 15);   // Wet squirt decay

    // 1. Chitinous Shell Crunch (crisp high-frequency crackles for shell fracturing)
    let crunch = 0;
    if (t < 0.08) {
      const clickTrend = Math.sin(2 * Math.PI * 250 * t);
      crunch = (Math.random() * 2 - 1) * 0.55 * envClick * (clickTrend > 0 ? 1 : 0.2);
    }

    // 2. Wet squirt noise (broadband wet noise spray creating realistic fluid dynamics)
    let squirt = 0;
    if (t < 0.15) {
      const fluidNoise = (Math.random() * 2 - 1) * 0.32 * Math.sin(2 * Math.PI * 180 * t);
      squirt = fluidNoise * envSquirt;
    }

    // 3. Wet Gooey Squelch (modulating low frequencies + thick organic noise)
    const modFreq = 50 + Math.sin(2 * Math.PI * 24 * t) * 18;
    const squelchNoise = (Math.random() * 2 - 1) * 0.3;
    const squelchTone = Math.sin(2 * Math.PI * modFreq * t) * 0.3;
    const gooeyBody = (squelchTone + squelchNoise) * envBody;

    // 4. Heavy visceral impact sound (short acoustic punch of mallet/impact)
    const impact = Math.sin(2 * Math.PI * 80 * Math.exp(-t * 5) * t) * 0.25 * envClick;

    const s = crunch + squirt + gooeyBody + impact;
    const v = Math.max(-1, Math.min(1, s * 0.45));
    data.writeInt16LE(Math.floor(v * 32767), i * 2);
  }

  const header = writeWavHeader(data.length);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'splat.wav'), Buffer.concat([header, data]));
}

// Standard fallback writers
function writeSimpleWav(filename, freq, durationSec, type = 'sine') {
  const numSamples = Math.floor(SAMPLE_RATE * durationSec);
  const data = Buffer.alloc(numSamples * 2);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 8);
    let s = 0;
    if (type === 'sine') s = Math.sin(2 * Math.PI * freq * t);
    else if (type === 'noise') s = Math.random() * 2 - 1;
    else s = Math.sign(Math.sin(2 * Math.PI * freq * t));
    const v = Math.max(-1, Math.min(1, s * env * 0.3));
    data.writeInt16LE(Math.floor(v * 32767), i * 2);
  }
  const header = writeWavHeader(data.length);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, filename), Buffer.concat([header, data]));
}

/* ============================================================
 * ADVANCED SYNTHESIS HELPERS
 * Deterministic (seeded) generation + peak-normalized writing
 * so regenerated assets are byte-stable and hit the SFX pack
 * loudness contract (see docs/SFX_PACK_CONTRACT.md).
 * ============================================================ */

/** Seeded PRNG (mulberry32) so output is reproducible across runs. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Linear ADSR envelope. attack/decay/release in seconds, sustain in [0,1].
 * @param {number} t - elapsed time in seconds
 * @param {number} attack - attack duration in seconds
 * @param {number} decay - decay duration in seconds
 * @param {number} sustain - sustain level in [0,1]
 * @param {number} release - release duration in seconds
 * @param {number} duration - total duration in seconds
 */
function adsr(t, attack, decay, sustain, release, duration) {
  if (t < 0) return 0;
  if (t < attack) return t / attack;
  const peakEnd = attack + decay;
  const releaseStart = duration - release;
  if (t < peakEnd) {
    const k = (t - attack) / decay;
    return 1 + (sustain - 1) * k;
  }
  if (t < releaseStart) return sustain;
  return sustain * Math.max(0, 1 - (t - releaseStart) / release);
}

/** Normalize samples to a target peak (0..1 ≈ dBFS) and write a mono 16-bit WAV. */
function writePeakNormalizedWav(filename, samples, targetPeak = 0.7) {
  const numSamples = samples.length;
  let peak = 0;
  for (let i = 0; i < numSamples; i++) {
    peak = Math.max(peak, Math.abs(samples[i]));
  }
  const gain = peak > 0 ? targetPeak / peak : 0;
  const data = Buffer.alloc(numSamples * 2);
  for (let i = 0; i < numSamples; i++) {
    const v = Math.max(-1, Math.min(1, samples[i] * gain));
    data.writeInt16LE(Math.floor(v * 32767), i * 2);
  }
  const header = writeWavHeader(data.length);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, filename), Buffer.concat([header, data]));
}

/** Cheap one-pole lowpass sweep; alpha() returns a 0..1 coefficient per sample. */
function sweepLowpass(input, alphaFn) {
  const out = new Array(input.length);
  let lp = 0;
  for (let i = 0; i < input.length; i++) {
    const a = alphaFn(i);
    lp += a * (input[i] - lp);
    out[i] = lp;
  }
  return out;
}

/* ============================================================
 * P0 ASSET DESIGNS (replacing placeholder synths)
 * ============================================================ */

// Crit hit: bright metallic "ping" with rising pitch chirp + sparkle harmonics.
// Distinct from shoot's blunt thwack: inharmonic partials give a bell-like "shing".
function generateCritHitWav() {
  const sr = SAMPLE_RATE;
  const durationSec = 0.28;
  const n = Math.floor(sr * durationSec);
  const rng = mulberry32(0x9e3779b9);
  const samples = new Array(n).fill(0);

  // Inharmonic metallic partials (bell-like), each with its own decay
  const partials = [
    { f: 1720, a: 0.5, d: 38 },
    { f: 2780, a: 0.32, d: 52 },
    { f: 3610, a: 0.2, d: 64 },
    { f: 5210, a: 0.1, d: 78 },
  ];
  const phases = partials.map(() => 0);

  for (let i = 0; i < n; i++) {
    const t = i / sr;
    // Pitch chirp: starts ~18% sharp, settles quickly (classic "shing!")
    const chirp = 1 + 0.18 * Math.exp(-t * 60);
    let s = 0;
    for (let pIdx = 0; pIdx < partials.length; pIdx++) {
      const p = partials[pIdx];
      // Proper phase accumulation so the chirp frequency is exact (no drift)
      phases[pIdx] += (2 * Math.PI * p.f * chirp) / sr;
      s += Math.sin(phases[pIdx]) * p.a * Math.exp(-t * p.d);
    }
    // Attack transient noise (metallic click)
    if (t < 0.006) s += (rng() * 2 - 1) * 0.5 * (1 - t / 0.006);
    const env = adsr(t, 0.0015, 0.03, 0.15, 0.12, durationSec);
    samples[i] = s * env;
  }

  writePeakNormalizedWav('crit_hit.wav', samples, 0.7); // ≈ -3 dBFS
}

// Miss: dull airy "whiff" — band-swept noise descending through a lowpass + soft body.
// Intentionally quiet and understated (-9 dBFS) so misses read as negative feedback.
function generateMissWav() {
  const sr = SAMPLE_RATE;
  const durationSec = 0.22;
  const n = Math.floor(sr * durationSec);
  const rng = mulberry32(0x51ff5aa);
  const noise = new Array(n);
  const samples = new Array(n).fill(0);

  for (let i = 0; i < n; i++) noise[i] = rng() * 2 - 1;

  // Sweep a lowpass cutoff from ~3.5kHz down to ~210Hz over the sound
  const filtered = sweepLowpass(noise, (i) => {
    const k = i / n;
    const cutoff = 3500 * Math.pow(0.06, k); // 3500 -> ~210 Hz
    return 1 - Math.exp((-2 * Math.PI * cutoff) / sr);
  });

  // Body tone with proper phase accumulation so the downward sweep never
  // reverses (sin(2π·f(t)·t) would drift frequency and even go negative).
  let bodyPhase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const env = adsr(t, 0.01, 0.04, 0.3, 0.1, durationSec);
    const bodyFreq = 300 - 220 * Math.min(1, t * 8); // 300 -> 80 Hz
    bodyPhase += (2 * Math.PI * bodyFreq) / sr;
    samples[i] = (filtered[i] * 0.55 + Math.sin(bodyPhase) * 0.12) * env;
  }

  writePeakNormalizedWav('miss.wav', samples, 0.35); // ≈ -9 dBFS
}

// Combo break: descending two-note sting (G4 -> D4) with chorus wobble.
// Slightly dissonant detuned pairs give the "lost streak" sting character.
function generateComboBreakWav() {
  const sr = SAMPLE_RATE;
  const durationSec = 0.6;
  const n = Math.floor(sr * durationSec);
  const rng = mulberry32(0xabc12345);
  const samples = new Array(n).fill(0);

  const note1Start = 0;
  const note2Start = 0.18;
  const note1Freq = 392; // G4
  const note2Freq = 293.66; // D4

  // Fixed detuned chorus pairs (computed once — per-sample random detune would
  // modulate frequency with noise instead of a clean detuned pair)
  const note1Detune = 1 + (rng() - 0.5) * 0.006;
  const note2Detune = 1 + (rng() - 0.5) * 0.006;
  let phase1 = 0;
  let phase1Det = 0;
  let phase1Harm = 0;
  let phase2 = 0;
  let phase2Det = 0;
  let phase2Harm = 0;

  for (let i = 0; i < n; i++) {
    const t = i / sr;
    let s = 0;

    // Note 1 (G4) with detuned chorus pair
    if (t >= note1Start) {
      const t1 = t - note1Start;
      const env1 = adsr(t1, 0.004, 0.05, 0.35, 0.16, 0.4);
      phase1 += (2 * Math.PI * note1Freq) / sr;
      phase1Det += (2 * Math.PI * note1Freq * note1Detune * 1.008) / sr;
      phase1Harm += (2 * Math.PI * note1Freq * 2) / sr;
      s += Math.sin(phase1) * 0.4 * env1;
      s += Math.sin(phase1Det) * 0.25 * env1;
      s += Math.sin(phase1Harm) * 0.1 * env1;
    }

    // Note 2 (D4) — landing note, slightly stronger
    if (t >= note2Start) {
      const t2 = t - note2Start;
      const env2 = adsr(t2, 0.004, 0.06, 0.4, 0.2, 0.42);
      phase2 += (2 * Math.PI * note2Freq) / sr;
      phase2Det += (2 * Math.PI * note2Freq * note2Detune * 0.992) / sr;
      phase2Harm += (2 * Math.PI * note2Freq * 2) / sr;
      s += Math.sin(phase2) * 0.45 * env2;
      s += Math.sin(phase2Det) * 0.28 * env2;
      s += Math.sin(phase2Harm) * 0.12 * env2;
    }

    const env = adsr(t, 0.003, 0.03, 0.9, 0.12, durationSec);
    samples[i] = s * env;
  }

  writePeakNormalizedWav('combo_break.wav', samples, 0.5); // ≈ -6 dBFS
}

// --new-only regenerates just the new P0 assets without touching committed noise-based ones
const onlyNew = process.argv.includes('--new-only');
if (onlyNew) {
  generateCritHitWav();
  generateMissWav();
  generateComboBreakWav();
  console.log('Successfully generated new audio-overhaul wav files in', OUT);
} else {
  // Generate the suite of sound effects
  generateShootWav();
  generateSplatWav();
  writeSimpleWav('ui_click.wav', 1200, 0.04, 'sine');
  writeSimpleWav('ui_hover.wav', 600, 0.03, 'sine');
  writeSimpleWav('powerup.wav', 440, 0.2, 'sine');
  writeSimpleWav('hit_base.wav', 55, 0.3, 'sine');
  writeSimpleWav('boss_warning.wav', 110, 0.5, 'square');
  generateCritHitWav();
  generateMissWav();
  generateComboBreakWav();

  console.log('Successfully generated organic bug-smasher wav files in', OUT);
}
