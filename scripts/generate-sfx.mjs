/**
 * Generates minimal WAV assets for SoundManager asset pipeline.
 * Run: node scripts/generate-sfx.mjs
 */
import fs from 'fs';
import path from 'path';

const OUT = 'public/audio';
const SAMPLE_RATE = 22050;

function writeWav(filename, freq, durationSec, type = 'sine') {
  const numSamples = Math.floor(SAMPLE_RATE * durationSec);
  const data = Buffer.alloc(numSamples * 2);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 8);
    let s = 0;
    if (type === 'sine') s = Math.sin(2 * Math.PI * freq * t);
    else if (type === 'noise') s = Math.random() * 2 - 1;
    else s = Math.sign(Math.sin(2 * Math.PI * freq * t));
    const v = Math.max(-1, Math.min(1, s * env * 0.4));
    data.writeInt16LE(Math.floor(v * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  const dataSize = data.length;
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, filename), Buffer.concat([header, data]));
}

writeWav('shoot.wav', 880, 0.08, 'square');
writeWav('splat.wav', 180, 0.15, 'noise');
writeWav('ui_click.wav', 1200, 0.04, 'sine');
writeWav('ui_hover.wav', 600, 0.03, 'sine');
writeWav('powerup.wav', 440, 0.2, 'sine');
writeWav('hit_base.wav', 60, 0.25, 'sine');
writeWav('boss_warning.wav', 110, 0.5, 'square');
console.log('Generated SFX in', OUT);