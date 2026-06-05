import { BIOMES } from '../game/BiomeConfig';

export interface BiomeVisualProfile {
  id: string;
  backgroundLayers: {
    key: string;
    color: string;
    parallax: number;
    alpha: number;
  }[];
  ambientParticleBudget: number;
  lighting: {
    radialGlow: string;
    edgeVignette: string;
    scanlineColor: string;
  };
  bugHarmony: {
    tint: string;
    contrastStroke: string;
  };
  transition: 'glitch' | 'heat-haze' | 'cryo-bloom' | 'void-fold' | 'gold-flare';
}

const transitionByBiome: Record<string, BiomeVisualProfile['transition']> = {
  neon_core: 'glitch',
  quantum_void: 'void-fold',
  ember_depths: 'heat-haze',
  frostbyte: 'cryo-bloom',
  golden_cache: 'gold-flare',
  void_abyss: 'void-fold',
  golden_spire: 'gold-flare',
};

export const BIOME_VISUAL_PROFILES: Record<string, BiomeVisualProfile> = Object.fromEntries(
  BIOMES.map((biome) => [
    biome.id,
    {
      id: biome.id,
      backgroundLayers: [
        {
          key: `${biome.id}.base`,
          color: biome.theme.background,
          parallax: 0,
          alpha: 1,
        },
        {
          key: `${biome.id}.fog`,
          color: biome.theme.fogColor,
          parallax: 0.12,
          alpha: 0.7,
        },
        {
          key: `${biome.id}.grid`,
          color: biome.theme.gridColor,
          parallax: 0.04,
          alpha: 0.9,
        },
      ],
      ambientParticleBudget: biome.id.includes('void') ? 42 : 30,
      lighting: {
        radialGlow: biome.theme.coreGlow,
        edgeVignette: 'rgba(0, 0, 0, 0.42)',
        scanlineColor: biome.theme.gridColorSecondary,
      },
      bugHarmony: {
        tint: biome.bugs.eliteColor ?? biome.bugs.baseColor,
        contrastStroke: biome.theme.coreColor,
      },
      transition: transitionByBiome[biome.id] ?? 'glitch',
    },
  ])
) as Record<string, BiomeVisualProfile>;

export function getBiomeVisualProfile(biomeId: string): BiomeVisualProfile {
  return BIOME_VISUAL_PROFILES[biomeId] ?? BIOME_VISUAL_PROFILES.neon_core;
}
