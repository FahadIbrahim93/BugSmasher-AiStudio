import { useEffect, useState } from 'react';
import { Wrench, Zap, Cpu } from 'lucide-react';
import { soundManager } from '../game/SoundManager';
import { progressionManager } from '../game/ProgressionManager';
import type { GameEngine } from '../game/GameEngine';

export function ConsumableBar({ engineRef }: { engineRef: React.RefObject<GameEngine | null> }) {
    const [counts, setCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        return progressionManager.subscribe(() => {
            setCounts(progressionManager.getData().consumables);
        });
    }, []);

    const handleUse = (id: string) => {
        const engine = engineRef.current;
        if (engine && engine.consumeConsumable(id)) {
            // Sound handled by engine
        } else {
            soundManager.uiError();
        }
    };

    const consumables = [
        { id: 'repair_kit', icon: <Wrench className="w-4 h-4" />, label: 'Repair', desc: 'INSTANT INTEGRITY RESTORE (25%)' },
        { id: 'emp_generator', icon: <Zap className="w-4 h-4" />, label: 'EMP', desc: 'NEUTRALIZE ALL NON-BOSS THREATS' },
        { id: 'overdrive_chip', icon: <Cpu className="w-4 h-4" />, label: 'Over', desc: 'MAXIMUM DAMAGE MULTIPLIER (20S)' },
    ];

    return (
        <div className="flex space-x-2 mt-4 pointer-events-auto">
            {consumables.map(c => (
                <button
                    key={c.id}
                    onClick={() => { handleUse(c.id); }}
                    className={`relative p-3 rounded-2xl border transition-all flex flex-col items-center group ${
                        (counts[c.id] || 0) > 0
                            ? 'bg-black/80 border-white/20 hover:border-blue-500/50 hover:scale-105 active:scale-95 shadow-xl'
                            : 'bg-black/10 border-white/5 opacity-40 grayscale pointer-events-none'
                    }`}
                >
                    <div className="text-white mb-1 group-hover:text-blue-400 transition-colors">
                        {c.icon}
                    </div>

                    {/* Hover Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-blue-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                        <p className="text-[8px] font-black text-white uppercase tracking-widest">{c.desc}</p>
                    </div>

                    {(counts[c.id] || 0) > 0 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center border border-black group-hover:scale-110 transition-transform">
                            <span className="text-[8px] font-black text-white">{counts[c.id]}</span>
                        </div>
                    )}
                </button>
            ))}
        </div>
    );
}
