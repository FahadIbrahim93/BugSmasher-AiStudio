import { useEffect, useState } from 'react';
import { assetManager } from '../game/AssetManager';
import { Bug } from 'lucide-react';

export function Preloader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let mounted = true;
    
    assetManager.preloadAll((p) => {
      if (mounted) setProgress(p);
    }).then(() => {
      if (mounted) {
        // Small delay to make the loading screen satisfying
        setTimeout(() => {
          onComplete();
        }, 500); 
      }
    });

    return () => {
      mounted = false;
    };
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-zinc-950 text-white">
      <Bug className="w-16 h-16 text-blue-500 animate-pulse mb-8" />
      <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-300 ease-out" 
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-4 text-zinc-500 font-mono text-sm uppercase tracking-widest">
        Loading Assets {progress}%
      </div>
    </div>
  );
}
