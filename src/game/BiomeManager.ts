import { Biome, BIOMES } from './BiomeConfig';

export class BiomeManager {
  private unlockedBiomes: Set<string> = new Set(['neon_core']);
  private currentBiomeId: string = 'neon_core';

  getCurrentBiome(): Biome {
    return BIOMES.find(b => b.id === this.currentBiomeId) || BIOMES[0];
  }

  getBiomeById(id: string): Biome | undefined {
    return BIOMES.find(b => b.id === id);
  }

  setCurrentBiome(id: string): boolean {
    if (this.unlockedBiomes.has(id)) {
      this.currentBiomeId = id;
      return true;
    }
    return false;
  }

  getAllBiomes(): Biome[] {
    return BIOMES;
  }

  isUnlocked(biomeId: string): boolean {
    return this.unlockedBiomes.has(biomeId);
  }

  unlockBiome(biomeId: string): boolean {
    if (this.unlockedBiomes.has(biomeId)) {
      return true;
    }
    this.unlockedBiomes.add(biomeId);
    return true;
  }

  checkUnlocks(highestWave: number, highScore: number, prestigeLevel: number): string[] {
    const newlyUnlocked: string[] = [];

    for (const biome of BIOMES) {
      if (this.unlockedBiomes.has(biome.id)) continue;

      const req = biome.unlockRequirement;
      let canUnlock = true;

      if (req.wavesCompleted && highestWave < req.wavesCompleted) canUnlock = false;
      if (req.scoreRequired && highScore < req.scoreRequired) canUnlock = false;
      if (req.prestigeLevel && prestigeLevel < req.prestigeLevel) canUnlock = false;

      if (canUnlock) {
        this.unlockedBiomes.add(biome.id);
        newlyUnlocked.push(biome.id);
      }
    }

    return newlyUnlocked;
  }

  getDifficulty(biomeId?: string): number {
    const biome = BIOMES.find(b => b.id === (biomeId || this.currentBiomeId));
    return biome?.difficulty || 1;
  }

  getUnlockedCount(): number {
    return this.unlockedBiomes.size;
  }
}

export const biomeManager = new BiomeManager();