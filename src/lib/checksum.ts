/**
 * Checksum utility for game state integrity.
 *
 * SECURITY NOTE: this is tamper-evidence for offline/client saves, not a secret-bearing
 * trust boundary. Leaderboards and cloud saves must continue to be validated server-side.
 */

const SALT = 'smash_the_bugs_2026_FAANG_SECRET';

type SortableRecord = Record<string, unknown>;

export class ChecksumSystem {
  /**
   * Generates a deterministic SHA-256 hash for JSON-compatible game state.
   */
  static async generate(data: unknown): Promise<string> {
    const serialized = JSON.stringify(this.sortObject(data));
    const msgBuffer = new TextEncoder().encode(serialized + SALT);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verifies whether the data matches the provided checksum.
   */
  static async verify(data: unknown, checksum: string): Promise<boolean> {
    if (!checksum) return false;
    const generated = await this.generate(data);
    return generated === checksum;
  }

  /**
   * Recursively sorts object keys to ensure deterministic serialization.
   */
  private static sortObject(obj: unknown): unknown {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => this.sortObject(item));

    const record = obj as SortableRecord;
    return Object.keys(record).sort().reduce<SortableRecord>((acc, key) => {
      acc[key] = this.sortObject(record[key]);
      return acc;
    }, {});
  }
}
