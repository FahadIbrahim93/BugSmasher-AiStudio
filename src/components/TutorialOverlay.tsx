import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { analytics } from '../lib/analytics';

const TUTORIAL_KEY = 'bugsmasher_tutorial_completed';

interface TutorialStep {
  id: string;
  title: string;
  body: string;
  target?: string;
  position: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to BugSmasher',
    body: 'Click on bugs to smash them. Survive as many waves as possible. Ready?',
    position: 'center',
  },
  {
    id: 'first_click',
    title: 'Click to Attack',
    body: 'Tap or click on a bug to deal damage. Each click costs energy that regenerates over time.',
    position: 'center',
  },
  {
    id: 'powerups',
    title: 'Collect Powerups',
    body: 'Defeated bugs drop powerups. Grab them for temporary boosts like shields, nukes, and slow-motion.',
    position: 'top',
  },
  {
    id: 'waves',
    title: 'Survive the Waves',
    body: 'Each wave is harder than the last. Bosses appear every 5 waves. Defeat them for big rewards.',
    position: 'center',
  },
  {
    id: 'prestige',
    title: 'Prestige System',
    body: 'After dying, you can Prestige to reset progress and earn permanent upgrades. The deeper you go, the more you earn.',
    position: 'bottom',
  },
  {
    id: 'daily',
    title: 'Daily Challenges',
    body: 'Complete daily challenges for bonus crystals. Build your login streak for escalating rewards.',
    position: 'left',
  },
];

export const TutorialOverlay: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(TUTORIAL_KEY) === 'true';
    if (!completed) {
      setVisible(true);
      analytics.track('tutorial_started');
    } else {
      onComplete();
    }
  }, [onComplete]);

  if (!visible) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;
  const isFirst = currentStep === 0;

  const handleNext = () => {
    analytics.track('tutorial_step_completed', { step: currentStep + 1, stepId: step.id });
    if (isLast) {
      localStorage.setItem(TUTORIAL_KEY, 'true');
      analytics.track('tutorial_completed');
      setVisible(false);
      onComplete();
    } else {
      setCurrentStep(s => s + 1);
    }
  };

  const handleSkip = () => {
    analytics.track('tutorial_skipped', { atStep: currentStep + 1 });
    localStorage.setItem(TUTORIAL_KEY, 'true');
    setVisible(false);
    onComplete();
  };

  const handlePrev = () => {
    if (!isFirst) setCurrentStep(s => s - 1);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="tutorial-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="tutorial-backdrop" />
        <motion.div
          className={`tutorial-card position-${step.position}`}
          key={step.id}
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: -20, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="tutorial-step-indicator">
            Step {currentStep + 1} of {TUTORIAL_STEPS.length}
          </div>
          <h2 className="tutorial-step-title">{step.title}</h2>
          <p className="tutorial-step-body">{step.body}</p>
          <div className="tutorial-controls">
            <button
              className="tutorial-btn tutorial-btn-skip"
              onClick={handleSkip}
              aria-label="Skip tutorial"
            >
              Skip
            </button>
            <div className="tutorial-dots">
              {TUTORIAL_STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`tutorial-dot ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'past' : ''}`}
                />
              ))}
            </div>
            <div className="tutorial-nav-buttons">
              {!isFirst && (
                <button className="tutorial-btn tutorial-btn-back" onClick={handlePrev}>
                  Back
                </button>
              )}
              <button className="tutorial-btn tutorial-btn-next" onClick={handleNext}>
                {isLast ? 'Got it!' : 'Next'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const resetTutorial = (): void => {
  localStorage.removeItem(TUTORIAL_KEY);
};

export default TutorialOverlay;
