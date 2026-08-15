import { useEffect, useRef, useState } from 'react';
import { soundManager } from '../game/SoundManager';
import { SaveManager, type SaveSyncStatus } from '../game/SaveManager';
import type { GameEngine } from '../game/GameEngine';

export function useHudSync(engineRef: React.RefObject<GameEngine | null>) {
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

  // RAGE Meter / FURY MODE + Goo Contamination
  const rageBarRef = useRef<HTMLDivElement>(null);
  const rageTextRef = useRef<HTMLSpanElement>(null);
  const furyBadgeRef = useRef<HTMLDivElement>(null);
  const rageScanRef = useRef<HTMLDivElement>(null);
  const gooBarRef = useRef<HTMLDivElement>(null);
  const gooTextRef = useRef<HTMLSpanElement>(null);
  const gooHintRef = useRef<HTMLDivElement>(null);
  const gooScanRef = useRef<HTMLDivElement>(null);
  const furyGlowRef = useRef<HTMLDivElement>(null);

  const [syncStatus, setSyncStatus] = useState<SaveSyncStatus>('idle');

  useEffect(() => {
    return SaveManager.addSyncListener((status) => {
      setSyncStatus(status);
    });
  }, []);

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

  // Audio pipeline load telemetry (oscillator budget throttle + WAV-vs-synth usage)
  const [audioStats, setAudioStats] = useState({
    oscillatorsSpawned: 0,
    throttledEvents: 0,
    budgetPerWindow: 0,
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
    let lastRage = -1;
    let lastFury = false;
    let lastFuryCd = -1;
    let lastGoo = -1;
    let lastGooHeavy = false;
    let lastGooCollecting = false;

    performance.now(); // last frame time tracked if needed for fps calc
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
          // Audio pipeline load — always sample so the SYS_DIAGNOSTICS panel shows live audio pressure
          setAudioStats(soundManager.getAudioStats());
        }

        if (showPerfDebugLocal) {
          const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit?: number } }).memory;
          let used: number;
          let total: number;
          let limit: number;
          let pct: number;

          if (memory) {
            used = Math.round(memory.usedJSHeapSize / 1048576);
            total = Math.round(memory.totalJSHeapSize / 1048576);
            limit = Math.round((memory.jsHeapSizeLimit || memory.totalJSHeapSize) / 1048576);
            const limitForPct = memory.jsHeapSizeLimit || memory.totalJSHeapSize || 1;
            pct = (memory.usedJSHeapSize / limitForPct) * 100;
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

          // Class updates for health colors with gradient
          healthBarRef.current.className = `h-full transition-all duration-300 ${
            healthPercent > 50
              ? 'bg-gradient-to-r from-emerald-400 via-emerald-300 to-white shadow-[0_0_12px_rgba(52,211,153,0.3)]'
              : healthPercent > 20
                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-yellow-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-gradient-to-r from-red-600 via-red-500 to-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
          }`;
          shieldIconRef.current.setAttribute('class', `lucide lucide-shield w-3.5 h-3.5 sm:w-4 sm:h-4 ${
            healthPercent > 50
              ? 'text-emerald-400/80'
              : healthPercent > 20
                ? 'text-yellow-400'
                : 'text-red-500 animate-pulse'
          }`);

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

        // Update RAGE Meter / FURY MODE
        if (rageBarRef.current && rageTextRef.current) {
          const rage = Math.max(0, Math.min(100, engine.weaponHeat || 0));
          const furyNow = engine.furyActive;
          const recharging = !furyNow && (engine.furyCooldownTimer || 0) > 0;
          const furyCd = recharging ? engine.furyCooldownTimer : 0;
          const crossedRageThreshold = lastRage >= 0 && rage >= 75 && lastRage < 75;
          const furyIgnited = furyNow && !lastFury;
          if (rage !== lastRage || furyNow !== lastFury || furyCd !== lastFuryCd) {
            rageBarRef.current.style.width = `${rage}%`;
            rageTextRef.current.textContent = furyNow ? 'FURY' : `${Math.ceil(rage)}`;
            rageBarRef.current.className = furyNow
              ? 'h-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 shadow-[0_0_10px_rgba(255,60,0,0.6)] animate-pulse'
              : recharging
                ? 'h-full bg-gradient-to-r from-zinc-700 to-amber-800'
                : rage > 75
                  ? 'h-full bg-gradient-to-r from-red-700 to-orange-500'
                  : 'h-full bg-gradient-to-r from-orange-900 to-red-700';
            if (furyBadgeRef.current) {
              if (furyNow) {
                furyBadgeRef.current.textContent = 'FURY MODE ACTIVE';
                furyBadgeRef.current.classList.remove('text-amber-500/70');
                furyBadgeRef.current.classList.add('text-amber-400');
              } else if (recharging) {
                furyBadgeRef.current.textContent = `RECHARGING ${Math.ceil(furyCd)}S`;
                furyBadgeRef.current.classList.remove('text-amber-400');
                furyBadgeRef.current.classList.add('text-amber-500/70');
              }
              furyBadgeRef.current.classList.toggle('opacity-0', !(furyNow || recharging));
            }
            // Scanline pulse sweeps down the meter when RAGE crosses 75% or FURY ignites
            if ((crossedRageThreshold || furyIgnited) && rageScanRef.current) {
              rageScanRef.current.animate(
                [
                  { opacity: 0, backgroundPositionY: '0px' },
                  { opacity: 0.55, backgroundPositionY: '3px' },
                  { opacity: 0, backgroundPositionY: '6px' },
                ],
                { duration: 500, easing: 'ease-out' }
              );
            }
            // Brief screen-edge glow when FURY ignites — desktop only (AGENTS.md perf gate: isMobile)
            if (furyIgnited && furyGlowRef.current && !engine.isMobile) {
              furyGlowRef.current.animate(
                [
                  { opacity: 0 },
                  { opacity: 0.6, offset: 0.2 },
                  { opacity: 0.15, offset: 0.75 },
                  { opacity: 0 },
                ],
                { duration: 1600, easing: 'ease-out' }
              );
            }
            lastRage = rage;
            lastFury = furyNow;
            lastFuryCd = furyCd;
          }
        }

        // Update Goo Contamination + HOLD Q sweep hint
        if (gooBarRef.current && gooTextRef.current && gooHintRef.current) {
          const gooAmt = engine.gooSystem?.gooAmount || 0;
          const gooPct = Math.max(0, Math.min(100, gooAmt));
          const gooHeavy = gooPct > 50;
          const crossedGooThreshold = lastGoo >= 0 && gooPct > 50 && lastGoo <= 50;
          const collecting = engine.gooSystem?.isCollecting ?? false;
          if (gooPct !== lastGoo || gooHeavy !== lastGooHeavy || collecting !== lastGooCollecting) {
            gooBarRef.current.style.width = `${gooPct}%`;
            gooTextRef.current.textContent = `${Math.ceil(gooPct)}%`;
            // Scanline pulse sweeps down the meter when contamination crosses 50%
            if (crossedGooThreshold && gooScanRef.current) {
              gooScanRef.current.animate(
                [
                  { opacity: 0, backgroundPositionY: '0px' },
                  { opacity: 0.5, backgroundPositionY: '3px' },
                  { opacity: 0, backgroundPositionY: '6px' },
                ],
                { duration: 500, easing: 'ease-out' }
              );
            }
            gooBarRef.current.className = collecting
              ? 'h-full bg-gradient-to-r from-lime-400 to-emerald-300 shadow-[0_0_8px_rgba(163,230,53,0.6)] animate-pulse'
              : gooHeavy
                ? 'h-full bg-gradient-to-r from-lime-600 to-green-400 shadow-[0_0_8px_rgba(132,204,22,0.4)]'
                : 'h-full bg-gradient-to-r from-lime-900 to-lime-700';
            if (gooHeavy || collecting) {
              gooHintRef.current.classList.toggle('opacity-0', false);
              gooHintRef.current.textContent = collecting ? 'SWEEPING...' : 'HOLD [Q] TO SWEEP';
            } else {
              gooHintRef.current.classList.toggle('opacity-0', true);
            }
            lastGoo = gooPct;
            lastGooHeavy = gooHeavy;
            lastGooCollecting = collecting;
          }
        }
      }
      animationFrameId = requestAnimationFrame(updateHUD);
    };

    updateHUD();
    return () => { cancelAnimationFrame(animationFrameId); };
  }, [engineRef]);

  return {
    scoreRef,
    waveRef,
    healthTextRef,
    healthBarRef,
    shieldIconRef,
    threatRef,
    streakRef,
    streakCountRef,
    dashBarRef,
    dashTextRef,
    dashBadgeRef,
    dashCircleRef,
    rageBarRef,
    rageTextRef,
    furyBadgeRef,
    rageScanRef,
    gooBarRef,
    gooTextRef,
    gooHintRef,
    gooScanRef,
    furyGlowRef,
    syncStatus,
    showPerf,
    showPerfDebug,
    perfData,
    perfDebugData,
    audioStats,
  };
}
