import { GiftEvent } from '../../src/types';
import { eventBus } from './event-bus';

export class GiftQueue {
  private queue: GiftEvent[] = [];
  private isProcessing = false;
  private currentGift: GiftEvent | null = null;
  private queueLimit = 30;
  private displayDurationMs = 4000;
  private delayMs = 500;
  private streakMap = new Map<string, GiftEvent>(); // key: username:giftId
  private streakTimerMap = new Map<string, NodeJS.Timeout>();

  constructor() {
    eventBus.on('gift-event', (gift) => {
      this.handleIncomingGift(gift);
    });

    eventBus.on('settings-updated', (settings) => {
      this.queueLimit = settings.giftQueueLimit || 30;
      this.displayDurationMs = (settings.giftDurationSeconds || 4) * 1000;
      this.delayMs = (settings.giftDelaySeconds !== undefined ? settings.giftDelaySeconds : 0.5) * 1000;
    });
  }

  public setDuration(seconds: number) {
    this.displayDurationMs = Math.max(1000, seconds * 1000);
  }

  public handleIncomingGift(gift: GiftEvent) {
    const streakKey = `${gift.username}:${gift.giftId || gift.giftName}`;

    // If repeatEnd is true or no repeatCount / streak, it is a finalized gift
    if (gift.repeatEnd === false) {
      // Streak in progress!
      this.streakMap.set(streakKey, gift);

      // Debounce finalize streak if repeatEnd never comes
      if (this.streakTimerMap.has(streakKey)) {
        clearTimeout(this.streakTimerMap.get(streakKey)!);
      }
      const timer = setTimeout(() => {
        const finalGift = this.streakMap.get(streakKey);
        if (finalGift) {
          this.enqueueGift(finalGift);
          this.streakMap.delete(streakKey);
          this.streakTimerMap.delete(streakKey);
        }
      }, 1500);
      this.streakTimerMap.set(streakKey, timer);
      return;
    }

    // Finished streak or single gift
    if (this.streakTimerMap.has(streakKey)) {
      clearTimeout(this.streakTimerMap.get(streakKey)!);
      this.streakTimerMap.delete(streakKey);
    }
    this.streakMap.delete(streakKey);

    this.enqueueGift(gift);
  }

  public enqueueGift(gift: GiftEvent) {
    if (this.queue.length >= this.queueLimit) {
      // Drop oldest if limit exceeded
      this.queue.shift();
    }

    this.queue.push(gift);
    this.processNext();
  }

  private processNext() {
    if (this.isProcessing) return;
    if (this.queue.length === 0) {
      this.currentGift = null;
      return;
    }

    this.isProcessing = true;
    this.currentGift = this.queue.shift()!;

    // Emit gift alert to overlay clients
    eventBus.emit('gift-alert', this.currentGift);

    // Wait for the duration of the animation + delay between spam gifts
    const totalWait = this.displayDurationMs + this.delayMs + 450;
    setTimeout(() => {
      this.isProcessing = false;
      this.processNext();
    }, totalWait);
  }

  public getCurrentGift(): GiftEvent | null {
    return this.currentGift;
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public clear() {
    this.queue = [];
    this.isProcessing = false;
    this.currentGift = null;
    this.streakMap.clear();
    this.streakTimerMap.forEach((t) => clearTimeout(t));
    this.streakTimerMap.clear();
  }
}

export const giftQueue = new GiftQueue();
