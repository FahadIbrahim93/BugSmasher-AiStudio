// CosmeticsStore - Skins and cosmetic unlocks for personalization

export interface CosmeticSkin {
  id: string;
  name: string;
  type: 'core' | 'bug' | 'powerup' | 'ui' | 'trail';
  description: string;
  price: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  color: string;
  glowColor?: string;
  owned: boolean;
}

export const COSMETICS: CosmeticSkin[] = [
  // Core Skins
  { id: 'core_default', name: 'Neon Core', type: 'core', description: 'Classic cyan glow', price: 0, rarity: 'common', color: '#00ffcc', owned: true },
  { id: 'core_purple', name: 'Quantum Core', type: 'core', description: 'Purple quantum energy', price: 100, rarity: 'uncommon', color: '#a855f7', glowColor: 'rgba(167, 139, 250, 0.5)', owned: false },
  { id: 'core_red', name: 'Ember Core', type: 'core', description: 'Burning hot', price: 200, rarity: 'rare', color: '#ef4444', glowColor: 'rgba(252, 165, 165, 0.5)', owned: false },
  { id: 'core_gold', name: 'Golden Core', type: 'core', description: 'Prestige gold', price: 500, rarity: 'epic', color: '#eab308', glowColor: 'rgba(253, 224, 71, 0.5)', owned: false },
  
  // Bug Skins
  { id: 'bug_default', name: 'Basic Bug', type: 'bug', description: 'White standard', price: 0, rarity: 'common', color: '#ffffff', owned: true },
  { id: 'bug_neon', name: 'Neon Bug', type: 'bug', description: 'Glowing cyan', price: 100, rarity: 'uncommon', color: '#00ffcc', owned: false },
  { id: 'bug_glitch', name: 'Glitch Bug', type: 'bug', description: 'Corrupted data', price: 250, rarity: 'rare', color: '#a855f7', owned: false },
  { id: 'bug_prestige', name: 'Prestige Bug', type: 'bug', description: 'Golden variant', price: 750, rarity: 'legendary', color: '#fbbf24', owned: false },
  
  // Trail Skins
  { id: 'trail_none', name: 'No Trail', type: 'trail', description: 'Clean look', price: 0, rarity: 'common', color: 'transparent', owned: true },
  { id: 'trail_cyan', name: 'Cyan Trail', type: 'trail', description: 'Slow fade', price: 150, rarity: 'uncommon', color: '#00ffcc', owned: false },
  { id: 'trail_rainbow', name: 'RGB Trail', type: 'trail', description: 'Cycle colors', price: 500, rarity: 'epic', color: '#ff00ff', owned: false },
  
  // UI Skins
  { id: 'ui_default', name: 'Default UI', type: 'ui', description: 'Standard neon', price: 0, rarity: 'common', color: '#00ffcc', owned: true },
  { id: 'ui_dark', name: 'Dark Mode', type: 'ui', description: 'Subtle dark', price: 50, rarity: 'common', color: '#71717a', owned: true },
  { id: 'ui_hacker', name: 'Hacker Green', type: 'ui', description: 'Old school', price: 200, rarity: 'rare', color: '#22c55e', owned: false },
];

export class CosmeticsManager {
  private ownedSkins: Set<string> = new Set(['core_default', 'bug_default', 'trail_none', 'ui_default', 'ui_dark']);
  private equippedSkins: Map<string, string> = new Map([
    ['core', 'core_default'],
    ['bug', 'bug_default'],
    ['trail', 'trail_none'],
    ['ui', 'ui_default'],
  ]);

  getAllCosmetics(): CosmeticSkin[] {
    return COSMETICS.map(c => ({
      ...c,
      owned: this.ownedSkins.has(c.id),
    }));
  }

  getCosmeticsByType(type: CosmeticSkin['type']): CosmeticSkin[] {
    return this.getAllCosmetics().filter(c => c.type === type);
  }

  isOwned(skinId: string): boolean {
    return this.ownedSkins.has(skinId);
  }

  equip(skinId: string): boolean {
    if (!this.ownedSkins.has(skinId)) return false;
    
    const skin = COSMETICS.find(c => c.id === skinId);
    if (!skin) return false;
    
    this.equippedSkins.set(skin.type, skinId);
    return true;
  }

  getEquipped(type: string): string {
    return this.equippedSkins.get(type) || '';
  }

  getEquippedSkin(type: string): CosmeticSkin | undefined {
    const id = this.equippedSkins.get(type);
    return COSMETICS.find(c => c.id === id);
  }

  purchase(skinId: string): boolean {
    const skin = COSMETICS.find(c => c.id === skinId);
    if (!skin || this.ownedSkins.has(skinId)) return false;
    
    this.ownedSkins.add(skinId);
    return true;
  }

  getTotalValue(): number {
    return Array.from(this.ownedSkins).reduce((sum, id) => {
      const skin = COSMETICS.find(c => c.id === id);
      return sum + (skin?.price || 0);
    }, 0);
  }

  getOwnedCount(): number {
    return this.ownedSkins.size;
  }
}

export const cosmeticsManager = new CosmeticsManager();