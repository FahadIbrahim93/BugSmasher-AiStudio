export const GameConfig = {
  canvas: {
    mobileDprCap: 1.5,
    desktopDprCap: 2,
  },
  player: {
    maxHealth: 100,
    hitDamage: 10,
    baseClickRadiusMultiplier: 2.5,
  },
  upgrades: {
    health: { 
      baseCost: 300, 
      costMultiplier: 200, 
      healAmount: 50 
    },
    radius: { 
      baseCost: 500, 
      costMultiplier: 300, 
      radiusMultiplier: 1.25 
    },
    turret: { 
      baseCost: 1000, 
      costMultiplier: 500, 
      baseFireRate: 1.5, 
      fireRateReduction: 0.2, 
      minFireRate: 0.2 
    },
  },
  bugs: {
    basic: { color: '#ffffff', baseSpeed: 50, speedPerWave: 5, size: 15, score: 10, baseHp: 1, hpPerWave: 0 },
    scout: { color: '#00ffff', baseSpeed: 100, speedPerWave: 10, size: 12, score: 20, baseHp: 1, hpPerWave: 0 },
    tank:  { color: '#ff3333', baseSpeed: 30, speedPerWave: 3, size: 25, score: 50, baseHp: 3, hpPerWave: 0.33 },
  },
  powerups: {
    dropChance: 0.15,
    duration: 10, // shield/multiplier/rapid_fire
    freezeDuration: 8,
    slowMoDuration: 12,
    slowMoFactor: 0.4,
    life: 8, // time on ground
    spikeBurstTargets: 8,
    types: [
      { type: 'shield', color: '#00ccff', icon: 'S', collection: 'click', weight: 24 },
      { type: 'multiplier', color: '#ffffff', icon: '2X', collection: 'hover', weight: 20 },
      { type: 'rapid_fire', color: '#ffcc00', icon: 'RF', collection: 'hover', weight: 20 },
      { type: 'slow_mo', color: '#9966ff', icon: 'SM', collection: 'hover', weight: 16 },
      { type: 'freeze', color: '#66ccff', icon: 'FR', collection: 'hover', weight: 12 },
      { type: 'spike_burst', color: '#ff00ff', icon: 'SB', collection: 'click', weight: 10 },
      { type: 'nuke', color: '#ff3333', icon: 'X', collection: 'click', weight: 6 }
    ]
  },
  waves: {
    baseBugs: 10,
    bugsPerWave: 5,
    baseSpawnRate: 1.5,
    spawnRateReduction: 0.1,
    minSpawnRate: 0.1,
  }
};
