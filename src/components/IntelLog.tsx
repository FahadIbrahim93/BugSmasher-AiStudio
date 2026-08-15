import { motion } from 'motion/react';
import { Bug, Shield, Activity, Info } from 'lucide-react';
import { GameConfig } from '../game/GameConfig';

export default function IntelLog() {
  const bossIntel = GameConfig.bugs.boss.variants || [];

  return (
    <motion.div
      key="log"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-grow overflow-y-auto p-6 space-y-8 custom-scrollbar min-h-0"
    >
      {/* Boss Section */}
      <section>
        <h3 className="text-xl font-bold text-red-500 mb-4 border-l-4 border-red-500 pl-3 uppercase tracking-tighter">
          Class-V Apex Predators (Bosses)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {bossIntel.map((boss) => (
            <div key={boss.id} className="p-4 bg-red-950/20 border border-red-500/30 rounded-lg relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-20 transition-opacity">
                <Bug size={80} />
              </div>
              <h4 className="text-lg font-bold text-red-400 mb-2">{boss.name}</h4>
              <div className="space-y-2 text-sm text-red-200/70">
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-red-500" />
                  <span>Ability: {boss.logic === 'spider' ? 'Web Snare' : boss.logic === 'moth' ? 'Psionic Distortion' : 'Mandible Armor'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-red-500" />
                  <span>Threat Level: EXTREME</span>
                </div>
                <p className="mt-4 text-xs italic opacity-60">
                  {boss.id === 'arachne' && "A multi-limbed nightmare that restricts tactical movement with high-tensile polymer webs."}
                  {boss.id === 'moth' && "Exhibits quantum phase-shifting and neural interference, distorting core targeting systems."}
                  {boss.id === 'mandible' && "Possesses heavily reinforced chitin plating. Vulnerable only during aggressive outreach."}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-red-500/20 flex justify-between items-center text-[10px] font-mono uppercase">
                <span>Scan Status</span>
                <span className="text-red-500 animate-pulse">Analyzing...</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Regular Bugs */}
      <section>
        <h3 className="text-xl font-bold text-rose-500 mb-4 border-l-4 border-rose-500 pl-3 uppercase tracking-tighter">
          Standard Infestation Log
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(GameConfig.bugs).filter(([k]) => k !== 'boss' && k !== 'mini').map(([id, conf]: [string, any]) => (
            <div key={id} className="p-3 bg-rose-950/20 border border-rose-500/20 rounded hover:border-rose-400 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-rose-400 uppercase">{id}</span>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: conf.color }} />
              </div>
              <div className="text-[10px] space-y-1 opacity-70">
                <div>HP: {conf.baseHp} +{conf.hpPerWave}/W</div>
                <div>SPD: {conf.baseSpeed}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Biome Data */}
      <section>
        <h3 className="text-xl font-bold text-purple-500 mb-4 border-l-4 border-purple-500 pl-3 uppercase tracking-tighter">
          Biome Archetypes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(GameConfig.biomes).map(([id, b]) => (
            <div key={id} className="p-3 bg-purple-950/20 border border-purple-500/20 rounded flex gap-4 items-start">
              <div className="p-2 bg-black/40 rounded">
                <Info size={16} className="text-purple-400" />
              </div>
              <div>
                <h5 className="font-bold text-purple-300 uppercase text-xs tracking-widest">{b.name}</h5>
                <p className="text-[10px] text-purple-200/60 mt-1">
                  {id === 'quantum_void' ? 'Anomalous teleportation active.' : id === 'ember_depths' ? 'Extreme thermal stress detected.' : 'Atmospheric conditions regulated.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
