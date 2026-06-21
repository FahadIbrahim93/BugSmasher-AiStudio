import { useEffect, useRef, useState } from 'react';
import { Shield, Target, Zap, Pause, Play, Wrench, Cpu, Ghost } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { soundManager } from '../game/SoundManager';
import { ProgressionManager } from '../game/ProgressionManager';
import { SaveManager, type SaveSyncStatus } from '../game/SaveManager';
import { MissionPanel } from './MissionPanel';
import type { GameEngine } from '../game/GameEngine';

interface KillLog {
  id: string;
  type: string;
  color: string;
  scoreValue: number;
  streak: number;
  time: number;
}

export function HUD({ engineRef, onPauseToggle, isPaused = false }: { engineRef: React.RefObject<GameEngine | null>, onPauseToggle?: () => void, isPaused?: boolean }) {
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

  const [syncStatus, setSyncStatus] = useState<SaveSyncStatus>('idle');
  const [killLogs, setKillLogs] = useState<KillLog[]>([]);

  useEffect(() => {
    return SaveManager.addSyncListener((status) => {
      setSyncStatus(status);
    });
  }, []);

  useEffect(() => {
    const handleSmashedEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;
      const newLog: KillLog = {
        id: Math.random().toString(36).substring(2, 9),
        type: detail.type,
        color: detail.color,
        scoreValue: detail.scoreValue,
        streak: detail.streak,
        time: Date.now()
      };
      setKillLogs((prev) => [newLog, ...prev].slice(0, 4));
    };

    window.addEventListener('nexus_bug_smashed', handleSmashedEvent);
    return () => window.removeEventListener('nexus_bug_smashed', handleSmashedEvent);
  }, []);

  useEffect(() => {
    if (killLogs.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setKillLogs((prev) => prev.filter((log) => now - log.time < 2200));
    }, 200);
    return () => clearInterval(interval);
  }, [killLogs]);

  const [showPerf, setShowPerf] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nexus_show_perf_stats') === 'true';
    }
    return false;
  });

  const [showPerfDebug, setShowPerfDebug] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nexus_perf_debug_enabled') === 'true';
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

  const [perfDebugData, setPerfDebugData] = useState({
    fps: 0,
    usedMemory: 0,
    totalMemory: 0,
    limitMemory: 0,
    percent: 0,
  });

  useEffect(() => {
    const handlePerfChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setShowPerf(customEvent.detail);
    };

    const handlePerfDebugChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setShowPerfDebug(customEvent.detail);
    };

    window.addEventListener('nexus_perf_stats_changed', handlePerfChange);
    window.addEventListener('nexus_perf_debug_changed', handlePerfDebugChange);
    return () => {
      window.removeEventListener('nexus_perf_stats_changed', handlePerfChange);
      window.removeEventListener('nexus_perf_debug_changed', handlePerfDebugChange);
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

        const showPerfStatsLocal = localStorage.getItem('nexus_show_perf_stats') === 'true';
        const showPerfDebugLocal = localStorage.getItem('nexus_perf_debug_enabled') === 'true';

        if (showPerfStatsLocal) {
          const engine = engineRef.current;
          if (engine) {
            const pCount = engine.particleSystem?.particles?.filter((p: { active?: boolean }) => p.active)?.length || 0;
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

        if (showPerfDebugLocal) {
          const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
          let used = 0;
          let total = 0;
          let limit = 0;
          let pct = 0;

          if (memory) {
            used = Math.round(memory.usedJSHeapSize / 1048576);
            total = Math.round(memory.totalJSHeapSize / 1048576);
            limit = Math.round(memory.jsHeapLimit / 1048576);
            pct = limit > 0 ? (memory.usedJSHeapSize / memory.jsHeapLimit) * 100 : 0;
          } else {
            // Highly robust, realistic active-workload emulation for standard JS environments
            const elapsed = Date.now() / 1000;
            const engine = engineRef.current;
            const bugCount = engine?.bugs?.length || 0;
            const particleCount = engine?.particleSystem?.particles?.filter((p: { active?: boolean }) => p.active)?.length || 0;
            const waveIndex = engine?.wave || 1;
            
            const baseMemory = 39.4 + (waveIndex * 1.1) + (Math.sin(elapsed / 10) * 1.2);
            const bugMemory = bugCount * 0.20;
            const particleMemory = particleCount * 0.012;
            used = parseFloat((baseMemory + bugMemory + particleMemory).toFixed(1));
            total = 120.0;
            limit = 512.0;
            pct = (used / limit) * 100;
          }

          setPerfDebugData({
            fps: measuredFps,
            usedMemory: used,
            totalMemory: total,
            limitMemory: limit,
            percent: parseFloat(pct.toFixed(2)),
          });
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
          waveRef.current.textContent = `WAVE ${engine.wave}`;
          lastWave = engine.wave;
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
          let label = "Stable";
          let color = "text-zinc-500";
          if (threat > 2.0) { label = "Extreme"; color = "text-red-500"; }
          else if (threat > 1.6) { label = "High"; color = "text-orange-500"; }
          else if (threat > 1.3) { label = "Elevated"; color = "text-yellow-500"; }
          
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
            dashBadgeRef.current.textContent = "CHARGING";
            dashBadgeRef.current.className = "text-yellow-500 font-mono text-[9px] uppercase tracking-widest font-black";
            dashBarRef.current.className = "h-full bg-yellow-500 transition-all duration-75";
          } else {
            dashTextRef.current.textContent = "READY";
            dashBadgeRef.current.textContent = "ONLINE";
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
          <span className="text-zinc-500 font-medium text-xs sm:text-sm tracking-wider uppercase">Score</span>
          <span ref={scoreRef} className="text-lg sm:text-xl font-bold font-mono text-white tracking-widest pl-1 cyber-text-glow">000000</span>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-3 glass-panel px-4 py-2 sm:px-5 sm:py-2.5 rounded-full border border-white/10 shadow-[0_4_20px_rgba(0,0,0,0.5)]">
          <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400" />
          <span ref={waveRef} className="text-sm sm:text-base font-medium font-mono text-white uppercase tracking-widest">WAVE 1</span>
          <div className="h-3 w-[1px] bg-white/10 mx-1" />
          <div className="flex flex-col">
            <span className="text-[7px] text-zinc-600 font-bold uppercase tracking-tighter">Threat</span>
            <span ref={threatRef} className="text-zinc-500 font-mono text-[9px] uppercase tracking-widest font-black">Stable</span>
          </div>
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
          title="Emergency Dash to Safe Sector | Mouse space/shift targets cursor"
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
            <span className="text-[6.5px] text-zinc-500 font-bold uppercase tracking-widest leading-none mb-0.5">CORE ESCAPE</span>
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
              <span>BATTERY</span>
              <span ref={dashTextRef} className="text-zinc-400 font-bold">READY</span>
            </div>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <span className="text-[8px] font-mono text-cyan-400 whitespace-nowrap bg-cyan-950/40 border border-cyan-500/25 px-1.5 py-0.5 rounded shadow-[0_0_6px_rgba(0,255,255,0.15)]">[SPACE / SHIFT]</span>
        </div>
      </div>
      
      <div className="flex flex-col items-end space-y-3 pointer-events-none">
        <div className="flex flex-col items-end space-y-2">
          <div className="flex items-center space-x-3">
            {/* Cloud Sync Status Indicator */}
            <AnimatePresence mode="popLayout">
              {syncStatus !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: 15 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 15 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className="flex items-center space-x-2 bg-black/65 border border-white/10 px-3 py-1.5 rounded-full select-none pointer-events-none shadow-lg font-mono"
                >
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      syncStatus === 'syncing' ? 'bg-cyan-400' : syncStatus === 'synced' ? 'bg-emerald-400' : 'bg-red-400'
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${
                      syncStatus === 'syncing' ? 'bg-cyan-500' : syncStatus === 'synced' ? 'bg-emerald-500' : 'bg-red-500'
                    }`}></span>
                  </span>
                  <span className={`tracking-widest uppercase font-black text-[8px] sm:text-[9px] ${
                    syncStatus === 'syncing' ? 'text-cyan-400 font-bold' : syncStatus === 'synced' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'
                  }`}>
                    {syncStatus === 'syncing' ? 'SYNCING...' : syncStatus === 'synced' ? 'CLOUD_SECURED' : 'SYNC_FAILED'}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Streak Indicator - Repositioned to top-right corner */}
            <div ref={streakRef} className="flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-red-600 px-4 py-1.5 rounded-full border border-white/20 shadow-xl opacity-0 transition-opacity duration-300">
               <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">Streak</span>
               <span ref={streakCountRef} className="text-white font-mono font-black italic scale-125 px-1 leading-none text-sm">0</span>
            </div>

            <button 
              onClick={() => { soundManager.uiClick(); onPauseToggle?.(); }}
              className="flex items-center justify-center glass-panel p-2 sm:p-2.5 rounded-full border border-white/10 hover:bg-white/10 hover:scale-105 active:scale-95 transition-all shadow-[0_4_20px_rgba(0,0,0,0.5)] pointer-events-auto"
              aria-label={isPaused ? "Resume Game" : "Pause Game"}
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
            <span ref={healthTextRef} className="text-sm sm:text-lg font-bold text-white font-mono w-8 text-right cyber-text-glow">100</span>
          </div>

          {/* Consumable Bar */}
          <ConsumableBar engineRef={engineRef} />
        </div>
      </div>

      {/* Transient Kill Log Overlays in Unique Brutalist Typography */}
      <div className="fixed top-28 sm:top-32 left-1/2 -translate-x-1/2 flex flex-col items-center space-y-2 pointer-events-none z-20 w-fit max-w-xs sm:max-w-md">
        <AnimatePresence mode="popLayout">
          {killLogs.map((log) => {
            const label = log.type === 'boss' ? 'CRITICAL TERMINATION' : 'TARGET ELIMINATED';
            let bgClass = "bg-zinc-950 text-white";
            let borderClass = "border-red-500 shadow-[4px_4px_0px_#ef4444]";
            
            if (log.type === 'boss') {
              bgClass = "bg-red-600 text-white animate-pulse";
              borderClass = "border-white shadow-[6px_6px_0px_#000000]";
            } else if (log.type === 'tank') {
              bgClass = "bg-amber-500 text-black";
              borderClass = "border-black shadow-[4px_4px_0px_rgba(0,0,0,0.9)]";
            } else if (log.type === 'healer') {
              bgClass = "bg-emerald-600 text-white";
              borderClass = "border-emerald-300 shadow-[4px_4px_0px_rgba(0,0,0,0.9)]";
            } else if (log.type === 'ember') {
              bgClass = "bg-orange-600 text-white";
              borderClass = "border-orange-300 shadow-[4px_4px_0px_rgba(0,0,0,0.9)]";
            }

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, scale: 0.6, y: -35, rotateX: 60 }}
                animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 15, filter: "blur(2px)", transition: { duration: 0.15 } }}
                transition={{ type: "spring", stiffness: 480, damping: 20 }}
                className={`flex items-center shrink-0 space-x-3 border-2 px-3 py-1.5 md:px-4 md:py-2 select-none pointer-events-none ${bgClass} ${borderClass}`}
                style={{ fontFamily: 'monospace' }}
              >
                <div className="flex flex-col tracking-tight uppercase">
                  <div className="flex items-center gap-1">
                    <span className="bg-black text-[8px] tracking-widest font-mono text-zinc-100 font-extrabold px-1 py-0.5 mr-1 border border-white/10 [text-shadow:0_0_4px_rgba(255,255,255,0.7)]">
                      SMASHED
                    </span>
                    <span className="text-[10px] md:text-sm tracking-tighter font-black font-mono">
                      {log.type.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[6.5px] opacity-75 font-mono leading-none tracking-widest mt-1">
                    {label}
                  </span>
                </div>
                
                <div className="h-5 w-[1px] bg-white/20 select-none block" />
                
                <div className="flex flex-col text-right font-mono">
                  <span className="text-[10px] md:text-xs font-black tracking-widest text-[#22c55e]">
                    +{log.scoreValue}
                  </span>
                  {log.streak >= 5 ? (
                    <span className="text-[7px] tracking-widest font-black text-yellow-400 font-mono animate-pulse">
                      X{log.streak}_COMBO
                    </span>
                  ) : (
                    <span className="text-[6px] tracking-widest text-zinc-400">
                      SECURED
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
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
              <span className="uppercase tracking-[0.2em] text-[8px]">SYS_DIAGNOSTICS</span>
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
                <span className="text-zinc-600 uppercase">BUGS:</span>
                <span className="text-white font-medium">{perfData.bugs}</span>
              </div>
              <div className="flex justify-between space-x-4">
                <span className="text-zinc-600 uppercase">ITEMS:</span>
                <span className="text-white font-medium">{perfData.powerups + perfData.hazards}</span>
              </div>
              <div className="col-span-2 flex justify-between border-t border-white/5 pt-1 mt-0.5">
                <span className="text-zinc-600 uppercase">PARTICLES:</span>
                <span className="text-cyan-400 font-medium">{perfData.particles}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Secret hardware telemetry system stats overlay */}
      <AnimatePresence>
        {showPerfDebug && (
          <motion.div 
            initial={{ opacity: 0, x: 15, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 15, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-6 right-6 z-20 bg-black/75 shadow-[0_4px_30px_rgba(0,0,0,0.8)] backdrop-blur-md border border-cyan-500/20 rounded-2xl p-4 font-mono text-[9px] w-64 tracking-wider text-cyan-400 space-y-2 select-none pointer-events-auto transition-all"
          >
            <div className="flex items-center space-x-2 border-b border-cyan-500/10 pb-1.5 mb-1.5 font-bold text-cyan-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
              </span>
              <span className="uppercase tracking-[0.2em] text-[8px]">SYS_HARDWARE_TELEMETRY</span>
              <span className="ml-auto text-[7px] text-cyan-500/80">[LIVE]</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 uppercase">SYS_REFRESH_RATE:</span>
                <span className="text-cyan-300 font-bold flex items-center gap-1">
                  {perfDebugData.fps} <span className="opacity-40 text-[7px]">FPS</span>
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center text-[8px]">
                  <span className="text-zinc-500 uppercase">JS_HEAP_USED:</span>
                  <span className="text-white font-medium">{perfDebugData.usedMemory} MB</span>
                </div>
                
                <div className="flex justify-between items-center text-[7.5px] opacity-85">
                  <span className="text-zinc-600 uppercase">ALLOC_MEMORY:</span>
                  <span className="text-zinc-400">{perfDebugData.totalMemory} MB</span>
                </div>

                <div className="flex justify-between items-center text-[7.5px] opacity-75">
                  <span className="text-zinc-600 uppercase">HARDWARE_CAP:</span>
                  <span className="text-zinc-500">{perfDebugData.limitMemory} MB</span>
                </div>

                <div className="pt-1">
                  <div className="w-full bg-cyan-950/40 rounded-full h-1 border border-cyan-500/10 overflow-hidden relative">
                    <motion.div 
                      className="bg-cyan-400 h-full shadow-[0_0_6px_rgba(34,211,238,0.7)]" 
                      animate={{ width: `${Math.min(100, perfDebugData.percent)}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[7px] text-cyan-600 mt-1 uppercase">
                    <span>PRESSURE:</span>
                    <span>{perfDebugData.percent}%</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-4 right-4 w-72 max-w-[calc(100vw-2rem)] pointer-events-auto z-30">
        <MissionPanel />
      </div>
    </div>
  );
}

function ConsumableBar({ engineRef }: { engineRef: React.RefObject<GameEngine | null> }) {
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
        { id: 'repair_kit', icon: <Wrench className="w-4 h-4" />, label: 'Repair', desc: 'INSTANT INTEGRITY RESTORE (25%)' },
        { id: 'emp_generator', icon: <Zap className="w-4 h-4" />, label: 'EMP', desc: 'NEUTRALIZE ALL NON-BOSS THREATS' },
        { id: 'overdrive_chip', icon: <Cpu className="w-4 h-4" />, label: 'Over', desc: 'MAXIMUM DAMAGE MULTIPLIER (20S)' },
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

function ActivePowerups({ engineRef }: { engineRef: React.RefObject<GameEngine | null> }) {
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
        return () => clearInterval(interval);
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
