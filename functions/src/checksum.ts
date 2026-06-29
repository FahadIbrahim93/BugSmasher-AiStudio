import { createHash } from 'crypto';

const TEST_SALT = 'emulator-test-salt-do-not-use-in-production';

export function getChecksumSalt(): string {
  const salt = process.env.CHECKSUM_SALT;
  if (salt) return salt;

  const isEmulator =
    process.env.FUNCTIONS_EMULATOR === 'true' ||
    process.env.FIRESTORE_EMULATOR_HOST != null ||
    process.env.NODE_ENV === 'test';

  if (isEmulator) return TEST_SALT;

  throw new Error('CHECKSUM_SALT must be configured for save checksum validation.');
}

export function sortObject(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sortObject);
  const rec = obj as Record<string, unknown>;
  return Object.keys(rec)
    .sort()
    .reduce((acc: Record<string, unknown>, key) => {
      acc[key] = sortObject(rec[key]);
      return acc;
    }, {});
}

export function generateChecksum(data: Record<string, unknown>): string {
  const serialized = JSON.stringify(sortObject(data));
  return createHash('sha256')
    .update(serialized + getChecksumSalt())
    .digest('hex');
}

export function generateClientChecksum(data: Record<string, unknown>): string {
  const serialized = JSON.stringify(sortObject(data));
  return createHash('sha256').update(serialized).digest('hex');
}
