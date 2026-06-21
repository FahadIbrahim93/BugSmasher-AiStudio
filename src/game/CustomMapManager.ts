export interface CustomMapConfig {
  id: string;
  name: string;
  color: string;
  description: string;
  colorA: string;
  colorB: string;
  gridSize: number;
  gridColor: string;
  label: string;
  visualStyle: 'grid' | 'circuits' | 'nebula' | 'tecton_cracks' | 'snowflake_nodes';
  particleCount: number;
}

export const HANDCRAFTED_BATTLEGROUNDS: CustomMapConfig[] = [
  {
    id: 'toxic_reactor',
    name: 'NUCLEAR_MUTAGEN_REACTOR',
    color: '#39ff14',
    description: 'A decaying containment sector radiating volatile green acids, grid corrosion, and bio-scrapers.',
    colorA: '#021004',
    colorB: '#010501',
    gridSize: 140,
    gridColor: 'rgba(57, 255, 20, 0.015)',
    label: 'REACTOR_MUTAGEN_ACTIVE_LN-09',
    visualStyle: 'grid',
    particleCount: 50,
  },
  {
    id: 'chrono_singularity',
    name: 'CHRONO_SINGULARITY_RIFT',
    color: '#da70d6',
    description: 'An gravitational spatial anomaly pulling matter into magnetic purple stardust streams and orbital lines.',
    colorA: '#0d001c',
    colorB: '#030009',
    gridSize: 160,
    gridColor: 'rgba(218, 112, 214, 0.015)',
    label: 'GRAVITY_SINGULARITY_LIMIT_9.8G',
    visualStyle: 'nebula',
    particleCount: 75,
  },
  {
    id: 'hellfire_forge',
    name: 'MOLTEN_HELLFIRE_FORGE',
    color: '#ff3300',
    description: 'A structural volcanic plate fissure radiating intense heat cracks and glowing deep magma veins.',
    colorA: '#1a0300',
    colorB: '#080100',
    gridSize: 120,
    gridColor: 'rgba(255, 51, 0, 0.018)',
    label: 'THERMAL_CRUST_WARNING_ALARM',
    visualStyle: 'tecton_cracks',
    particleCount: 40,
  },
  {
    id: 'digital_matrix',
    name: 'CYBER_FLUX_MATRIX',
    color: '#00f3ff',
    description: 'A high-speed cybernetic grid overlay flowing with logical routing channels and neon data pipelines.',
    colorA: '#000c14',
    colorB: '#000306',
    gridSize: 100,
    gridColor: 'rgba(0, 243, 255, 0.016)',
    label: 'DIGITAL_MATRIX_OK_PORT_3000',
    visualStyle: 'circuits',
    particleCount: 60,
  },
  {
    id: 'cryo_aurora',
    name: 'GLACIER_AURORA_TERMINAL',
    color: '#00ccff',
    description: 'A freezing sub-zero sector structured with symmetric ice structures, frozen nodes, and cold winds.',
    colorA: '#000f1a',
    colorB: '#00040a',
    gridSize: 130,
    gridColor: 'rgba(0, 204, 255, 0.012)',
    label: 'CRITICAL_THERMO_SUB_ZERO_STABLE',
    visualStyle: 'snowflake_nodes',
    particleCount: 45,
  },
  {
    id: 'imperial_cache',
    name: 'SACRED_GOLDEN_SPIRE',
    color: '#ffd700',
    description: 'The ancient luxury cache vault displaying delicate golden electronic circuitry and royal amber dusts.',
    colorA: '#150f00',
    colorB: '#050300',
    gridSize: 110,
    gridColor: 'rgba(255, 215, 0, 0.02)',
    label: 'IMPERIAL_VAULT_SECURED_AUTH',
    visualStyle: 'circuits',
    particleCount: 70,
  }
];

export class CustomMapManager {
  private static STORAGE_KEY = 'bugsmasher_custom_battleground';
  private static ROTATION_KEY = 'bugsmasher_rotation_enabled';
  private static activeCustomMap: CustomMapConfig | null = CustomMapManager.loadLocal();
  private static rotationEnabled: boolean = CustomMapManager.loadRotationLocal();

  private static loadLocal(): CustomMapConfig | null {
    if (typeof localStorage === 'undefined') return HANDCRAFTED_BATTLEGROUNDS[0];
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      try {
        return JSON.parse(data) as CustomMapConfig;
      } catch (err) {
        console.error('Failed to parse custom battleground:', err);
        return HANDCRAFTED_BATTLEGROUNDS[0];
      }
    }
    // Default to the radioactive green reactor
    return HANDCRAFTED_BATTLEGROUNDS[0];
  }

  private static loadRotationLocal(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(this.ROTATION_KEY) === 'true';
  }

  static getCustomMap(wave?: number): CustomMapConfig | null {
    if (this.rotationEnabled) {
      if (wave !== undefined && wave > 0) {
        return this.getRotatedMapForWave(wave);
      }
      return this.getRotatedMapForTime();
    }
    return this.activeCustomMap || HANDCRAFTED_BATTLEGROUNDS[0];
  }

  static getActiveConfiguration(): CustomMapConfig {
    return this.activeCustomMap || HANDCRAFTED_BATTLEGROUNDS[0];
  }

  static saveCustomMap(map: CustomMapConfig): void {
    this.activeCustomMap = map;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(map));
    }
  }

  static isRotationEnabled(): boolean {
    return this.rotationEnabled;
  }

  static setRotationEnabled(enabled: boolean): void {
    this.rotationEnabled = enabled;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.ROTATION_KEY, enabled ? 'true' : 'false');
    }
  }

  static activateMapById(id: string): CustomMapConfig {
    const found = HANDCRAFTED_BATTLEGROUNDS.find(m => m.id === id);
    if (found) {
      this.saveCustomMap(found);
      return found;
    }
    return HANDCRAFTED_BATTLEGROUNDS[0];
  }

  static getRotatedMapForTime(): CustomMapConfig {
    // Systematic rotation based on calendar epoch / play session key
    if (typeof window === 'undefined') return HANDCRAFTED_BATTLEGROUNDS[0];
    // wave fallback not used currently
    const index = Math.floor(Date.now() / 60000) % HANDCRAFTED_BATTLEGROUNDS.length; // rotates every 60 seconds of session play!
    return HANDCRAFTED_BATTLEGROUNDS[index];
  }

  static getRotatedMapForWave(wave: number): CustomMapConfig {
    // Systematic rotation: changes battleground every 5 waves to keep experience highly dynamic & spectacular!
    const index = Math.floor((wave - 1) / 5) % HANDCRAFTED_BATTLEGROUNDS.length;
    return HANDCRAFTED_BATTLEGROUNDS[index];
  }
}
