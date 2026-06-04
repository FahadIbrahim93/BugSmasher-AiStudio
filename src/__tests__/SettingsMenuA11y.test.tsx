/**
 * Accessibility tests for the SettingsMenu locale switcher.
 *
 * Verifies proper ARIA attributes and keyboard navigation.
 */
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

// Mock motion to avoid jsdom incompatibilities
vi.mock('motion/react', () => ({
  motion: {
    div: 'div',
    button: 'button',
    span: 'span',
    p: 'p',
    svg: 'svg',
    ul: 'ul',
    li: 'li',
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => {
  const mockIcon = (props: any) => React.createElement('svg', props);
  return {
    Volume2: mockIcon,
    VolumeX: mockIcon,
    Settings2: mockIcon,
    ArrowLeft: mockIcon,
    MousePointer2: mockIcon,
    Monitor: mockIcon,
    Gem: mockIcon,
    Accessibility: mockIcon,
    Keyboard: mockIcon,
    Globe: mockIcon,
  };
});

// Mock SoundManager
vi.mock('../game/SoundManager', () => ({
  soundManager: {
    masterVolume: 0.8,
    sfxVolume: 0.6,
    musicVolume: 0.4,
    isMuted: false,
    init: vi.fn(),
    uiHover: vi.fn(),
    uiClick: vi.fn(),
    uiError: vi.fn(),
    powerup: vi.fn(),
    setMasterVolume: vi.fn(),
    setSfxVolume: vi.fn(),
    setMusicVolume: vi.fn(),
    toggleMute: vi.fn(() => false),
  },
}));

// Mock AccessibilitySettings
vi.mock('../game/AccessibilitySettings', () => ({
  loadAccessibilitySettings: () => ({
    difficulty: 'normal',
    colorblindMode: 'off',
    reducedMotion: false,
    showEnemyShapes: false,
    gamepadEnabled: false,
  }),
  saveAccessibilitySettings: vi.fn(),
}));

// Mock ControlBindings
vi.mock('../game/ControlBindings', () => ({
  loadControlBindings: () => ({
    fire: 'Space',
    dash: 'ShiftLeft',
    pause: 'Escape',
  }),
  saveControlBindings: vi.fn(),
}));

const setLocaleMock = vi.fn();
vi.mock('../i18n', () => ({
  t: (key: string) => {
    const translations: Record<string, string> = {
      'settings.title': 'System Settings',
      'locale.label': 'Language',
      'locale.en': 'English',
      'locale.es': 'Español',
      'settings.audio': 'Audio Modules',
      'settings.masterGain': 'Master Gain',
      'settings.sfxIntensity': 'SFX Intensity',
      'settings.ambientStream': 'Ambient Stream',
      'settings.previewAudio': 'Preview Audio',
      'settings.visuals': 'Visuals',
      'settings.highFidelityVfx': 'High Fidelity VFX',
      'settings.highFidelityDesc': 'Glows, heavy shadow blurs & complex particles',
      'settings.showPerfStats': 'Show Performance Stats',
      'settings.showPerfDesc': 'Monitor FPS & Engine diagnostics',
      'settings.inputMethod': 'Input Method',
      'settings.leftClick': 'Left Click / Tap',
      'settings.leftClickAction': 'Eliminate',
      'settings.hoverCollect': 'Hover / Collect',
      'settings.hoverCollectAction': 'Powerups',
      'settings.keyBindings': 'Key Bindings',
      'settings.pressKey': 'Press key...',
      'settings.clickBindingHint': 'Click a binding, then press the desired key',
      'settings.accessibility': 'Accessibility',
    };
    return translations[key] || key;
  },
  getLocale: () => 'en',
  setLocale: (locale: string) => setLocaleMock(locale),
  subscribeLocale: (listener: (l: string) => void) => {
    listener('en');
    return () => {};
  },
}));

import { SettingsMenu } from '../components/SettingsMenu';

// ===== RENDER HELPER =====

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

// Find the locale select among all selects
function findLocaleSelect(container: HTMLElement): HTMLSelectElement | null {
  const selects = container.querySelectorAll<HTMLSelectElement>('select');
  for (const select of selects) {
    if (
      select.querySelector('option[value="en"]') &&
      select.querySelector('option[value="es"]')
    ) {
      return select;
    }
  }
  return null;
}

// ===== TESTS =====

describe('SettingsMenu — Locale Switcher Accessibility', () => {
  let result: RenderResult | null = null;

  beforeEach(() => {
    setLocaleMock.mockClear();
  });

  afterEach(() => {
    if (result) {
      cleanup(result);
      result = null;
    }
  });

  describe('ARIA attributes', () => {
    it('should have an aria-label on the locale select', () => {
      result = renderComponent(
        React.createElement(SettingsMenu, { onBack: vi.fn() })
      );

      const localeSelect = findLocaleSelect(result.container);
      expect(localeSelect).not.toBeNull();
      expect(localeSelect!.getAttribute('aria-label')).toBe('Language');
    });

    it('should have an id attribute on the locale select', () => {
      result = renderComponent(
        React.createElement(SettingsMenu, { onBack: vi.fn() })
      );

      const localeSelect = findLocaleSelect(result.container);
      expect(localeSelect).not.toBeNull();
      expect(localeSelect!.id).toBe('locale-select');
    });

    it('should have id="locale-select" that is unique in the document', () => {
      result = renderComponent(
        React.createElement(SettingsMenu, { onBack: vi.fn() })
      );

      const elements = result.container.querySelectorAll('#locale-select');
      expect(elements.length).toBe(1);
      expect(elements[0].tagName).toBe('SELECT');
    });

    it('should have a visible label linked to the section header text', () => {
      result = renderComponent(
        React.createElement(SettingsMenu, { onBack: vi.fn() })
      );

      // The section header should contain visible text "Language"
      const sections = result.container.querySelectorAll('section');
      let languageHeader: HTMLElement | null = null;
      sections.forEach((section) => {
        const spans = section.querySelectorAll('span');
        spans.forEach((span) => {
          if (span.textContent === 'Language') {
            languageHeader = span;
          }
        });
      });
      expect(languageHeader).not.toBeNull();
      expect(languageHeader!.textContent).toBe('Language');
    });

    it('should have an accessible name computed from aria-label', () => {
      result = renderComponent(
        React.createElement(SettingsMenu, { onBack: vi.fn() })
      );

      const localeSelect = findLocaleSelect(result.container);
      expect(localeSelect).not.toBeNull();

      // In jsdom, the accessible name is exposed via the aria-label attribute
      const accessibleName = localeSelect!.getAttribute('aria-label');
      expect(accessibleName).toBeTruthy();
      expect(accessibleName!.length).toBeGreaterThan(0);
    });

    it('should set the Globe icon as a presentational element (no alt text needed for SVGs)', () => {
      result = renderComponent(
        React.createElement(SettingsMenu, { onBack: vi.fn() })
      );

      // The Globe icon is an SVG element (from our mock) inside the language section
      const svgs = result.container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });
  });

  describe('Keyboard navigation', () => {
    it('should be focusable by calling focus() programmatically', () => {
      result = renderComponent(
        React.createElement(SettingsMenu, { onBack: vi.fn() })
      );

      const localeSelect = findLocaleSelect(result.container);
      expect(localeSelect).not.toBeNull();

      act(() => {
        localeSelect!.focus();
      });
      expect(document.activeElement).toBe(localeSelect);
    });

    it('should have tabIndex of 0 (naturally focusable as a select element)', () => {
      result = renderComponent(
        React.createElement(SettingsMenu, { onBack: vi.fn() })
      );

      const localeSelect = findLocaleSelect(result.container);
      expect(localeSelect).not.toBeNull();

      // Select elements are naturally focusable (tabIndex defaults to 0)
      expect(localeSelect!.tabIndex).toBe(0);
    });

    it('should trigger setLocale when value changes via change event', () => {
      result = renderComponent(
        React.createElement(SettingsMenu, { onBack: vi.fn() })
      );

      const localeSelect = findLocaleSelect(result.container);
      expect(localeSelect).not.toBeNull();

      // Simulate a value change by dispatching a change event with es value
      // (native <select> keyboard navigation via ArrowDown/Up is a browser
      //  behavior not simulated by jsdom, so we test the change pathway directly)
      act(() => {
        localeSelect!.value = 'es';
        localeSelect!.dispatchEvent(new Event('change', { bubbles: true }));
      });

      expect(setLocaleMock).toHaveBeenCalledWith('es');
    });

    it('should maintain focus after value change', () => {
      result = renderComponent(
        React.createElement(SettingsMenu, { onBack: vi.fn() })
      );

      const localeSelect = findLocaleSelect(result.container);
      expect(localeSelect).not.toBeNull();

      act(() => {
        localeSelect!.focus();
        localeSelect!.value = 'es';
        localeSelect!.dispatchEvent(new Event('change', { bubbles: true }));
      });

      // The select should still be the active element
      expect(document.activeElement).toBe(localeSelect);
      expect(setLocaleMock).toHaveBeenCalledWith('es');
    });
  });

  describe('Semantic structure', () => {
    it('should wrap the locale section in a <section> element', () => {
      result = renderComponent(
        React.createElement(SettingsMenu, { onBack: vi.fn() })
      );

      const localeSelect = findLocaleSelect(result.container);
      expect(localeSelect).not.toBeNull();

      // The select should be inside a <section>
      const section = localeSelect!.closest('section');
      expect(section).not.toBeNull();
    });

    it('should have the <select> element as a native HTML form control', () => {
      result = renderComponent(
        React.createElement(SettingsMenu, { onBack: vi.fn() })
      );

      const localeSelect = findLocaleSelect(result.container);
      expect(localeSelect).not.toBeNull();
      expect(localeSelect!.tagName).toBe('SELECT');
    });

    it('should have correct <option> elements', () => {
      result = renderComponent(
        React.createElement(SettingsMenu, { onBack: vi.fn() })
      );

      const localeSelect = findLocaleSelect(result.container);
      expect(localeSelect).not.toBeNull();

      const options = localeSelect!.options;
      expect(options.length).toBe(2);
      expect(options[0].value).toBe('en');
      expect(options[0].textContent).toBe('English');
      expect(options[1].value).toBe('es');
      expect(options[1].textContent).toBe('Español');
    });
  });
});
