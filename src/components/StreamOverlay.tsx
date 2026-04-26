import { Tv, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface StreamOverlayProps {
  score: number;
  wave: number;
  kills: number;
  combo: number;
  isPaused?: boolean;
}

export function StreamOverlay({ score, wave, kills, combo, isPaused }: StreamOverlayProps) {
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('stream') === 'true') {
      setShowInfo(true);
    }
  }, []);

  if (!showInfo) return null;

  return (
    <div className="fixed top-4 left-4 z-50 flex flex-col gap-2 pointer-events-none">
      {/* Stream Info Bar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-black/80 backdrop-blur-sm rounded-lg border border-purple-500/30">
        <Tv className="w-4 h-4 text-purple-400 animate-pulse" />
        <span className="text-xs font-medium text-purple-400">LIVE</span>
        {isPaused && (
          <span className="text-xs text-yellow-400 px-2 py-0.5 bg-yellow-400/20 rounded">
            PAUSED
          </span>
        )}
      </div>

      {/* Game Stats for Streamers */}
      <div className="flex gap-2">
        {[
          { label: 'SCORE', value: score.toLocaleString(), color: 'text-white' },
          { label: 'WAVE', value: wave, color: 'text-cyan-400' },
          { label: 'KILLS', value: kills, color: 'text-green-400' },
          { label: 'COMBO', value: `x${combo}`, color: combo >= 5 ? 'text-yellow-400' : 'text-zinc-400' },
        ].map(stat => (
          <div 
            key={stat.label}
            className="px-3 py-1 bg-black/80 backdrop-blur-sm rounded border border-white/10"
          >
            <div className="text-[10px] text-zinc-500 uppercase">{stat.label}</div>
            <div className={`text-sm font-mono font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Tips for Streamers */}
      <div className="flex items-start gap-2 px-3 py-2 bg-purple-500/10 rounded-lg border border-purple-500/20 max-w-[200px]">
        <AlertCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
        <div className="text-[10px] text-purple-300">
          <p>Add "?stream=true" to URL for overlay</p>
          <p className="text-purple-400/70 mt-1">Share button shows your referral link!</p>
        </div>
      </div>
    </div>
  );
}

export function StreamReadyBadge() {
  return (
    <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full border border-purple-500/20">
        <Tv className="w-3 h-3 text-purple-400" />
        <span className="text-[10px] text-zinc-400">Stream mode: Add ?stream=true</span>
      </div>
    </div>
  );
}