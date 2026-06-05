import { describe, it, expect } from 'vitest';
import { CameraShake, cameraShake, SHAKE_PRESETS, HITSTOP_PRESETS } from '../game/CameraShake';

describe('CameraShake', () => {
  it('starts with zero intensity', () => {
    const cam = new CameraShake();
    expect(cam['intensity']).toBe(0);
  });

  it('applies shake on trigger', () => {
    const cam = new CameraShake();
    cam.shake(10, 100);
    cam.update(16);
    expect(cam['offsetX']).not.toBe(0);
  });

  it('resets after duration expires', () => {
    const cam = new CameraShake();
    cam.shake(10, 50);
    cam.update(100);
    expect(cam['offsetX']).toBe(0);
  });

  it('handles hitstop', () => {
    const cam = new CameraShake();
    expect(cam.isHitstopActive()).toBe(false);
    cam.hitstop(50);
    expect(cam.isHitstopActive()).toBe(true);
    cam.update(60);
    expect(cam.isHitstopActive()).toBe(false);
  });

  it('exports named preset constants', () => {
    expect(SHAKE_PRESETS.boss.intensity).toBe(18);
    expect(HITSTOP_PRESETS.boss_kill).toBe(150);
  });

  it('singleton instance is accessible', () => {
    expect(cameraShake).toBeDefined();
    expect(cameraShake).toBeInstanceOf(CameraShake);
  });

  it('can be reset', () => {
    const cam = new CameraShake();
    cam.shake(20, 200);
    cam.hitstop(100);
    cam.reset();
    expect(cam['intensity']).toBe(0);
    expect(cam.isHitstopActive()).toBe(false);
  });
});
