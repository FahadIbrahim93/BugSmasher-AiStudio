/**
 * Tests for AchievementToast — verifies the unlock toast fires correctly when
 * the 'achievement_unlocked' event is dispatched (as AchievementManager.notify
 * does during FURY / slam / goo-sweep), and that it shows the achievement's
 * own icon (flame) rather than a generic trophy.
 *
 * Uses jsdom + React 19's createRoot API directly (no @testing-library dependency).
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { Achievement } from '../game/AchievementManager';

// Mock motion (framer-motion) to avoid jsdom incompatibilities
vi.mock('motion/react', () => ({
  motion: { div: 'div' },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

import { AchievementToast } from '../components/AchievementToast';

interface RenderResult {
  container: HTMLElement;
  root: Root;
}

function renderComponent(component: React.ReactElement): RenderResult {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(component);
  });
  return { container, root };
}

function cleanup(result: RenderResult) {
  act(() => {
    result.root.unmount();
  });
  document.body.removeChild(result.container);
}

function dispatchUnlock(achievement: Omit<Achievement, 'unlocked'>) {
  act(() => {
    window.dispatchEvent(new CustomEvent('achievement_unlocked', { detail: achievement }));
  });
}

const flameAchievement: Omit<Achievement, 'unlocked'> = {
  id: 'first_fury',
  title: 'Venting 101',
  description: 'Ignite FURY MODE for the first time.',
  icon: 'flame',
  check: () => true,
};

describe('AchievementToast', () => {
  let result: RenderResult | null = null;

  afterEach(() => {
    if (result) {
      cleanup(result);
      result = null;
    }
    vi.useRealTimers();
  });

  it('renders nothing before any achievement unlocks', () => {
    result = renderComponent(React.createElement(AchievementToast));
    expect(result.container.textContent).toBe('');
  });

  it('fires a toast showing the title and description when FURY unlocks', () => {
    result = renderComponent(React.createElement(AchievementToast));
    dispatchUnlock(flameAchievement);
    expect(result.container.textContent).toContain('Venting 101');
    expect(result.container.textContent).toContain('Ignite FURY MODE for the first time.');
  });

  it('shows the flame icon for the FURY achievement instead of a generic trophy', () => {
    result = renderComponent(React.createElement(AchievementToast));
    dispatchUnlock(flameAchievement);
    expect(result.container.querySelector('svg.lucide-flame')).not.toBeNull();
    expect(result.container.querySelector('svg.lucide-trophy')).toBeNull();
  });

  it('shows the hammer icon when Ground Slammer unlocks', () => {
    result = renderComponent(React.createElement(AchievementToast));
    dispatchUnlock({
      id: 'ground_slammer',
      title: 'Ground Slammer',
      description: 'Land 10 Ground Slams.',
      icon: 'hammer',
      check: () => true,
    });
    expect(result.container.querySelector('svg.lucide-hammer')).not.toBeNull();
  });

  it('shows the sparkles icon when Clean Sweep unlocks', () => {
    result = renderComponent(React.createElement(AchievementToast));
    dispatchUnlock({
      id: 'clean_sweep',
      title: 'Clean Sweep',
      description: 'Recycle 25 chunks of goo contamination.',
      icon: 'sparkles',
      check: () => true,
    });
    expect(result.container.querySelector('svg.lucide-sparkles')).not.toBeNull();
  });

  it('auto-dismisses the toast after 5 seconds', () => {
    vi.useFakeTimers();
    result = renderComponent(React.createElement(AchievementToast));
    dispatchUnlock(flameAchievement);
    expect(result.container.textContent).toContain('Venting 101');
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.container.textContent).toBe('');
  });
});
