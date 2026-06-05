/**
 * Mission event bus — decouples mission state mutations from React UI updates.
 *
 * Game-engine code emits these events; the MissionPanel React component listens
 * for them and re-renders. This avoids 5-second polling and keeps the game
 * loop decoupled from the UI.
 */

export const MISSION_UPDATE_EVENT = 'mission-update';

export function emitMissionUpdate(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(MISSION_UPDATE_EVENT));
}
