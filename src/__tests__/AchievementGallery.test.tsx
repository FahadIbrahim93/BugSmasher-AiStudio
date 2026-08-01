/**
 * Tests for AchievementGallery — verifies the 4 venting achievements are
 * surfaced with real lucide icons (flame/hammer/sparkles), not plain text.
 *
 * Uses jsdom + React 19's createRoot API directly (no @testing-library dependency).
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

// Mock SoundManager to avoid AudioContext issues
vi.mock('../game/SoundManager', () => ({
  soundManager: {
    uiClick: vi.fn(),
  },
}));

import { AchievementGallery } from '../components/AchievementGallery';

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

describe('AchievementGallery', () => {
  let result: RenderResult | null = null;

  afterEach(() => {
    if (result) {
      cleanup(result);
      result = null;
    }
  });

  const onClose = vi.fn();

  it('renders all achievement cards including the 4 venting achievements', () => {
    result = renderComponent(React.createElement(AchievementGallery, { onClose }));
    const cards = result.container.querySelectorAll('[data-achievement-id]');
    expect(cards.length).toBeGreaterThanOrEqual(14);

    const ids = Array.from(cards).map((c) => c.getAttribute('data-achievement-id'));
    expect(ids).toContain('first_fury');
    expect(ids).toContain('fury_master');
    expect(ids).toContain('ground_slammer');
    expect(ids).toContain('clean_sweep');
  });

  it('renders a flame lucide icon for the FURY achievements', () => {
    result = renderComponent(React.createElement(AchievementGallery, { onClose }));
    expect(result.container.querySelector('svg.lucide-flame')).not.toBeNull();
  });

  it('renders a hammer lucide icon for Ground Slammer', () => {
    result = renderComponent(React.createElement(AchievementGallery, { onClose }));
    expect(result.container.querySelector('svg.lucide-hammer')).not.toBeNull();
  });

  it('renders a sparkles lucide icon for Clean Sweep', () => {
    result = renderComponent(React.createElement(AchievementGallery, { onClose }));
    expect(result.container.querySelector('svg.lucide-sparkles')).not.toBeNull();
  });

  it('does not render raw icon key text anymore', () => {
    result = renderComponent(React.createElement(AchievementGallery, { onClose }));
    const text = result.container.textContent || '';
    expect(text).not.toContain('flame');
    expect(text).not.toContain('hammer');
    expect(text).not.toContain('sparkles');
  });
});
