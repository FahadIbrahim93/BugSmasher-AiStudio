import type { RefObject } from 'react';
import { Target, Zap, Cpu } from 'lucide-react';
import { soundManager } from '../game/SoundManager';
import type { GameEngine } from '../game/GameEngine';

interface HudLeftPanelProps {
  engineRef: RefObject<GameEngine | null>;
  scoreRef: RefObject<HTMLSpanElement | null>;
  waveRef: RefObject<HTMLSpanElement | null>;
  threatRef: RefObject<HTMLSpanElement | null>;
  dashBarRef: RefObject<HTMLDivElement | null>;
  dashTextRef: RefObject<HTMLSpanElement | null>;
  dashBadgeRef: RefObject<HTMLSpanElement | null>;
  dashCircleRef: RefObject<SVGCircleElement | null>;
  rageBarRef: RefObject<HTMLDivElement | null>;
  rageTextRef: RefObject<HTMLSpanElement | null>;
  furyBadgeRef: RefObject<HTMLDivElement | null>;
  rageScanRef: RefObject<HTMLDivElement | null>;
  gooBarRef: RefObject<HTMLDivElement | null>;
  gooTextRef: RefObject<HTMLSpanElement | null>;
  gooHintRef: RefObject<HTMLDivElement | null>;
  gooScanRef: RefObject<HTMLDivElement | null>;
}

export function HudLeftPanel({
  engineRef,
  scoreRef,
  waveRef,
  threatRef,
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
}: HudLeftPanelProps) {
  return (
    <div className="flex flex-col space-y-2 sm:space-y-4">
      <div className="flex items-center space-x-2 sm:space-x-3 glass-panel px-4 py-2 sm:px-5 sm:py-2.5 rounded-full border border-white/10 shadow-[0_4_20px_rgba(0,0,0,0.5)] hover:border-white/20 transition-all">
        <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400/80" />
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
        role="button"
        tabIndex={0}
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
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.currentTarget.click();
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

      {/* RAGE Meter — every smash/miss feeds it; at 100 you erupt into FURY MODE */}
      <div className="glass-panel px-4 py-2 sm:px-5 sm:py-2.5 rounded-full border border-white/10 shadow-[0_4_20px_rgba(0,0,0,0.5)] transition-all">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[7px] text-red-500 font-black uppercase tracking-widest">Rage</span>
          <span ref={rageTextRef} className="text-red-400 font-mono text-[9px] font-black tracking-widest">0</span>
        </div>
        <div className="relative w-28 sm:w-36 h-1.5 bg-zinc-900 rounded-full overflow-hidden ring-1 ring-white/5">
          <div ref={rageBarRef} className="h-full transition-all duration-100 bg-gradient-to-r from-orange-900 to-red-700" style={{ width: '0%' }} />
          {/* Scanline overlay — pulsed via Web Animations API when RAGE crosses 75% or FURY ignites */}
          <div ref={rageScanRef} className="absolute inset-0 opacity-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,90,60,0.9) 0px, rgba(255,90,60,0.9) 1px, transparent 1px, transparent 3px)' }} />
        </div>
        <div ref={furyBadgeRef} className="opacity-0 transition-opacity mt-1 text-center text-[8px] text-amber-400 font-black font-mono uppercase tracking-widest animate-pulse">FURY MODE ACTIVE</div>
      </div>

      {/* Goo Contamination — heavy goo clouds the viewport; hold Q (or the sweep button on touch) to recycle into scrap */}
      {/* Pointer events stay scoped to the SWEEP button only — the HUD root is pointer-events-none so stray clicks pass through to the canvas */}
      <div className="glass-panel px-4 py-2 sm:px-5 sm:py-2.5 rounded-full border border-white/10 shadow-[0_4_20px_rgba(0,0,0,0.5)] transition-all">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[7px] text-lime-500 font-black uppercase tracking-widest">Contamination</span>
          <span ref={gooTextRef} className="text-lime-400 font-mono text-[9px] font-black tracking-widest">0%</span>
        </div>
        <div className="relative w-28 sm:w-36 h-1.5 bg-zinc-900 rounded-full overflow-hidden ring-1 ring-white/5">
          <div ref={gooBarRef} className="h-full transition-all duration-100 bg-gradient-to-r from-lime-900 to-lime-700" style={{ width: '0%' }} />
          {/* Scanline overlay — pulsed via Web Animations API when contamination crosses 50% */}
          <div ref={gooScanRef} className="absolute inset-0 opacity-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(163,230,53,0.9) 0px, rgba(163,230,53,0.9) 1px, transparent 1px, transparent 3px)' }} />
        </div>
        <div className="flex items-center justify-between mt-1">
          <div ref={gooHintRef} className="opacity-0 transition-opacity text-center text-[8px] text-lime-300 font-black font-mono uppercase tracking-widest">HOLD [Q] TO SWEEP</div>
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              const engine = engineRef.current;
              if (engine) engine.gooSystem.isCollecting = true;
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              const engine = engineRef.current;
              if (engine) engine.gooSystem.isCollecting = false;
            }}
            onPointerLeave={(e) => {
              e.stopPropagation();
              const engine = engineRef.current;
              if (engine) engine.gooSystem.isCollecting = false;
            }}
            onPointerCancel={(e) => {
              e.stopPropagation();
              const engine = engineRef.current;
              if (engine) engine.gooSystem.isCollecting = false;
            }}
            onContextMenu={(e) => { e.preventDefault(); }}
            className="pointer-events-auto text-[8px] font-black font-mono uppercase tracking-widest text-lime-300 border border-lime-500/30 bg-lime-950/40 px-2 py-1 rounded select-none touch-none active:bg-lime-800/60 transition-colors"
            aria-label="Hold to sweep goo contamination"
          >
            SWEEP
          </button>
        </div>
      </div>
    </div>
  );
}
