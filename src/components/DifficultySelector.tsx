import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ShieldAlert, ShieldCheck, Play, Info, AlertTriangle, Gift } from 'lucide-react';
import { soundManager } from '../game/SoundManager';

interface DifficultySelectorProps {
  onSelect: (difficulty: 'training' | 'standard' | 'nightmare') => void;
}

export function DifficultySelector({ onSelect }: DifficultySelectorProps) {
  const [hoveredId, setHoveredId] = useState<'training' | 'standard' | 'nightmare' | null>(null);
  
  const options = [
    {
      id: 'training' as const,
      name: 'TRAINING SEQUENCE',
      tag: 'LOW THREAT',
      icon: Shield,
      glowColor: 'rgba(16, 185, 129, 0.45)',
      color: 'from-emerald-500/20 via-emerald-600/5 to-transparent',
      borderColor: 'border-emerald-500/30 hover:border-emerald-400 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]',
      textColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20',
      description: 'Optimized neural calibrator. Slower hazard emergence and enhanced hull structure support.',
      riskAnalysis: 'Defensive hull modules are boosted. Critical threat patterns are suppressed, minimizing hull breach probabilities.',
      rewardAnalysis: 'Progression credits and scrap generation rates are modulated by 0.7x due to reduced threat index.',
      stats: [
        { label: 'SPAWN INTERVAL', value: '1.5x Slower', active: 'better' },
        { label: 'BUG QUANTITY', value: '70% Density', active: 'better' },
        { label: 'CORE INTEGRITY', value: '200% Capacity', active: 'better' },
      ]
    },
    {
      id: 'standard' as const,
      name: 'STANDARD DIAGNOSTIC',
      tag: 'STABLE THREAT',
      icon: ShieldCheck,
      glowColor: 'rgba(6, 182, 212, 0.45)',
      color: 'from-cyan-500/20 via-cyan-600/5 to-transparent',
      borderColor: 'border-cyan-500/30 hover:border-cyan-400 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]',
      textColor: 'text-cyan-400',
      badgeBg: 'bg-cyan-950/40 text-cyan-400 border-cyan-500/20',
      description: 'The standard baseline environment. Normal wave scaling, click multipliers, and resource drop rates.',
      riskAnalysis: 'Adaptive DDA algorithm regulates sector parameters in real-time, responding dynamically to user APM.',
      rewardAnalysis: 'Standard baseline progression yield active. Fully qualifies for all historical log unlocked events.',
      stats: [
        { label: 'SPAWN INTERVAL', value: '1.0x Baseline', active: 'neutral' },
        { label: 'BUG QUANTITY', value: '100% Density', active: 'neutral' },
        { label: 'CORE INTEGRITY', value: '100% standard', active: 'neutral' },
      ]
    },
    {
      id: 'nightmare' as const,
      name: 'NIGHTMARE OVERLOAD',
      tag: 'EXTREME ANOMALY',
      icon: ShieldAlert,
      glowColor: 'rgba(244, 63, 94, 0.45)',
      color: 'from-rose-500/20 via-rose-600/5 to-transparent',
      borderColor: 'border-rose-500/30 hover:border-rose-400 group-hover:shadow-[0_0_20px_rgba(244,63,94,0.3)]',
      textColor: 'text-rose-400',
      badgeBg: 'bg-rose-950/40 text-rose-400 border-rose-500/20',
      description: 'Hostile takeover simulation. Overwhelming swarm acceleration and reduced core durability metrics.',
      riskAnalysis: 'Accelerated spawn timelines allow bugs to rapidly swarm the neural sector. Critical core integrity is at high threat.',
      rewardAnalysis: 'Scrap rewards are amplified by 1.5x. Unique nightmare-class neural data elements are enabled.',
      stats: [
        { label: 'SPAWN INTERVAL', value: '0.6x Accelerated', active: 'dangerous' },
        { label: 'BUG QUANTITY', value: '140% Crowded', active: 'dangerous' },
        { label: 'CORE INTEGRITY', value: '50% Critical', active: 'dangerous' },
      ]
    }
  ];

  const handleSelect = (difficulty: 'training' | 'standard' | 'nightmare') => {
    soundManager.uiClick();
    onSelect(difficulty);
  };

  const handleHover = (id: 'training' | 'standard' | 'nightmare') => {
    soundManager.uiHover();
    setHoveredId(id);
  };

  const handleMouseLeave = () => {
    setHoveredId(null);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
      {/* Visual cyber mesh net background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.45)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-5xl bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 relative shadow-[0_0_50px_rgba(0,0,0,0.8)] font-mono overflow-hidden"
      >
        {/* Dynamic decorative line */}
        <div className="absolute -top-[10%] left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent blur-sm animate-pulse" />

        {/* Header section */}
        <div className="text-center mb-6 sm:mb-8 relative">
          <div className="inline-flex items-center space-x-1 px-3 py-1 bg-zinc-900 border border-white/5 rounded-full text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">
            <Info className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>DIAGNOSTIC SYSTEM INITIATION</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white uppercase leading-none mb-2">
            SELECT SECTOR PRIORITY
          </h1>
          <p className="text-xs text-zinc-400 max-w-lg mx-auto">
            Choose cognitive difficulty parameter thread. Sector configurations directly scale anomaly health metrics and hardware parameters.
          </p>
        </div>

        {/* Difficulty Matrix Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {options.map((opt, idx) => {
            const Icon = opt.icon;
            const isHovered = hoveredId === opt.id;
            return (
              <motion.div
                key={opt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.12, duration: 0.5 }}
                className="group relative flex flex-col h-full"
                onMouseEnter={() => handleHover(opt.id)}
                onMouseLeave={handleMouseLeave}
              >
                {/* Background glow wave matching theme style */}
                <div 
                  className={`absolute inset-0 bg-gradient-to-b ${opt.color} rounded-2xl opacity-30 transition-opacity duration-300 pointer-events-none ${isHovered ? 'opacity-60' : ''}`} 
                />

                {/* Cybernetic active glowing borders */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      layoutId="cardActiveGlow"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset--0.5 rounded-2xl blur pointer-events-none z-0"
                      style={{
                        background: `linear-gradient(215deg, ${opt.glowColor} 0%, transparent 100%)`,
                        boxShadow: `0 0 25px ${opt.glowColor}`
                      }}
                    />
                  )}
                </AnimatePresence>

                <button
                  onClick={() => handleSelect(opt.id)}
                  className={`w-full text-left bg-zinc-900/60 border-2 ${opt.borderColor} rounded-2xl p-5 relative overflow-hidden transition-all duration-300 flex flex-col h-full hover:-translate-y-1 z-10`}
                >
                  {/* Category Card Header */}
                  <div className="flex justify-between items-start mb-4 z-10 w-full">
                    <div className={`p-2 bg-black/50 rounded-xl border border-white/5 ${opt.textColor}`}>
                      <Icon className="w-5 h-5" strokeWidth={2.5} />
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-[8px] font-black border uppercase tracking-widest ${opt.badgeBg}`}>
                      {opt.tag}
                    </span>
                  </div>

                  {/* Descriptions */}
                  <div className="mb-5 z-10">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">
                      {opt.name}
                    </h3>
                    <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                      {opt.description}
                    </p>
                  </div>

                  {/* Configured metrics panel */}
                  <div className="space-y-2 mt-auto border-t border-white/5 pt-4 z-10 w-full text-[10px]">
                    {opt.stats.map((stat, statIdx) => (
                      <div key={statIdx} className="flex justify-between items-center">
                        <span className="text-zinc-500 font-bold tracking-wider">{stat.label}</span>
                        <span className={`font-mono font-bold ${
                          stat.active === 'better' ? 'text-emerald-400' :
                          stat.active === 'dangerous' ? 'text-rose-400' : 'text-zinc-300'
                        }`}>
                          {stat.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Interactive Embedded Tooltip Section - Risk/Reward Profile analysis details show on hover with glitchy transition */}
                  <div className="relative mt-4 w-full overflow-hidden transition-all duration-300">
                    <AnimatePresence initial={false}>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: 10 }}
                          animate={{ opacity: 1, height: 'auto', y: 0 }}
                          exit={{ opacity: 0, height: 0, y: 10 }}
                          transition={{ duration: 0.25, ease: 'easeOut' }}
                          className="pt-3 border-t border-white/5 text-[9px] text-zinc-400 space-y-2 bg-black/20 p-2.5 rounded-xl border border-white/5"
                        >
                          <div className="flex items-start space-x-1.5">
                            <AlertTriangle className={`w-3.5 h-3.5 min-w-[14px] ${opt.textColor}`} />
                            <div>
                              <span className="font-bold uppercase block tracking-wider text-zinc-300">SYSTEM RISK PROFILE</span>
                              <span className="font-sans leading-tight text-zinc-400 text-[10px]">{opt.riskAnalysis}</span>
                            </div>
                          </div>
                          <div className="flex items-start space-x-1.5">
                            <Gift className="w-3.5 h-3.5 min-w-[14px] text-amber-400" />
                            <div>
                              <span className="font-bold text-amber-400 uppercase block tracking-wider">SYSTEM REWARD PROFILE</span>
                              <span className="font-sans leading-tight text-zinc-400 text-[10px]">{opt.rewardAnalysis}</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Action Launch Indicator */}
                  <div className="mt-4 w-full flex items-center justify-between text-[11px] font-bold text-white uppercase tracking-widest bg-black/45 group-hover:bg-black/65 transition-colors p-3 rounded-xl border border-white/5 z-10 group-hover:text-cyan-400 group-hover:border-cyan-500/40">
                    <span>LAUNCH SIMULATOR</span>
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
