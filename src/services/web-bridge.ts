import { ChatMessage, GiftEvent, AppSettings, Platform, ConnectionStatus, DEFAULT_SETTINGS } from '../types';

interface WebBridgeAPI {
  connectYouTube: (target: string) => Promise<{ success: boolean; error?: string }>;
  disconnectYouTube: () => Promise<void>;
  getYouTubeStatus: () => Promise<{ status: ConnectionStatus; target: string }>;

  connectTikTok: (username: string) => Promise<{ success: boolean; error?: string }>;
  disconnectTikTok: () => Promise<void>;
  getTikTokStatus: () => Promise<{ status: ConnectionStatus; username: string }>;

  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;

  sendTestChat: (custom?: Partial<ChatMessage>) => Promise<void>;
  sendTestGift: (custom?: Partial<GiftEvent>) => Promise<void>;
  replayGift: (gift: GiftEvent) => Promise<void>;

  getOverlayUrls: () => Promise<{ chat: string; gifts: string; all: string; port: number }>;

  onChatMessage: (callback: (msg: ChatMessage) => void) => () => void;
  onGiftEvent: (callback: (gift: GiftEvent) => void) => () => void;
  onStatusChange: (callback: (platform: Platform, status: ConnectionStatus, error?: string) => void) => () => void;
  onLog: (callback: (level: 'info' | 'warn' | 'error', message: string) => void) => () => void;
  openExternal: (url: string) => Promise<void>;

  isAlwaysOnTop: () => Promise<boolean>;
  setAlwaysOnTop: (flag: boolean) => Promise<boolean>;
}

class WebBridge {
  private ws: WebSocket | null = null;
  private chatListeners = new Set<(msg: ChatMessage) => void>();
  private giftListeners = new Set<(gift: GiftEvent) => void>();
  private statusListeners = new Set<(platform: Platform, status: ConnectionStatus, error?: string) => void>();
  private logListeners = new Set<(level: 'info' | 'warn' | 'error', message: string) => void>();

  private youtubeStatus: ConnectionStatus = 'disconnected';
  private youtubeTarget = '';
  private tiktokStatus: ConnectionStatus = 'disconnected';
  private tiktokUsername = '';
  private cachedSettings: AppSettings = { ...DEFAULT_SETTINGS };

  private isConnected = false;
  private reconnectTimer: any = null;

  constructor() {
    this.connectWs();
  }

  private getWsUrl(): string {
    const isHttps = window.location.protocol === 'https:';
    const proto = isHttps ? 'wss:' : 'ws:';
    // When served via Vite (port 5173), Vite proxies /ws to 3210
    return `${proto}//${window.location.host}/ws`;
  }

  private connectWs() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    try {
      const url = this.getWsUrl();
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.emitLog('info', '✅ Terhubung ke StreamChat Live Backend via WebSocket');
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.handleIncoming(payload);
        } catch {
          // ignore
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        // Auto-reconnect after 2 seconds
        this.reconnectTimer = setTimeout(() => this.connectWs(), 2000);
      };

