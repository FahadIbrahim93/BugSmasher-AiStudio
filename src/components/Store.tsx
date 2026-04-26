import { useState } from 'react';
import { ShoppingBag, Lock, Check, X, Diamond, Award } from 'lucide-react';
import { COSMETICS, cosmeticsManager } from '../game/CosmeticsManager';
import { saveManager } from '../game/SaveManager';

interface StoreProps {
  onClose: () => void;
  onPurchase?: (skinId: string) => void;
}

export function Store({ onClose, onPurchase }: StoreProps) {
  const [activeTab, setActiveTab] = useState<'core' | 'bug' | 'trail' | 'ui'>('core');
  const [filterRarity, setFilterRarity] = useState<string>('all');
  
  const tabs = [
    { id: 'core', label: 'Cores' },
    { id: 'bug', label: 'Bugs' },
    { id: 'trail', label: 'Trails' },
    { id: 'ui', label: 'UI' },
  ] as const;

  const rarityColors = {
    common: 'text-zinc-400 border-zinc-600',
    uncommon: 'text-green-400 border-green-600',
    rare: 'text-blue-400 border-blue-600',
    epic: 'text-purple-400 border-purple-600',
    legendary: 'text-amber-400 border-amber-600',
  };

  const filterCosmetics = (type: string) => {
    return COSMETICS.filter(c => c.type === type).filter(c => 
      filterRarity === 'all' || c.rarity === filterRarity
    );
  };

  const handlePurchase = (skinId: string) => {
    const skin = COSMETICS.find(s => s.id === skinId);
    if (!skin) return;
    
    const points = saveManager.getPrestigePoints();
    if (points >= skin.price) {
      cosmeticsManager.purchase(skinId);
      onPurchase?.(skinId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Cosmetics Store</h2>
          </div>
          <div className="flex items-center gap-2">
            <Diamond className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-mono text-sm">{saveManager.getPrestigePoints()}</span>
            <button onClick={onClose} className="ml-2 text-zinc-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex border-b border-white/5">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-xs font-mono uppercase tracking-wider transition-colors ${
                activeTab === tab.id 
                  ? 'text-cyan-400 border-b-2 border-cyan-400 bg-white/5' 
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 flex overflow-x-auto gap-2">
          {['all', 'common', 'uncommon', 'rare', 'epic', 'legendary'].map(r => (
            <button
              key={r}
              onClick={() => setFilterRarity(r)}
              className={`px-2 py-1 rounded-full text-[10px] font-mono uppercase whitespace-nowrap transition-colors ${
                filterRarity === r 
                  ? 'bg-white text-black' 
                  : 'bg-black text-zinc-500 hover:text-white border border-white/10'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 pt-0">
          <div className="grid grid-cols-3 gap-3">
            {filterCosmetics(activeTab).map(skin => {
              const isOwned = cosmeticsManager.isOwned(skin.id);
              const isEquipped = cosmeticsManager.getEquipped(activeTab) === skin.id;
              const canAfford = saveManager.getPrestigePoints() >= skin.price;
              
              return (
                <div
                  key={skin.id}
                  className={`relative p-3 rounded-lg border transition-all ${
                    isEquipped 
                      ? 'border-cyan-500/50 bg-cyan-500/10' 
                      : isOwned 
                      ? 'border-white/10 bg-black/30 hover:border-white/20' 
                      : 'border-white/5 bg-black/10'
                  }`}
                >
                  <button
                    onClick={() => isOwned && cosmeticsManager.equip(skin.id)}
                    disabled={!isOwned}
                    className="w-full"
                  >
                    <div 
                      className="w-8 h-8 mx-auto rounded-full mb-2"
                      style={{ 
                        backgroundColor: skin.color,
                        boxShadow: skin.glowColor ? `0 0 12px ${skin.glowColor}` : 'none'
                      }}
                    />
                    <div className="text-xs font-medium text-white truncate">{skin.name}</div>
                    <div className={`text-[10px] font-mono ${rarityColors[skin.rarity]}`}>
                      {skin.rarity}
                    </div>
                    
                    {isOwned && (
                      <div className="mt-2">
                        {isEquipped ? (
                          <div className="flex items-center justify-center gap-1 text-xs text-cyan-400">
                            <Check className="w-3 h-3" />
                            Equipped
                          </div>
                        ) : (
                          <button className="text-xs text-zinc-400 hover:text-white">
                            Equip
                          </button>
                        )}
                      </div>
                    )}
                    
                    {!isOwned && (
                      <div className="mt-2 flex items-center justify-center gap-1">
                        {canAfford ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handlePurchase(skin.id); }}
                            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                          >
                            <Diamond className="w-3 h-3" />
                            {skin.price}
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-zinc-600">
                            <Lock className="w-3 h-3" />
                            {skin.price}
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StoreButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 rounded-full text-xs font-mono uppercase tracking-widest transition-colors"
    >
      <ShoppingBag className="w-4 h-4" />
      Store
    </button>
  );
}