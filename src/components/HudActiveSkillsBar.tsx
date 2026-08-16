import { useEffect, useState } from 'react';
import { progressionManager } from '../game/ProgressionManager';

export function ActiveSkillsBar({ engineRef }: { engineRef: React.RefObject<any> }) {
  const [skills, setSkills] = useState<{ id: string; name: string; icon: string; key: string; cooldown: number; active: number; color: string; desc: string; }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const engine = engineRef.current;
      if (!engine) return;

      const items = [];
      const bioshieldLvl = progressionManager.getSkillLevel('nanite_bioshield');
      const overdriveLvl = progressionManager.getSkillLevel('turret_overdrive');
      const chronoLvl = progressionManager.getSkillLevel('chrono_emp_shatter');

      if (bioshieldLvl > 0) {
        items.push({
          id: 'nanite_bioshield',
          name: 'Bio-Shield',
          icon: '🛡️',
          key: '1',
          cooldown: engine.bioshieldCooldown || 0,
          active: engine.bioshieldActiveTime || 0,
          color: 'from-emerald-500 to-teal-500 border-emerald-500/30',
          desc: 'HEALS 25 HP & GRANTS 4S IMMUNITY'
        });
      }
      if (overdriveLvl > 0) {
        items.push({
          id: 'turret_overdrive',
          name: 'Overdrive',
          icon: '⚔️',
          key: '2',
          cooldown: engine.overdriveCooldown || 0,
          active: engine.overdriveActiveTime || 0,
          color: 'from-amber-500 to-orange-500 border-amber-500/30',
          desc: 'OVERCLOCKS AUTO-TURRETS SPEED FOR 8S'
        });
      }
      if (chronoLvl > 0) {
        items.push({
          id: 'chrono_emp_shatter',
          name: 'Chrono EMP',
          icon: '🔮',
          key: '3',
          cooldown: engine.empShatterCooldown || 0,
          active: engine.empShatterActiveTime || 0,
          color: 'from-purple-500 to-indigo-500 border-purple-500/30',
          desc: 'FREEZES BUGS & DECAYS 30% HEALTH'
        });
      }

      setSkills(items);
    }, 100);

    return () => { clearInterval(interval); };
  }, [engineRef]);

  // Handle hotkeys (keyboard triggering)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine?.isRunning || engine.isPaused) return;

      if (e.key === '1') {
        engine.triggerActiveAbility('nanite_bioshield');
      } else if (e.key === '2') {
        engine.triggerActiveAbility('turret_overdrive');
      } else if (e.key === '3') {
        engine.triggerActiveAbility('chrono_emp_shatter');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); };
  }, [engineRef]);

  const handleTrigger = (id: string) => {
    const engine = engineRef.current;
    if (engine) {
      engine.triggerActiveAbility(id);
    }
  };

  if (skills.length === 0) return null;

  return (
    <div className="flex space-x-2 mt-4 pointer-events-auto">
      {skills.map(s => {
        const isCooldown = s.cooldown > 0;
        const isActive = s.active > 0;

        return (
          <button
            key={s.id}
            onClick={() => { handleTrigger(s.id); }}
            disabled={isCooldown}
            className={`relative p-3 rounded-2xl border transition-all flex flex-col items-center group select-none ${
              isActive
                ? 'bg-gradient-to-br ' + s.color + ' border-white/40 scale-105 animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                : isCooldown
                ? 'bg-black/80 border-white/5 opacity-50 cursor-not-allowed'
                : 'bg-black/80 border-white/25 hover:border-white/50 hover:scale-105 active:scale-95 shadow-xl'
            }`}
          >
            <div className="text-white mb-1 group-hover:text-blue-400 transition-colors text-base">
              {s.icon}
            </div>

            <p className="text-[7px] font-black text-zinc-400 group-hover:text-white uppercase tracking-widest font-mono">
              {s.name}
            </p>

            {/* Hotkey circle badge */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-800 rounded-full border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-[8px] font-extrabold text-white font-mono">{s.key}</span>
            </div>

            {isCooldown && (
              <div className="absolute inset-0 bg-black/80 rounded-2xl flex items-center justify-center font-mono text-[9px] font-black text-rose-400">
                {Math.ceil(s.cooldown)}s
              </div>
            )}

            {isActive && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-1 bg-white text-black font-mono text-[5px] font-black rounded border border-black uppercase animate-bounce whitespace-nowrap">
                ACTIVE
              </div>
            )}

            {/* Hover Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-zinc-950 border border-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-2xl">
              <p className="text-[8px] font-black text-white uppercase tracking-widest">{s.desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
