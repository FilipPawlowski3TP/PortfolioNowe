// Adaptive quality (masterprompt 11.3): sample ~90 frames; if p95 frame time
// exceeds 22 ms, step down — DPR (0.25 -> min 1.0), then tier.
// Never upgrades mid-session (avoids flicker).
import type { Tier } from './tier';

export interface AdaptiveCallbacks {
  setDpr(dpr: number): void;
  downgradeTier(): void;
}

const TARGET_P95_MS = 22;
const SAMPLE = 90;

export class AdaptiveController {
  private frames: number[] = [];
  private lastTime = 0;
  private dpr: number;
  private steppedDown = false;

  constructor(
    tier: Tier,
    coarse: boolean,
    private callbacks: AdaptiveCallbacks,
  ) {
    // Budgets from masterprompt 11.3
    this.dpr = tier === 2 ? (coarse ? 1.25 : 1.75) : 1;
    callbacks.setDpr(this.dpr);
  }

  sample(now: number): void {
    if (this.lastTime) this.frames.push(now - this.lastTime);
    this.lastTime = now;
    if (this.frames.length < SAMPLE) return;

    const sorted = [...this.frames].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    this.frames = [];
    if (p95 <= TARGET_P95_MS || (this.steppedDown && this.dpr <= 1)) return;

    if (this.dpr > 1) {
      this.dpr = Math.max(1, this.dpr - 0.25);
      this.callbacks.setDpr(this.dpr);
    } else {
      this.steppedDown = true;
      this.callbacks.downgradeTier();
    }
  }
}
