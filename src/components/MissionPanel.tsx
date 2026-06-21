import React, { useState, useEffect, useCallback } from 'react';
// import { motion } from 'motion/react'; // motion not currently used in this panel
import { MissionManager, type Mission } from '../game/MissionManager';
import { analytics } from '../lib/analytics';
import { MISSION_UPDATE_EVENT } from '../game/missionEvents';

interface MissionPanelProps {
  onClaim?: (mission: Mission) => void;
}

const MissionRow: React.FC<{
  mission: Mission;
  onClaim: (m: Mission) => void;
}> = ({ mission, onClaim }) => {
  const progress = (mission.current / mission.target) * 100;
  return (
    <div className={`mission-row ${mission.completed ? 'completed' : ''} ${mission.claimed ? 'claimed' : ''}`}>
      <span className="mission-icon">{mission.icon}</span>
      <div className="mission-body">
        <div className="mission-desc">{mission.description}</div>
        <div className="mission-progress-bar">
          <div className="mission-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="mission-progress-text">
          {mission.current.toLocaleString()} / {mission.target.toLocaleString()}
        </div>
      </div>
      <div className="mission-reward">
        {mission.claimed ? (
          <span className="claimed-badge">✓ Claimed</span>
        ) : mission.completed ? (
          <button
            className="claim-btn"
            onClick={() => {
              const result = MissionManager.claimReward(mission.id);
              if (result.success) {
                analytics.track('mission_claimed', { missionId: mission.id, crystals: mission.reward.crystals });
                onClaim(mission);
              }
            }}
          >
            +{mission.reward.crystals}
          </button>
        ) : (
          <span className="reward-amount">+{mission.reward.crystals}</span>
        )}
      </div>
    </div>
  );
};

export const MissionPanel: React.FC<MissionPanelProps> = ({ onClaim }) => {
  const [state, setState] = useState({ daily: MissionManager.getDaily(), weekly: MissionManager.getWeekly() });

  const refresh = useCallback(() => {
    setState({ daily: MissionManager.getDaily(), weekly: MissionManager.getWeekly() });
  }, []);

  useEffect(() => {
    window.addEventListener(MISSION_UPDATE_EVENT, refresh);
    // Also listen for storage events so multi-tab updates sync
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'bugsmasher_missions') refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(MISSION_UPDATE_EVENT, refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, [refresh]);

  const dailyStats = {
    completed: state.daily.filter(m => m.completed).length,
    total: state.daily.length,
  };
  const weeklyStats = {
    completed: state.weekly.filter(m => m.completed).length,
    total: state.weekly.length,
  };

  return (
    <div className="mission-panel">
      <div className="mission-section">
        <h3 className="mission-section-title">
          Daily Missions <span className="mission-counter">{dailyStats.completed}/{dailyStats.total}</span>
        </h3>
        {state.daily.map(m => (
          <MissionRow key={m.id} mission={m} onClaim={onClaim || (() => {})} />
        ))}
      </div>

      <div className="mission-section">
        <h3 className="mission-section-title">
          Weekly Missions <span className="mission-counter">{weeklyStats.completed}/{weeklyStats.total}</span>
        </h3>
        {state.weekly.map(m => (
          <MissionRow key={m.id} mission={m} onClaim={onClaim || (() => {})} />
        ))}
      </div>
    </div>
  );
};

export default MissionPanel;