      this.ws.onerror = () => {
        this.isConnected = false;
      };
    } catch {
      this.reconnectTimer = setTimeout(() => this.connectWs(), 3000);
    }
  }

  private handleIncoming(payload: any) {
    if (!payload || !payload.type) return;

    if (payload.type === 'init' || payload.type === 'init-full') {
      if (payload.settings) this.cachedSettings = { ...payload.settings };
      if (payload.youtube) {
        this.youtubeStatus = payload.youtube.status || 'disconnected';
        this.youtubeTarget = payload.youtube.target || '';
        this.emitStatus('youtube', this.youtubeStatus);
      }
      if (payload.tiktok) {
        this.tiktokStatus = payload.tiktok.status || 'disconnected';
        this.tiktokUsername = payload.tiktok.username || '';
        this.emitStatus('tiktok', this.tiktokStatus);
      }
    } else if (payload.type === 'chat' && payload.data) {
      for (const listener of this.chatListeners) {
        try {
          listener(payload.data);
        } catch (e) {
          console.error(e);
        }
      }
    } else if ((payload.type === 'gift-alert' || payload.type === 'gift') && payload.data) {
      for (const listener of this.giftListeners) {
        try {
          listener(payload.data);
        } catch (e) {
          console.error(e);
        }
      }
    } else if (payload.type === 'status-change') {
      if (payload.platform === 'youtube') {
        this.youtubeStatus = payload.status;
      } else if (payload.platform === 'tiktok') {
        this.tiktokStatus = payload.status;
      }
      this.emitStatus(payload.platform, payload.status, payload.error);
    } else if (payload.type === 'log') {
      this.emitLog(payload.level || 'info', payload.message || '');
    } else if (payload.type === 'settings' && payload.data) {
      this.cachedSettings = { ...payload.data };
    }
  }

  private emitStatus(platform: Platform, status: ConnectionStatus, error?: string) {
    for (const listener of this.statusListeners) {
      try {
        listener(platform, status, error);
      } catch (e) {
        console.error(e);
      }
    }
  }

  private emitLog(level: 'info' | 'warn' | 'error', message: string) {
    for (const listener of this.logListeners) {
      try {
        listener(level, message);
      } catch (e) {
        console.error(e);
      }
    }
  }

  // --- API Implementation ---
  public getApi(): WebBridgeAPI {
    return {
      connectYouTube: async (target: string) => {
        this.youtubeTarget = target;
        try {
          const res = await fetch('/api/youtube/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target }),
          });
          const data = await res.json();
          return data;
        } catch (err: any) {
          return { success: false, error: err.message };
        }
      },

      disconnectYouTube: async () => {
        try {
          await fetch('/api/youtube/disconnect', { method: 'POST' });
        } catch {
          // ignore
        }
      },

      getYouTubeStatus: async () => {
        try {
          const res = await fetch('/api/youtube/status');
          const data = await res.json();
          this.youtubeStatus = data.status;
          this.youtubeTarget = data.target;
          return data;
        } catch {
          return { status: this.youtubeStatus, target: this.youtubeTarget };
        }
      },

      connectTikTok: async (username: string) => {
        this.tiktokUsername = username;
        try {
          const res = await fetch('/api/tiktok/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username }),
          });
          const data = await res.json();
          return data;
        } catch (err: any) {
          return { success: false, error: err.message };
        }
      },

      disconnectTikTok: async () => {
        try {
          await fetch('/api/tiktok/disconnect', { method: 'POST' });
        } catch {
          // ignore
        }
      },

      getTikTokStatus: async () => {
        try {
          const res = await fetch('/api/tiktok/status');
          const data = await res.json();
          this.tiktokStatus = data.status;
          this.tiktokUsername = data.username;
          return data;
        } catch {
          return { status: this.tiktokStatus, username: this.tiktokUsername };
        }
      },

      getSettings: async () => {
        try {
          const res = await fetch('/api/settings');
          const data = await res.json();
          this.cachedSettings = data;
          return data;
        } catch {
          return this.cachedSettings;
        }
      },

      saveSettings: async (settings: Partial<AppSettings>) => {
        try {
          const res = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings),
          });
          const data = await res.json();
          this.cachedSettings = data;
          return data;
        } catch {
          this.cachedSettings = { ...this.cachedSettings, ...settings };
          return this.cachedSettings;
        }
      },

      sendTestChat: async (custom?: Partial<ChatMessage>) => {
        try {
          await fetch('/api/test/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ custom }),
          });
        } catch {
          // ignore
        }
      },

      sendTestGift: async (custom?: Partial<GiftEvent>) => {
        try {
          await fetch('/api/test/gift', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ custom }),
          });
        } catch {
          // ignore
        }
      },

      replayGift: async (gift: GiftEvent) => {
        try {
          await fetch('/api/gift/replay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gift }),
          });
        } catch {
          // ignore
        }
      },

      getOverlayUrls: async () => {
        try {
          const res = await fetch('/api/overlay/urls');
          return await res.json();
        } catch {
          const p = 3210;
          return {
            port: p,
            chat: `http://127.0.0.1:${p}/overlay/chat`,
            gifts: `http://127.0.0.1:${p}/overlay/gifts`,
            all: `http://127.0.0.1:${p}/overlay/all`,
          };
        }
      },

      onChatMessage: (callback) => {
        this.chatListeners.add(callback);
        return () => this.chatListeners.delete(callback);
      },

      onGiftEvent: (callback) => {
        this.giftListeners.add(callback);
        return () => this.giftListeners.delete(callback);
      },

      onStatusChange: (callback) => {
        this.statusListeners.add(callback);
        return () => this.statusListeners.delete(callback);
      },

      onLog: (callback) => {
        this.logListeners.add(callback);
        return () => this.logListeners.delete(callback);
      },

      openExternal: async (url: string) => {
        window.open(url, '_blank');
      },

      isAlwaysOnTop: async () => false,
      setAlwaysOnTop: async () => false,
    };
  }
}

// Polyfill window.electronAPI if not running inside Electron desktop
if (typeof window !== 'undefined' && !(window as any).electronAPI) {
  const bridge = new WebBridge();
  (window as any).electronAPI = bridge.getApi();
}
