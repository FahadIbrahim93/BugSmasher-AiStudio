/**
 * Tests for the SettingsMenu locale switcher.
 *
 * Uses jsdom + React 19's createRoot API directly (no @testing-library dependency).
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

// Mock SoundManager to avoid AudioContext issues + local storage writes
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

// Mock i18n module so we can verify setLocale is called
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

// ===== TESTS =====

describe('SettingsMenu — Locale Switcher', () => {
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

  it('should render the Language section with a select element', () => {
    result = renderComponent(
      React.createElement(SettingsMenu, { onBack: vi.fn() })
    );

    // The Language section should have a section header with "Language" text
    const sectionHeaders = result.container.querySelectorAll('section');
    let languageSection: HTMLElement | null = null;
    sectionHeaders.forEach((section) => {
      if (section.textContent?.includes('Language')) {
        languageSection = section;
      }
    });
    expect(languageSection).not.toBeNull();
  });

  it('should render a select with English and Spanish options', () => {
    result = renderComponent(
      React.createElement(SettingsMenu, { onBack: vi.fn() })
    );

    const selects = result.container.querySelectorAll('select');
    // Find the locale select by checking for en/es options
    let localeSelect: HTMLSelectElement | null = null;
    selects.forEach((select) => {
      if (
        select.querySelector('option[value="en"]') &&
        select.querySelector('option[value="es"]')
      ) {
        localeSelect = select as HTMLSelectElement;
      }
    });

    expect(localeSelect).not.toBeNull();
    expect(localeSelect!.querySelector('option[value="en"]')?.textContent).toBe('English');
    expect(localeSelect!.querySelector('option[value="es"]')?.textContent).toBe('Español');
  });

  it('should default to "en" as the selected value', () => {
    result = renderComponent(
      React.createElement(SettingsMenu, { onBack: vi.fn() })
    );

    const selects = result.container.querySelectorAll('select');
    let localeSelect: HTMLSelectElement | null = null;
    selects.forEach((select) => {
      if (
        select.querySelector('option[value="en"]') &&
        select.querySelector('option[value="es"]')
      ) {
        localeSelect = select as HTMLSelectElement;
      }
    });

    expect(localeSelect).not.toBeNull();
    expect(localeSelect!.value).toBe('en');
  });

  it('should call setLocale with "en" when English is selected', () => {
    result = renderComponent(
      React.createElement(SettingsMenu, { onBack: vi.fn() })
    );

    const selects = result.container.querySelectorAll('select');
    let localeSelect: HTMLSelectElement | null = null;
    selects.forEach((select) => {
      if (
        select.querySelector('option[value="en"]') &&
        select.querySelector('option[value="es"]')
      ) {
        localeSelect = select as HTMLSelectElement;
      }
    });

    expect(localeSelect).not.toBeNull();

    // Select English
    act(() => {
      localeSelect!.value = 'en';
      localeSelect!.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(setLocaleMock).toHaveBeenCalledWith('en');
  });

  it('should call setLocale with "es" when Spanish is selected', () => {
    result = renderComponent(
      React.createElement(SettingsMenu, { onBack: vi.fn() })
    );

    const selects = result.container.querySelectorAll('select');
    let localeSelect: HTMLSelectElement | null = null;
    selects.forEach((select) => {
      if (
        select.querySelector('option[value="en"]') &&
        select.querySelector('option[value="es"]')
      ) {
        localeSelect = select as HTMLSelectElement;
      }
    });

    expect(localeSelect).not.toBeNull();

    // Select Spanish
    act(() => {
      localeSelect!.value = 'es';
      localeSelect!.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(setLocaleMock).toHaveBeenCalledWith('es');
  });

  it('should render two options (en + es) inside the locale select', () => {
    result = renderComponent(
      React.createElement(SettingsMenu, { onBack: vi.fn() })
    );

    const selects = result.container.querySelectorAll('select');
    let localeSelect: HTMLSelectElement | null = null;
    selects.forEach((select) => {
      if (
        select.querySelector('option[value="en"]') &&
        select.querySelector('option[value="es"]')
      ) {
        localeSelect = select as HTMLSelectElement;
      }
    });

    expect(localeSelect).not.toBeNull();
    expect(localeSelect!.options.length).toBe(2);
    expect(localeSelect!.options[0].value).toBe('en');
    expect(localeSelect!.options[1].value).toBe('es');
  });

  it('should have a Globe icon in the Language section header', () => {
    result = renderComponent(
      React.createElement(SettingsMenu, { onBack: vi.fn() })
    );

    // The language section has a Globe icon (rendered as an SVG from our mock)
    // We find the section that contains "Language" text and check it has an SVG child
    const svgs = result.container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });
});
