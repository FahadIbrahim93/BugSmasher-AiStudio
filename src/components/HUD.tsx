import { useEffect, useRef, useState } from 'react';
import { Shield, Target, Zap, Pause, Play, Wrench, Cpu, Ghost, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundManager } from '../game/SoundManager';
import { ProgressionManager } from '../game/ProgressionManager';
import { AdsService } from '../lib/ads';
import type { EngineHandle } from '../game/EngineHandle';
import type { Particle } from '../game/ParticleSystem';
import { GameEngineStatusBus, type GameEngineStatus } from '../game/GameEngineStatusBus';
import { t } from '../i18n';
import type { TranslationKey } from '../i18n/en';

export function HUD({ engineRef, onPauseToggle, isPaused = false }: { engineRef: React.RefObject<EngineHandle>, onPauseToggle?: () => void, isPaused?: boolean }) {
  const scoreRef = useRef<HTMLSpanElement>(null);
  const waveRef = useRef<HTMLSpanElement>(null);
  const healthTextRef = useRef<HTMLSpanElement>(null);
  const healthBarRef = useRef<HTMLDivElement>(null);
  const shieldIconRef = useRef<SVGSVGElement>(null);
  const threatRef = useRef<HTMLSpanElement>(null);
  const streakRef = useRef<HTMLDivElement>(null);
  const streakCountRef = useRef<HTMLSpanElement>(null);
  
  const dashBarRef = useRef<HTMLDivElement>(null);
  const dashTextRef = useRef<HTMLSpanElement>(null);
  const dashBadgeRef = useRef<HTMLSpanElement>(null);
  const dashCircleRef = useRef<SVGCircleElement>(null);

  const waveModifierRef = useRef<HTMLSpanElement>(null);

  const [showPerf, setShowPerf] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nexus_show_perf_stats') === 'true';
    }
    return false;
  });

  const [perfData, setPerfData] = useState({
    fps: 0,
    frameTime: 0,
    bugs: 0,
    powerups: 0,
    hazards: 0,
    particles: 0,
  });

  useEffect(() => {
    const handlePerfChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setShowPerf(customEvent.detail);
    };

    window.addEventListener('nexus_perf_stats_changed', handlePerfChange);
    return () => {
      window.removeEventListener('nexus_perf_stats_changed', handlePerfChange);
    };
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    let lastScore = -1;
    let lastWave = -1;
    let lastHealth = -1;
    let lastMaxHealth = -1;

    let lastTime = performance.now();
    let frameCount = 0;
    let lastPerfUpdate = performance.now();
    let lastFrameTime = performance.now();
    let frameTimesSum = 0;
    let measuredFps = 60;

    const updateHUD = () => {
      const now = performance.now();
      const frameDt = now - lastFrameTime;
      lastFrameTime = now;
      
      frameCount++;
      frameTimesSum += frameDt;

      // Update metrics every 250ms for great readability and zero-lag performance
      if (now - lastPerfUpdate >= 250) {
        const elapsed = now - lastPerfUpdate;
        measuredFps = Math.round((frameCount * 1000) / elapsed);
        const avgFrameTime = frameTimesSum / frameCount;
        
        frameCount = 0;
        frameTimesSum = 0;
        lastPerfUpdate = now;

        if (localStorage.getItem('nexus_show_perf_stats') === 'true') {
          const engine = engineRef.current;
          if (engine) {
            const pCount = engine.particleSystem?.particles?.filter((p: Particle) => p.active)?.length || 0;
            setPerfData({
              fps: measuredFps,
              frameTime: parseFloat(avgFrameTime.toFixed(1)),
              bugs: engine.bugs?.length || 0,
              powerups: engine.powerups?.length || 0,
              hazards: engine.hazards?.length || 0,
              particles: pCount
            });
          }
        }
      }

      const engine = engineRef.current;
      if (engine) {
        if (engine.score !== lastScore && scoreRef.current) {
          scoreRef.current.textContent = engine.score.toString().padStart(6, '0');
          if (lastScore !== -1 && engine.score > lastScore) {
            soundManager.scoreTick();
          }
          lastScore = engine.score;
        }
        
        if (engine.wave !== lastWave && waveRef.current) {
          waveRef.current.textContent = t('hud.wave', { wave: engine.wave });
          lastWave = engine.wave;
        }

        // Update wave modifier display
        if (waveModifierRef.current) {
          const modifier = engine.waveModifier;
          if (modifier) {
            const modifierKey = `hud.mod${modifier.charAt(0).toUpperCase() + modifier.slice(1).replace(/_([a-z])/g, (_, c) => c.toUpperCase())}` as TranslationKey;
            const modifierLabel = t(modifierKey, {} as Record<string, string>);
            waveModifierRef.current.textContent = t('hud.modifier', { modifier: modifierLabel });
            waveModifierRef.current.classList.remove('opacity-0');
            waveModifierRef.current.classList.add('opacity-100');
          } else {
            waveModifierRef.current.classList.remove('opacity-100');
            waveModifierRef.current.classList.add('opacity-0');
          }
        }

        if (healthTextRef.current && healthBarRef.current && shieldIconRef.current && (engine.health !== lastHealth || engine.maxHealth !== lastMaxHealth)) {
          const healthPercent = Math.max(0, Math.min(100, (engine.health / engine.maxHealth) * 100));
          healthTextRef.current.textContent = Math.ceil(engine.health).toString();
          
          healthBarRef.current.style.width = `${healthPercent}%`;
          
          // Class updates for health colors
          healthBarRef.current.className = `h-full transition-all duration-300 ${healthPercent > 50 ? 'bg-white' : healthPercent > 20 ? 'bg-yellow-400' : 'bg-red-500'}`;
          shieldIconRef.current.setAttribute('class', `lucide lucide-shield w-3.5 h-3.5 sm:w-4 sm:h-4 ${healthPercent > 50 ? 'text-zinc-400' : healthPercent > 20 ? 'text-yellow-400' : 'text-red-500 animate-pulse'}`);

          lastHealth = engine.health;
          lastMaxHealth = engine.maxHealth;
        }

        // Update Threat Level
        if (threatRef.current) {
          const threat = engine.performanceFactor || 1.0;
          let label = t('hud.threatStable');
          let color = "text-zinc-500";
          if (threat > 2.0) { label = t('hud.threatExtreme'); color = "text-red-500"; }
          else if (threat > 1.6) { label = t('hud.threatHigh'); color = "text-orange-500"; }
          else if (threat > 1.3) { label = t('hud.threatElevated'); color = "text-yellow-500"; }
          
          threatRef.current.textContent = label;
          threatRef.current.className = `${color} font-mono text-[9px] uppercase tracking-widest font-black transition-colors`;
        }

        // Update Streak
        if (streakRef.current && streakCountRef.current) {
          const streak = engine.streakCount || 0;
          if (streak >= 5) {
            streakRef.current.classList.remove('opacity-0');
            streakRef.current.classList.add('opacity-100');
            streakCountRef.current.textContent = streak.toString();
          } else {
            streakRef.current.classList.remove('opacity-100');
            streakRef.current.classList.add('opacity-0');
          }
        }

        // Update Dash Cooldown Indicator
        if (dashBarRef.current && dashTextRef.current && dashBadgeRef.current) {
          const cooldown = engine.dashCooldownTimer || 0;
          const maxCooldown = engine.dashCooldown || 3.0;
          const pct = cooldown > 0 ? (1 - cooldown / maxCooldown) * 100 : 100;
          
          dashBarRef.current.style.width = `${pct}%`;
          if (cooldown > 0) {
            dashTextRef.current.textContent = `${cooldown.toFixed(1)}S`;
            dashBadgeRef.current.textContent = t('hud.dashCharging');
            dashBadgeRef.current.className = "text-yellow-500 font-mono text-[9px] uppercase tracking-widest font-black";
            dashBarRef.current.className = "h-full bg-yellow-500 transition-all duration-75";
          } else {
            dashTextRef.current.textContent = t('hud.dashReady');
            dashBadgeRef.current.textContent = t('hud.dashOnline');
            dashBadgeRef.current.className = "text-cyan-400 font-mono text-[9px] uppercase tracking-widest font-black animate-pulse";
            dashBarRef.current.className = "h-full bg-cyan-400 shadow-[0_0_8px_#00ffff]";
          }

          if (dashCircleRef.current) {
            const pctRemaining = cooldown / maxCooldown;
            const circumference = 56.55;
            // Cooldown starts at 100% full (offset = 0) and depletes as it recharges to 0% (offset = 56.55)
            const offset = circumference * (1 - pctRemaining);
            dashCircleRef.current.style.strokeDashoffset = `${offset}`;
            
            if (cooldown > 0) {
              dashCircleRef.current.style.stroke = "#eab308"; // Tailwind yellow-500
            } else {
              dashCircleRef.current.style.stroke = "#22d3ee"; // Tailwind cyan-400
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(updateHUD);
    };

    updateHUD();
    return () => cancelAnimationFrame(animationFrameId);
  }, [engineRef]);

  return (
    <div className="absolute top-0 left-0 w-full p-4 sm:p-6 flex justify-between items-start pointer-events-none z-10">
      <div className="flex flex-col space-y-2 sm:space-y-4">
        <div className="flex items-center space-x-2 sm:space-x-3 glass-panel px-4 py-2 sm:px-5 sm:py-2.5 rounded-full border border-white/10 shadow-[0_4_20px_rgba(0,0,0,0.5)]">
          <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400" />
          <span data-testid="hud-score-label" className="text-zinc-500 font-medium text-xs sm:text-sm tracking-wider uppercase">{t('hud.score')}</span>
          <span ref={scoreRef} className="text-lg sm:text-xl font-bold font-mono text-white tracking-widest pl-1 cyber-text-glow">000000</span>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-3 glass-panel px-4 py-2 sm:px-5 sm:py-2.5 rounded-full border border-white/10 shadow-[0_4_20px_rgba(0,0,0,0.5)]">
          <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400" />
          <span data-testid="hud-wave-label" ref={waveRef} className="text-sm sm:text-base font-medium font-mono text-white uppercase tracking-widest">{t('hud.wave', { wave: 1 })}</span>
          <div className="h-3 w-[1px] bg-white/10 mx-1" />
          <div className="flex flex-col">
            <span className="text-[7px] text-zinc-600 font-bold uppercase tracking-tighter">{t('hud.threat')}</span>
            <span ref={threatRef} className="text-zinc-500 font-mono text-[9px] uppercase tracking-widest font-black">{t('hud.threatStable')}</span>
          </div>
          <span ref={waveModifierRef} className="text-[8px] font-mono text-amber-400 uppercase tracking-widest opacity-0 transition-opacity duration-300 ml-2 px-2 py-0.5 bg-amber-950/30 border border-amber-500/20 rounded">MODIFIER</span>
        </div>

        {/* Dash Module Indicator with Click Trigger and Hotkey Indicator */}
        <div 
          onClick={() => {
            const engine = engineRef.current;
            if (engine) {
              if (engine.dashCooldownTimer > 0) {
                soundManager.uiError();
              } else {
                // Perform a smart safety emergency dash back upward-middle
                engine.triggerDash(engine.width / 2, engine.height * 0.35);
              }
            }
          }}
          className="flex items-center space-x-2 sm:space-x-3 glass-panel px-4 py-2 sm:px-5 sm:py-2.5 rounded-full border border-white/10 shadow-[0_4_20px_rgba(0,0,0,0.5)] cursor-pointer hover:bg-white/5 active:scale-95 transition-all pointer-events-auto"
          title={t('hud.dashTooltip')}
        >
          <div className="relative flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 shrink-0">
            <Cpu className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-zinc-400 z-10" />
            <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" className="stroke-white/10" strokeWidth="2.5" fill="transparent" />
              <circle 
                ref={dashCircleRef}
                cx="12" 
                cy="12" 
                r="9" 
                className="transition-all duration-75"
                strokeWidth="2.5" 
                fill="transparent" 
                strokeDasharray="56.55"
                strokeDashoffset="56.55"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[6.5px] text-zinc-500 font-bold uppercase tracking-widest leading-none mb-0.5">{t('hud.dash')}</span>
            <span ref={dashBadgeRef} className="text-cyan-400 font-mono text-[9px] uppercase tracking-widest font-black leading-none">ONLINE</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="flex flex-col w-12 sm:w-16">
            <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden mb-1">
              <div 
                ref={dashBarRef}
                className="h-full bg-cyan-400 transition-all duration-75 animate-pulse"
                style={{ width: '100%' }}
              />
            </div>
            <div className="flex justify-between items-center text-[7px] font-mono text-zinc-500 leading-none">
              <span>{t('hud.dashBattery')}</span>
              <span ref={dashTextRef} className="text-zinc-400 font-bold">{t('hud.dashReady')}</span>
            </div>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <span className="text-[8px] font-mono text-cyan-400 whitespace-nowrap bg-cyan-950/40 border border-cyan-500/25 px-1.5 py-0.5 rounded shadow-[0_0_6px_rgba(0,255,255,0.15)]">[SPACE / SHIFT]</span>
        </div>
      </div>
      
      <div className="flex flex-col items-end space-y-3 pointer-events-none">
        <div className="flex flex-col items-end space-y-2">
          <div className="flex items-center space-x-3">
            {/* Streak Indicator - Repositioned to top-right corner */}
            <div ref={streakRef} className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-red-600 px-4 py-1.5 rounded-full border border-white/20 shadow-xl opacity-0 transition-opacity duration-300">
               <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">Streak</span>
               <span ref={streakCountRef} className="text-white font-mono font-black italic scale-125 px-1 leading-none text-sm">0</span>
            </div>

            <button 
              onClick={() => { soundManager.uiClick(); onPauseToggle?.(); }}
              className="flex items-center justify-center glass-panel p-2 sm:p-2.5 rounded-full border border-white/10 hover:bg-white/10 hover:scale-105 active:scale-95 transition-all shadow-[0_4_20px_rgba(0,0,0,0.5)] pointer-events-auto"
              aria-label={isPaused ? t('app.resume') : t('app.pause')}
            >
              {isPaused ? <Play className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-300" /> : <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-300" />}
            </button>
          </div>

          {/* Active Powerups Display */}
          <ActivePowerups engineRef={engineRef} />
        </div>
        
        <div className="flex flex-col items-end space-y-4">
          <div className="flex items-center space-x-3 glass-panel px-4 py-2 sm:px-5 sm:py-2.5 rounded-full border border-white/10 shadow-[0_4_20px_rgba(0,0,0,0.5)] pointer-events-none">
            <Shield ref={shieldIconRef} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400" />
            <div className="w-20 sm:w-32 h-1.5 sm:h-2 bg-zinc-900 rounded-full overflow-hidden">
              <div 
                ref={healthBarRef}
                className="h-full transition-all duration-300 bg-white"
                style={{ width: '100%' }}
              />
            </div>
            <span data-testid="hud-health" ref={healthTextRef} className="text-sm sm:text-lg font-bold text-white font-mono w-8 text-right cyber-text-glow">100</span>
          </div>

          {/* Consumable Bar */}
          <ConsumableBar engineRef={engineRef} />

          {/* Resource Boost Ad Button */}
          <ResourceBoostAd engineRef={engineRef} />
        </div>
      </div>

      {/* Unobtrusive performance diagnostics overlay */}
      <AnimatePresence>
        {showPerf && (
          <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-6 left-6 z-20 bg-black/60 shadow-[0_4px_30px_rgba(0,0,0,0.7)] backdrop-blur-md border border-white/10 rounded-2xl p-4 font-mono text-[9px] tracking-wider text-zinc-400 space-y-1.5 select-none pointer-events-auto transition-all"
          >
            <div className="flex items-center space-x-2 border-b border-white/5 pb-1.5 mb-1.5 font-bold text-zinc-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="uppercase tracking-[0.2em] text-[8px]">{t('hud.sysDiagnostics')}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <div className="flex justify-between space-x-4">
                <span className="text-zinc-600 uppercase">FPS:</span>
                <span className="text-emerald-400 font-bold">{perfData.fps}</span>
              </div>
              <div className="flex justify-between space-x-4">
                <span className="text-zinc-600 uppercase">FTM:</span>
                <span className="text-white font-medium">{perfData.frameTime}ms</span>
              </div>
              <div className="flex justify-between space-x-4">
                <span className="text-zinc-600 uppercase">{t('hud.perfBugs')}</span>
                <span className="text-white font-medium">{perfData.bugs}</span>
              </div>
              <div className="flex justify-between space-x-4">
                <span className="text-zinc-600 uppercase">{t('hud.perfItems')}</span>
                <span className="text-white font-medium">{perfData.powerups + perfData.hazards}</span>
              </div>
              <div className="col-span-2 flex justify-between border-t border-white/5 pt-1 mt-0.5">
                <span className="text-zinc-600 uppercase">{t('hud.perfParticles')}</span>
                <span className="text-cyan-400 font-medium">{perfData.particles}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConsumableBar({ engineRef }: { engineRef: React.RefObject<EngineHandle> }) {
    const [counts, setCounts] = useState<Record<string, number>>({});
    
    useEffect(() => {
        return ProgressionManager.subscribe(() => {
            setCounts(ProgressionManager.getData().consumables);
        });
    }, []);

    const handleUse = (id: string) => {
        const engine = engineRef.current;
        if (engine && engine.useConsumable(id)) {
            // Sound handled by engine
        } else {
            soundManager.uiError();
        }
    };

    const consumables = [
        { id: 'repair_kit', icon: <Wrench className="w-4 h-4" />, label: t('consumable.repair'), desc: t('consumable.repairDesc') },
        { id: 'emp_generator', icon: <Zap className="w-4 h-4" />, label: t('consumable.emp'), desc: t('consumable.empDesc') },
        { id: 'overdrive_chip', icon: <Cpu className="w-4 h-4" />, label: t('consumable.overdrive'), desc: t('consumable.overdriveDesc') },
    ];

    return (
        <div className="flex space-x-2 mt-4 pointer-events-auto">
            {consumables.map(c => (
                <button 
                    key={c.id}
                    onClick={() => handleUse(c.id)}
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

function ResourceBoostAd({ engineRef }: { engineRef: React.RefObject<EngineHandle> }) {
  const [pending, setPending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleBoost = async () => {
    if (pending) return;
    setPending(true);
    soundManager.uiClick();
    try {
      const reward = await AdsService.showRewarded('resource_boost');
      if (reward && reward.type === 'resource_boost' && AdsService.isEnabled()) {
        const amount = reward.amount || 100;
        ProgressionManager.addResource('scrap', amount);
        ProgressionManager.addResource('plasma', Math.floor(amount / 4));
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (e) {
      console.warn('[ads] Resource boost ad failed:', e);
    } finally {
      setPending(false);
    }
  };

  if (!AdsService.isEnabled()) return null;

  return (
    <div className="mt-4 pointer-events-auto">
      <button
        onClick={handleBoost}
        disabled={pending}
        onMouseEnter={() => soundManager.uiHover()}
        className={`relative p-3 rounded-2xl border transition-all flex flex-col items-center group ${
          pending
            ? 'bg-black/80 border-yellow-500/50 opacity-70 cursor-wait'
            : 'bg-black/80 border-amber-500/30 hover:border-amber-400/60 hover:scale-105 active:scale-95 shadow-xl'
        }`}
      >
        <div className="text-amber-400 mb-1 group-hover:text-amber-300 transition-colors">
          <Gift className="w-4 h-4" />
        </div>

        {/* Hover Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-amber-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
          <p className="text-[8px] font-black text-white uppercase tracking-widest">
            {pending ? t('ads.resourceBoostPending') : t('ads.resourceBoost')}
          </p>
        </div>

        {showSuccess && (
          <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-emerald-500 rounded-full flex items-center justify-center border border-black animate-pulse">
            <span className="text-[7px] font-black text-white px-1">+100</span>
          </div>
        )}

        {pending && (
          <div className="absolute inset-0 rounded-2xl border-2 border-amber-400/50 animate-pulse" />
        )}
      </button>
    </div>
  );
}

function ActivePowerups({ engineRef }: { engineRef: React.RefObject<EngineHandle> }) {
    const [activeTypes, setActiveTypes] = useState<string[]>([]);
    
    useEffect(() => {
      const computeFromStatus = (status: GameEngineStatus | null) => {
        if (!status) {
          setActiveTypes([]);
          return;
        }
        const active: string[] = [];
        if (status.shieldTimer > 0) active.push('shield');
        if (status.multiplierTimer > 0) active.push('multiplier');
        if (status.rapidFireTimer > 0) active.push('rapidFire');
        if (status.slowMoTimer > 0) active.push('slowMo');
        if (status.overdriveTimer > 0) active.push('overdrive');
        setActiveTypes(active);
      };
      // Seed from current snapshot (subscribe also calls immediately)
      computeFromStatus(GameEngineStatusBus.getSnapshot());
      const unsub = GameEngineStatusBus.subscribe(computeFromStatus);
      return unsub;
    }, []);

    if (activeTypes.length === 0) return null;

    return (
        <div className="flex flex-col items-end space-y-1">
            {activeTypes.map(type => (
                <div key={type} className="flex items-center space-x-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full animate-pulse">
                    <span className="text-[8px] font-mono font-bold text-white tracking-widest">{t(`powerup.${type}` as TranslationKey)}</span>
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                </div>
            ))}
        </div>
    );
}
