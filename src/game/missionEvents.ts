// Lightweight event constant for mission updates.
// Uses CustomEvent on window for loose coupling between MissionManager and UI panels.
export const MISSION_UPDATE_EVENT = 'mission_update' as const;

export function emitMissionUpdate(detail?: unknown) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(MISSION_UPDATE_EVENT, { detail }));
  }
}
