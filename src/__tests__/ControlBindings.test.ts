import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  loadControlBindings,
  saveControlBindings,
  subscribeControlBindings,
  matchesBinding,
  DEFAULT_BINDINGS,
  type ControlBindings,
} from '../game/ControlBindings';

describe('ControlBindings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('DEFAULT_BINDINGS', () => {
    it('should have fire set to Mouse0', () => {
      expect(DEFAULT_BINDINGS.fire).toBe('Mouse0');
    });

    it('should have dash set to Space', () => {
      expect(DEFAULT_BINDINGS.dash).toBe('Space');
    });

    it('should have pause set to Escape', () => {
      expect(DEFAULT_BINDINGS.pause).toBe('Escape');
    });
  });

  describe('loadControlBindings', () => {
    it('should return default bindings when nothing is saved', () => {
      const bindings = loadControlBindings();
      expect(bindings).toEqual(DEFAULT_BINDINGS);
    });

    it('should return saved bindings merged with defaults', () => {
      const saved: Partial<ControlBindings> = { dash: 'ShiftLeft' };
      localStorage.setItem('bugsmasher_controls', JSON.stringify(saved));
      const bindings = loadControlBindings();
      expect(bindings.fire).toBe('Mouse0');
      expect(bindings.dash).toBe('ShiftLeft');
      expect(bindings.pause).toBe('Escape');
    });

    it('should return defaults when stored JSON is corrupted', () => {
      localStorage.setItem('bugsmasher_controls', 'not-json-at-all');
      const bindings = loadControlBindings();
      expect(bindings).toEqual(DEFAULT_BINDINGS);
    });

    it('should deep-clone the returned object so mutations are safe', () => {
      const bindings = loadControlBindings();
      bindings.fire = 'KeyA';
      const bindings2 = loadControlBindings();
      expect(bindings2.fire).toBe('Mouse0');
    });
  });

  describe('saveControlBindings', () => {
    it('should persist bindings to localStorage', () => {
      const custom: ControlBindings = { fire: 'KeyQ', dash: 'ShiftLeft', pause: 'KeyP' };
      saveControlBindings(custom);
      const raw = localStorage.getItem('bugsmasher_controls');
      expect(raw).toBe(JSON.stringify(custom));
    });

    it('should dispatch a custom event with the new bindings', () => {
      const listener = vi.fn();
      window.addEventListener('bugsmasher:controls-changed', listener);

      const custom: ControlBindings = { fire: 'KeyW', dash: 'KeyA', pause: 'KeyS' };
      saveControlBindings(custom);

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0][0] as CustomEvent<ControlBindings>;
      expect(event.detail).toEqual(custom);
    });

    it('should emit an event that loadControlBindings can read back', () => {
      const custom: ControlBindings = { fire: 'KeyR', dash: 'KeyT', pause: 'KeyY' };
      saveControlBindings(custom);

      const reloaded = loadControlBindings();
      expect(reloaded).toEqual(custom);
    });
  });

  describe('subscribeControlBindings', () => {
    it('should call the listener immediately with current bindings', () => {
      const listener = vi.fn();
      const unsub = subscribeControlBindings(listener);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(DEFAULT_BINDINGS);
      unsub();
    });

    it('should call the listener when bindings change', () => {
      const listener = vi.fn();
      const unsub = subscribeControlBindings(listener);
      listener.mockClear();

      const custom: ControlBindings = { fire: 'KeyF', dash: 'KeyG', pause: 'KeyH' };
      saveControlBindings(custom);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(custom);
      unsub();
    });

    it('should not call listener after unsubscribing', () => {
      const listener = vi.fn();
      const unsub = subscribeControlBindings(listener);
      listener.mockClear();

      unsub();
      saveControlBindings({ fire: 'KeyJ', dash: 'KeyK', pause: 'KeyL' });

      expect(listener).not.toHaveBeenCalled();
    });

    it('should return a function (cleanup)', () => {
      const listener = vi.fn();
      const unsub = subscribeControlBindings(listener);
      expect(typeof unsub).toBe('function');
      unsub();
    });
  });

  describe('matchesBinding', () => {
    it('should return true when code equals binding', () => {
      expect(matchesBinding('Space', 'Space')).toBe(true);
    });

    it('should return false when code differs from binding', () => {
      expect(matchesBinding('KeyA', 'Space')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(matchesBinding('space', 'Space')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(matchesBinding('', '')).toBe(true);
      expect(matchesBinding('KeyA', '')).toBe(false);
      expect(matchesBinding('', 'KeyA')).toBe(false);
    });
  });

  describe('SSR safety', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('loadControlBindings returns defaults without a window', () => {
      vi.stubGlobal('window', undefined);
      expect(loadControlBindings()).toEqual(DEFAULT_BINDINGS);
    });

    it('saveControlBindings is a no-op without a window', () => {
      vi.stubGlobal('window', undefined);
      expect(() => {
        saveControlBindings(DEFAULT_BINDINGS);
      }).not.toThrow();
    });

    it('subscribeControlBindings calls listener once without a window', () => {
      vi.stubGlobal('window', undefined);
      const listener = vi.fn();
      const unsub = subscribeControlBindings(listener);
      expect(listener).toHaveBeenCalledWith(DEFAULT_BINDINGS);
      unsub();
    });

    it('handler falls back to loaded bindings when event detail is missing', () => {
      const listener = vi.fn();
      const unsub = subscribeControlBindings(listener);
      listener.mockClear();

      window.dispatchEvent(new Event('bugsmasher:controls-changed'));
      expect(listener).toHaveBeenCalledWith(DEFAULT_BINDINGS);
      unsub();
    });
  });

  describe('round-trip integration', () => {
    it('should persist full custom bindings through save-then-load cycle', () => {
      const custom: ControlBindings = { fire: 'KeyX', dash: 'KeyC', pause: 'KeyV' };
      saveControlBindings(custom);

      const loaded = loadControlBindings();
      expect(loaded.fire).toBe('KeyX');
      expect(loaded.dash).toBe('KeyC');
      expect(loaded.pause).toBe('KeyV');
    });

    it('should handle partial updates correctly', () => {
      saveControlBindings({ fire: 'KeyB', dash: 'KeyN', pause: 'KeyM' });

      // Simulate partial update by saving only fire
      const current = loadControlBindings();
      current.fire = 'KeyU';
      saveControlBindings(current);

      const reloaded = loadControlBindings();
      expect(reloaded.fire).toBe('KeyU');
      expect(reloaded.dash).toBe('KeyN');
      expect(reloaded.pause).toBe('KeyM');
    });
  });
});
