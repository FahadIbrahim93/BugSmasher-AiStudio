import { Lock, Unlock } from 'lucide-react';
import { BIOMES } from '../game/BiomeConfig';
import { biomeManager } from '../game/BiomeManager';
import { saveManager } from '../game/SaveManager';

interface BiomeSelectorProps {
  onSelectBiome: (biomeId: string) => void;
  currentBiomeId: string;
}

export function BiomeSelector({ onSelectBiome, currentBiomeId }: BiomeSelectorProps) {
  const current = biomeManager.getCurrentBiome();

  return (
    <div className="bg-zinc-900/80 backdrop-blur-sm rounded-xl p-4 border border-white/5">
      <h3 className="text-xs text-zinc-500 uppercase tracking-widest font-mono mb-3">Biomes</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {BIOMES.map((biome) => {
          const isUnlocked = biomeManager.isUnlocked(biome.id);
          const req = biome.unlockRequirement;
          
          return (
            <button
              key={biome.id}
              onClick={() => isUnlocked && onSelectBiome(biome.id)}
              disabled={!isUnlocked}
              className={`relative p-3 rounded-lg border transition-all ${
                biome.id === currentBiomeId
                  ? 'border-white/30 bg-white/10'
                  : isUnlocked
                  ? 'border-white/10 hover:border-white/20 bg-black/20'
                  : 'border-white/5 bg-black/10 opacity-50'
              }`}
            >
              <div className="flex items-center justify-center mb-1">
                {isUnlocked ? (
                  <Unlock className="w-4 h-4" style={{ color: biome.theme.coreColor }} />
                ) : (
                  <Lock className="w-4 h-4 text-zinc-600" />
                )}
              </div>
              <div className="text-xs font-medium" style={{ color: isUnlocked ? biome.theme.coreColor : 'inherit' }}>
                {biome.name}
              </div>
              <div className="text-[10px] text-zinc-600 mt-0.5">
                {isUnlocked ? (
                  <span style={{ color: biome.theme.coreColor }}>x{biome.difficulty} EXP</span>
                ) : (
                  <span>
                    {req.wavesCompleted && `W${req.wavesCompleted}`}
                    {req.scoreRequired && ` ${req.scoreRequired / 1000}k`}
                    {req.prestigeLevel && ` P${req.prestigeLevel}`}
                  </span>
                )}
              </div>
              {biome.id === currentBiomeId && (
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BiomeSelectButton({ 
  currentBiome, 
  onClick 
}: { 
  currentBiome: string; 
  onClick: () => void;
}) {
  const biome = biomeManager.getBiomeById(currentBiome);
  if (!biome) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center space-x-2 bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 transition-colors"
    >
      <div 
        className="w-3 h-3 rounded-full" 
        style={{ 
          backgroundColor: biome.theme.coreColor,
          boxShadow: `0 0 8px ${biome.theme.coreGlow}`
        }} 
      />
      <span className="text-xs text-zinc-400 font-medium">{biome.name}</span>
    </button>
  );
}