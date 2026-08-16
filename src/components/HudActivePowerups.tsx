import { useEffect, useState } from 'react';
import type { GameEngine } from '../game/GameEngine';

export function ActivePowerups({ engineRef }: { engineRef: React.RefObject<GameEngine | null> }) {
    const [activeTypes, setActiveTypes] = useState<string[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            const engine = engineRef.current;
            if (!engine) return;

            const active = [];
            if (engine.shieldTimer > 0) active.push('SHIELD_BUFFER');
            if (engine.multiplierTimer > 0) active.push('X2_UPLINK');
            if (engine.rapidFireTimer > 0) active.push('RAPID_OVERRIDE');
            if (engine.slowMoTimer > 0) active.push('TIME_DILATION');
            if (engine.overdriveTimer > 0) active.push('TURRET_OVERDRIVE');

            setActiveTypes(active);
        }, 100);
        return () => { clearInterval(interval); };
    }, [engineRef]);

    if (activeTypes.length === 0) return null;

    return (
        <div className="flex flex-col items-end space-y-1">
            {activeTypes.map(type => (
                <div key={type} className="flex items-center space-x-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full animate-pulse">
                    <span className="text-[8px] font-mono font-bold text-white tracking-widest">{type}</span>
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                </div>
            ))}
        </div>
    );
}
