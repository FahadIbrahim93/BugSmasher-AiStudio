import { describe, expect, it } from 'vitest';
import { ChecksumSystem } from '../lib/checksum';

describe('ChecksumSystem', () => {
  it('generates stable hashes independent of object key order', async () => {
    const canonical = {
      score: 1200,
      wave: 7,
      nested: { b: true, a: 'alpha' },
      inventory: ['turret', 'dash']
    };
    const reordered = {
      inventory: ['turret', 'dash'],
      nested: { a: 'alpha', b: true },
      wave: 7,
      score: 1200
    };

    await expect(ChecksumSystem.generate(reordered)).resolves.toBe(await ChecksumSystem.generate(canonical));
  });

  it('rejects mutated payloads and missing checksums', async () => {
    const payload = { score: 1200, wave: 7 };
    const checksum = await ChecksumSystem.generate(payload);

    await expect(ChecksumSystem.verify(payload, checksum)).resolves.toBe(true);
    await expect(ChecksumSystem.verify({ score: 9999, wave: 7 }, checksum)).resolves.toBe(false);
    await expect(ChecksumSystem.verify(payload, '')).resolves.toBe(false);
  });
});
