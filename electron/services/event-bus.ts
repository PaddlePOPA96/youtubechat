import { EventEmitter } from 'events';
import { ChatMessage, GiftEvent, Platform, ConnectionStatus, AppSettings } from '../../src/types';

export interface EventBusEvents {
  'chat-message': (msg: ChatMessage) => void;
  'gift-event': (gift: GiftEvent) => void;
  'gift-alert': (gift: GiftEvent) => void; // Triggered by GiftQueue for overlay animation
  'status-change': (platform: Platform, status: ConnectionStatus, error?: string) => void;
  'settings-updated': (settings: AppSettings) => void;
  'log': (level: 'info' | 'warn' | 'error', message: string, meta?: any) => void;
}

class TypedEventEmitter extends EventEmitter {
  emit<E extends keyof EventBusEvents>(event: E, ...args: Parameters<EventBusEvents[E]>): boolean {
    return super.emit(event, ...args);
  }

  on<E extends keyof EventBusEvents>(event: E, listener: EventBusEvents[E]): this {
    return super.on(event, listener as (...args: any[]) => void);
  }

  off<E extends keyof EventBusEvents>(event: E, listener: EventBusEvents[E]): this {
    return super.off(event, listener as (...args: any[]) => void);
  }
}

export const eventBus = new TypedEventEmitter();
