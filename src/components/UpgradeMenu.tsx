import React from 'react'
import { upgradeSystem } from '@/lib'

interface UpgradeMenuProps {
  onUpgrade: (_type: string) => void
  onNextWave: () => void
}

export const UpgradeMenu: React.FC<UpgradeMenuProps> = ({ onUpgrade, onNextWave }) => {
  const crystals = upgradeSystem.getCrystals()
  const allUpgrades = upgradeSystem.getAllUpgrades()

  return (
    <div className="flex flex-col items-center max-w-2xl w-full p-8 space-y-6">
      <div className="text-center border-b border-white/10 pb-4 w-full">
        <div className="text-xs text-white/30 font-mono tracking-[0.3em]">UPGRADE TERMINAL</div>
        <div className="text-lg font-mono text-white/80 mt-1 tracking-wider">{crystals} CREDITS</div>
      </div>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {allUpgrades.map(({ def, level, cost, totalBonus, isMaxed, canAfford }) => (
          <div key={def.id} className={`p-3 border ${isMaxed ? 'border-white/5' : 'border-white/10 hover:border-white/30'} transition-all`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-mono text-xs text-white/80">{def.name}</div>
                <div className="text-[10px] text-white/30">{def.description}</div>
              </div>
              <div className="text-[10px] font-mono text-white/40 border border-white/10 px-2 py-0.5">
                {isMaxed ? 'MAX' : `lvl ${level}/${def.maxLevel}`}
              </div>
            </div>
            <div className="text-[10px] text-white/20 font-mono mb-2">
              {def.unit ? `${totalBonus}${def.unit}` : `Level ${level}`}
            </div>
            {!isMaxed && (
              <button
                onClick={() => onUpgrade(def.id)}
                disabled={!canAfford}
                className={`w-full py-2 text-[10px] font-mono tracking-widest border transition-all ${
                  canAfford ? 'border-white/30 hover:border-white/60 text-white/60' : 'border-white/5 text-white/20 opacity-50'
                }`}
              >
                {cost} CREDITS
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={onNextWave}
        className="w-full py-4 border border-white/20 hover:border-white/40 text-white/80 font-mono text-sm tracking-[0.3em] transition-all"
      >
        DEPLOY NEXT WAVE
      </button>
    </div>
  )
}
