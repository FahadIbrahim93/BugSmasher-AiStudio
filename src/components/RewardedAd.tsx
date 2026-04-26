import { useState, useEffect, useCallback } from 'react';
import { Play, Gift, X } from 'lucide-react';
import { adManager } from '../game/AdManager';

interface RewardedAdButtonProps {
  onRewardEarned?: (amount: number) => void;
  disabled?: boolean;
}

export function RewardedAdButton({ onRewardEarned, disabled }: RewardedAdButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);

  useEffect(() => {
    adManager.setCallbacks({
      onAdLoaded: () => setIsLoading(false),
      onAdFailed: () => setIsLoading(false),
      onRewardEarned: (amount) => {
        setRewardAmount(amount);
        setShowReward(true);
        onRewardEarned?.(amount);
      }
    });
  }, [onRewardEarned]);

  const handleClick = useCallback(async () => {
    setIsLoading(true);
    await adManager.showAd();
  }, []);

  if (showReward) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-zinc-900 border border-green-500/30 rounded-2xl p-6 text-center animate-in fade-in zoom-in duration-300">
          <Gift className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-green-400 font-bold text-lg">Reward Earned!</p>
          <p className="text-green-300 text-2xl font-mono mt-2">+{rewardAmount}</p>
          <button
            onClick={() => setShowReward(false)}
            className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-full text-sm font-medium"
          >
            Claim
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 rounded-full text-xs font-mono uppercase tracking-widest transition-colors disabled:opacity-50"
    >
      {isLoading ? (
        <span className="animate-pulse">Loading...</span>
      ) : (
        <>
          <Gift className="w-4 h-4" />
          Watch Ad
        </>
      )}
    </button>
  );
}

export function AdBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-zinc-900/90 backdrop-blur-sm rounded-lg p-2 border border-zinc-800 flex items-center gap-3 shadow-lg">
        <span className="text-xs text-zinc-500">Advertisement</span>
        <button className="text-zinc-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}