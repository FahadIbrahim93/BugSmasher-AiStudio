import type { GameEngine } from '../game/GameEngine';
import { useHudSync } from './useHudSync';
import { HudLeftPanel } from './HudLeftPanel';
import { HudRightPanel } from './HudRightPanel';
import { HudKillLogs } from './HudKillLogs';
import { HudPerfOverlay } from './HudPerfOverlay';
import { HudHardwareOverlay } from './HudHardwareOverlay';

export function HUD({ engineRef, onPauseToggle, isPaused = false }: { engineRef: React.RefObject<GameEngine | null>, onPauseToggle?: () => void, isPaused?: boolean }) {
  const {
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
  } = useHudSync(engineRef);

  return (
    <div className="absolute top-0 left-0 w-full p-4 sm:p-6 flex justify-between items-start pointer-events-none z-10">
      {/* FURY MODE ignition — brief screen-edge glow (desktop only; AGENTS.md perf gate: isMobile) */}
      <div
        ref={furyGlowRef}
        className="fixed inset-0 opacity-0 pointer-events-none z-[5]"
        style={{ boxShadow: 'inset 0 0 140px 45px rgba(255,50,10,0.35), inset 0 0 30px 8px rgba(255,90,40,0.25)' }}
      />

      <HudLeftPanel
        engineRef={engineRef}
        scoreRef={scoreRef}
        waveRef={waveRef}
        threatRef={threatRef}
        dashBarRef={dashBarRef}
        dashTextRef={dashTextRef}
        dashBadgeRef={dashBadgeRef}
        dashCircleRef={dashCircleRef}
        rageBarRef={rageBarRef}
        rageTextRef={rageTextRef}
        furyBadgeRef={furyBadgeRef}
        rageScanRef={rageScanRef}
        gooBarRef={gooBarRef}
        gooTextRef={gooTextRef}
        gooHintRef={gooHintRef}
        gooScanRef={gooScanRef}
      />

      <HudRightPanel
        engineRef={engineRef}
        syncStatus={syncStatus}
        streakRef={streakRef}
        streakCountRef={streakCountRef}
        shieldIconRef={shieldIconRef}
        healthBarRef={healthBarRef}
        healthTextRef={healthTextRef}
        isPaused={isPaused}
        onPauseToggle={onPauseToggle}
      />

      <HudKillLogs />

      <HudPerfOverlay showPerf={showPerf} perfData={perfData} audioStats={audioStats} />

      <HudHardwareOverlay showPerfDebug={showPerfDebug} perfDebugData={perfDebugData} />
    </div>
  );
}
