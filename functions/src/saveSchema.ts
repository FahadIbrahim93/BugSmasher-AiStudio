import { z } from 'zod';
import * as functions from 'firebase-functions/v1';

const statsSchema = z
  .object({
    totalKills: z.number().int().min(0).max(10_000_000).optional(),
    totalWaves: z.number().int().min(0).max(100_000).optional(),
    totalPlayTime: z.number().min(0).max(1_000_000_000).optional(),
    bossesDefeated: z.number().int().min(0).max(100_000).optional(),
    highestWave: z.number().int().min(0).max(1000).optional(),
    totalScore: z.number().int().min(0).max(100_000_000).optional(),
  })
  .passthrough();

export const saveDataSchema = z
  .object({
    score: z.number().int().min(0).max(100_000_000),
    wave: z.number().int().min(0).max(1000),
    health: z.number().min(0).max(10_000),
    maxHealth: z.number().min(1).max(10_000),
    clickRadiusMultiplier: z.number().min(0.1).max(100),
    autoTurretLevel: z.number().int().min(0).max(100),
    healthLevel: z.number().int().min(0).max(100).optional(),
    radiusLevel: z.number().int().min(0).max(100).optional(),
    timestamp: z.number().int().min(0),
    stats: statsSchema.optional(),
    playedStoryBeats: z.array(z.string().max(128)).max(500).optional(),
    biome: z.string().max(64).optional(),
    weaponHeat: z.number().min(0).max(100).optional(),
    furyCooldownTimer: z.number().min(0).max(3600).optional(),
  })
  .strict();

export type SaveData = z.infer<typeof saveDataSchema>;

export function parseSaveData(value: unknown): SaveData {
  const result = saveDataSchema.safeParse(value);
  if (!result.success) {
    const summary = result.error.issues
      .map((issue) => issue.path.join('.') || issue.message)
      .join(', ');
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Save data failed validation: ${summary}`,
    );
  }
  return result.data;
}
