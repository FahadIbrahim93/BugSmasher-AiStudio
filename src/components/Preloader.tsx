import { useEffect, useState } from 'react';
import { assetManager } from '../game/AssetManager';
import { Bug } from 'lucide-react';

export function Preloader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [readouts, setReadouts] = useState<string[]>([]);
  
  const strings = [
    "INITIATING PROJECT NEXUS...",
    "HANDSHAKE WITH CORE... OK",
    "DECRYPTING SECTOR 7 DATA...",
    "CALIBRATING OPTIC NEURAL SENSORS...",
    "MOUNTING QUANTUM VOLUMES...",
    "SUPPRESSING EMOTIONAL SUBROUTINES...",
    "READY TO CONNECT."
  ];

  useEffect(() => {
    let mounted = true;
    
    const interval = setInterval(() => {
        if (!mounted) return;
        setReadouts(prev => {
            const nextIdx = prev.length;
            if (nextIdx < strings.length) return [...prev, strings[nextIdx]];
            return prev;
        });
    }, 400);

    void assetManager.preloadAll((p) => {
      if (mounted) setProgress(p);
    }).then(() => {
      if (mounted) {
        setTimeout(() => {
          onComplete();
        }, 1500); 
      }
    });

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [onComplete]);

  return (
    <div className="relative flex flex-col items-center justify-center h-full bg-[#030303] text-white font-mono overflow-hidden">
      {/* Cinematic High-Fidelity Background Backdrop */}
      <div className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none">
        <img 
          src="/src/assets/images/game_lobby_background_1780523376207.png" 
          alt="Game Lobby Background" 
          className="w-full h-full object-cover opacity-15 scale-105 filter saturate-125 contrast-125"
          referrerPolicy="no-referrer"
        />
        {/* Soft dark vignette overlays for extreme text visibility and contrast */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#030303]/90 to-[#030303]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030303]/50 via-transparent to-[#030303]" />
        
        {/* Ambient particle dots */}
        <div className="absolute inset-0 opacity-15" style={{
          backgroundImage: 'radial-gradient(1px 1px at 20% 40%, rgba(255,255,255,0.4), transparent), radial-gradient(1px 1px at 50% 70%, rgba(255,255,255,0.3), transparent), radial-gradient(2px 2px at 80% 20%, rgba(52,211,153,0.3), transparent)',
          backgroundSize: '150px 150px'
        }} />
      </div>
      
      <div className="absolute inset-0 opacity-10 pointer-events-none z-10">
        <div className="w-full h-full bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
      </div>
      
      <div className="z-10 flex flex-col items-center max-w-md w-full px-8">
        <div className="w-16 h-16 rounded-full border border-emerald-500/20 flex items-center justify-center mb-12 animate-pulse" style={{animationDuration: '2s'}}>
          <Bug className="w-8 h-8 text-emerald-400" />
        </div>
        
        <div className="w-full space-y-1 mb-8 overflow-hidden h-32">
            {readouts.map((r, i) => (
                <div key={i} className="text-[10px] text-zinc-500 uppercase tracking-tighter opacity-70" style={{animation: 'slideUp 0.3s ease-out'}}>
                    <span className="text-emerald-700 mr-2">[{new Date().toISOString().split('T')[1].split('.')[0]}]</span> {r}
                </div>
            ))}
        </div>

        <div className="w-full h-[2px] bg-zinc-800/50 rounded-full relative mb-4 overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.4)] transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
        </div>
        
        <div className="flex justify-between w-full text-[9px] text-zinc-600 uppercase tracking-widest font-black">
          <span className="text-emerald-500/60">Uplink Established</span>
          <span className="text-emerald-400/80">{progress}%</span>
        </div>
      </div>
    </div>
  );
}
