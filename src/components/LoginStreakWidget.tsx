import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LoginStreakManager, STREAK_REWARDS, type StreakReward } from '../game/LoginStreakManager';
import { analytics } from '../lib/analytics';

interface LoginStreakWidgetProps {
  onClaim?: (reward: StreakReward) => void;
}

export const LoginStreakWidget: React.FC<LoginStreakWidgetProps> = ({ onClaim }) => {
  const [state, setState] = useState(LoginStreakManager.getState());
  const [showModal, setShowModal] = useState(false);
  const [pendingReward, setPendingReward] = useState<StreakReward | null>(null);

  useEffect(() => {
    const result = LoginStreakManager.checkIn();
    if (result.isNewDay && result.reward) {
      setPendingReward(result.reward);
      setShowModal(true);
      setState(LoginStreakManager.getState());
      analytics.track('login_streak_day', { day: result.streak, reward: result.reward.crystals });
    }
  }, []);

  const handleClaim = () => {
    if (pendingReward && onClaim) {
      onClaim(pendingReward);
      analytics.track('daily_reward_claimed', { day: state.currentStreak, crystals: pendingReward.crystals });
    }
    setShowModal(false);
    setPendingReward(null);
  };

  const nextReward = LoginStreakManager.getNextReward(state.currentStreak);

  return (
    <>
      <button
        className="login-streak-badge"
        onClick={() => setShowModal(true)}
        aria-label={`Login streak: ${state.currentStreak} days`}
      >
        <span className="streak-icon">🔥</span>
        <span className="streak-count">{state.currentStreak}</span>
        <span className="streak-label">day{state.currentStreak !== 1 ? 's' : ''}</span>
      </button>

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="login-streak-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="login-streak-modal"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="login-streak-title">Daily Streak</h2>
              <div className="login-streak-current">
                <span className="big-number">{state.currentStreak}</span>
                <span className="label">Day Streak</span>
              </div>

              <div className="login-streak-rewards-grid">
                {STREAK_REWARDS.map((reward) => {
                  const isPast = state.currentStreak > reward.day;
                  const isCurrent = state.currentStreak === reward.day;
                  return (
                    <div
                      key={reward.day}
                      className={`reward-cell ${isPast ? 'past' : ''} ${isCurrent ? 'current' : ''}`}
                    >
                      <span className="reward-icon">{reward.icon}</span>
                      <span className="reward-day">Day {reward.day}</span>
                      <span className="reward-crystals">+{reward.crystals}</span>
                    </div>
                  );
                })}
              </div>

              {pendingReward && (
                <div className="login-streak-claim-box">
                  <p>Today's Reward: <strong>+{pendingReward.crystals} crystals</strong></p>
                  <button className="claim-button" onClick={handleClaim}>
                    Claim Reward
                  </button>
                </div>
              )}

              {!pendingReward && (
                <div className="login-streak-next">
                  <p>Next reward: <strong>+{nextReward.crystals} crystals</strong></p>
                  <p className="hint">Come back tomorrow!</p>
                </div>
              )}

              <p className="login-streak-longest">
                Longest streak: <strong>{state.longestStreak}</strong>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LoginStreakWidget;
