import type { GameEngine } from '../game/GameEngine';
import { useHudSync } from './useHudSync';
import { HudLeftPanel } from './HudLeftPanel';
import { HudRightPanel } from './HudRightPanel';
import { HudKillLogs } from './HudKillLogs';
import { HudPerfOverlay } from './HudPerfOverlay';
import { HudHardwareOverlay } from './HudHardwareOverlay';

export function HUD({ engineRef, onPauseToggle, isPaused = false }: { engineRef: React.RefObject<GameEngine | null>, onPauseToggle?: () => void, isPaused?: boolean }) {
  const hud = useHudSync(engineRef);

  return (
    <div className="absolute top-0 left-0 w-full p-4 sm:p-6 flex justify-between items-start pointer-events-none z-10">
      {/* FURY MODE ignition — brief screen-edge glow (desktop only; AGENTS.md perf gate: isMobile) */}
      <div
        ref={hud.furyGlowRef}
        className="fixed inset-0 opacity-0 pointer-events-none z-[5]"
        style={{ boxShadow: 'inset 0 0 140px 45px rgba(255,50,10,0.35), inset 0 0 30px 8px rgba(255,90,40,0.25)' }}
      />

      <HudLeftPanel
        engineRef={engineRef}
        scoreRef={hud.scoreRef}
        waveRef={hud.waveRef}
        threatRef={hud.threatRef}
        dashBarRef={hud.dashBarRef}
        dashTextRef={hud.dashTextRef}
        dashBadgeRef={hud.dashBadgeRef}
        dashCircleRef={hud.dashCircleRef}
        rageBarRef={hud.rageBarRef}
        rageTextRef={hud.rageTextRef}
        furyBadgeRef={hud.furyBadgeRef}
        rageScanRef={hud.rageScanRef}
        gooBarRef={hud.gooBarRef}
        gooTextRef={hud.gooTextRef}
        gooHintRef={hud.gooHintRef}
        gooScanRef={hud.gooScanRef}
      />

      <HudRightPanel
        engineRef={engineRef}
        syncStatus={hud.syncStatus}
        streakRef={hud.streakRef}
        streakCountRef={hud.streakCountRef}
        shieldIconRef={hud.shieldIconRef}
        healthBarRef={hud.healthBarRef}
        healthTextRef={hud.healthTextRef}
        isPaused={isPaused}
        onPauseToggle={onPauseToggle}
      />

      <HudKillLogs />

      <HudPerfOverlay showPerf={hud.showPerf} perfData={hud.perfData} audioStats={hud.audioStats} />

      <HudHardwareOverlay showPerfDebug={hud.showPerfDebug} perfDebugData={hud.perfDebugData} />
    </div>
  );
}
