// HapticsManager — Device vibration feedback
// Uses navigator.vibrate API for mobile + fallback to Web Audio

export class HapticsManager {
  private enabled: boolean = true;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  // Light tap feedback
  tap() {
    if (!this.enabled) return;
    if (navigator.vibrate) {
      navigator.vibrate(5);
    }
  }

  // Hit feedback (for kills)
  hit() {
    if (!this.enabled) return;
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }
  }

  // Strong hit feedback (for big hits)
  strongHit() {
    if (!this.enabled) return;
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  }

  // Combo milestone feedback
  combo() {
    if (!this.enabled) return;
    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 50]);
    }
  }

  // Error/miss feedback
  error() {
    if (!this.enabled) return;
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  }
}

export const hapticsManager = new HapticsManager();