export class RateLimiter {
  private lastCall = 0;
  private readonly minInterval: number;

  constructor(requestsPerSecond: number = 4) {
    this.minInterval = 1000 / requestsPerSecond;
  }

  async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastCall;
    if (elapsed < this.minInterval) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.minInterval - elapsed)
      );
    }
    this.lastCall = Date.now();
  }
}
