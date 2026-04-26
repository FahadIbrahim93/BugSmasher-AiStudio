import { Crown, Lock, Check, X, Sparkles, Heart, Zap, Gem, Rocket, Ban } from 'lucide-react';
import { PREMIUM_PERKS, premiumManager } from '../game/PremiumManager';

interface PremiumStoreProps {
  onClose: () => void;
  onPurchase: () => void;
}

const PERK_ICONS: Record<string, React.ElementType> = {
  no_ads: Ban,
  extra_lives: Heart,
  double_points: Zap,
  exclusive_skins: Gem,
  early_access: Rocket,
};

export function PremiumStore({ onClose, onPurchase }: PremiumStoreProps) {
  const perks = premiumManager.getPerks();
  const isPremium = premiumManager.isPremium();

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-amber-900/20 to-zinc-900 border border-amber-500/30 rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <Crown className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-lg font-bold text-white">BugSmasher Premium</h2>
              <p className="text-xs text-amber-400/70">Unlock the full experience</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {isPremium ? (
            <div className="text-center py-8">
              <Crown className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">You're Premium!</h3>
              <p className="text-sm text-zinc-400">
                Purchased on {new Date(premiumManager.getPurchaseDate()!).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <>
              <div className="bg-black/30 rounded-xl p-4 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-400">ALL ACCESS PASS</span>
                </div>
                <p className="text-xs text-zinc-400 mb-4">
                  Remove ads, get double points, exclusive skins, and more!
                </p>
                <button
                  onClick={onPurchase}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold rounded-lg flex items-center justify-center gap-2"
                >
                  <Crown className="w-4 h-4" />
                  Upgrade for $4.99
                </button>
              </div>

              <div className="space-y-2">
                {perks.map(perk => {
                  const Icon = PERK_ICONS[perk.id] || Sparkles;
                  return (
                    <div
                      key={perk.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-black/20 border border-white/5"
                    >
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{perk.name}</div>
                        <div className="text-xs text-zinc-500">{perk.description}</div>
                      </div>
                      {perk.unlocked && (
                        <Check className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-amber-500/10 text-center">
          <p className="text-[10px] text-zinc-600">
            One-time purchase • No subscription • Instant unlock
          </p>
        </div>
      </div>
    </div>
  );
}

export function PremiumBadge() {
  if (!premiumManager.isPremium()) return null;

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 rounded-full border border-amber-500/30">
      <Crown className="w-3 h-3 text-amber-400" />
      <span className="text-[10px] font-bold text-amber-400">PREMIUM</span>
    </div>
  );
}