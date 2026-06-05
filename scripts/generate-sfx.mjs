/**
 * Generates minimal high-quality organic WAV assets for SoundManager.
 * Run: node scripts/generate-sfx.mjs
 */
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

// Generate the suite of sound effects
generateShootWav();
generateSplatWav();
writeSimpleWav('ui_click.wav', 1200, 0.04, 'sine');
writeSimpleWav('ui_hover.wav', 600, 0.03, 'sine');
writeSimpleWav('powerup.wav', 440, 0.2, 'sine');
writeSimpleWav('hit_base.wav', 55, 0.3, 'sine');
writeSimpleWav('boss_warning.wav', 110, 0.5, 'square');

console.log('Successfully generated organic bug-smasher wav files in', OUT);
