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
  setOpacity: (opacity: number) => Promise<number>;
  getOpacity: () => Promise<number>;
  getVersion: () => Promise<string>;

  checkForUpdates?: () => Promise<any>;
  installUpdate?: () => Promise<void>;
  onUpdateAvailable?: (callback: (info: any) => void) => () => void;
  onUpdateProgress?: (callback: (progress: any) => void) => () => void;
  onUpdateDownloaded?: (callback: (info: any) => void) => () => void;
  onUpdateNotAvailable?: (callback: () => void) => () => void;
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
  private cachedSettings: AppSettings = {
    ...DEFAULT_SETTINGS,
    customBackendUrl: typeof window !== 'undefined' ? (localStorage.getItem('streamchat_backend_url') || '') : '',
  };

  private isConnected = false;
  private reconnectTimer: any = null;

  constructor() {
    this.connectWs();

    if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') && !this.getBaseUrl()) {
      setTimeout(() => {
        this.emitLog('info', '🌐 StreamChat berjalan di Vercel. Untuk menghubungkan live stream YouTube/TikTok, masukkan Backend Server URL di menu Pengaturan (ikon ⚙️).');
      }, 1000);
    }
  }

  private getBaseUrl(): string {
    const custom =
      this.cachedSettings.customBackendUrl ||
      (typeof window !== 'undefined' ? localStorage.getItem('streamchat_backend_url') : '') ||
      (import.meta as any).env?.VITE_BACKEND_URL;

    if (custom && typeof custom === 'string') {
      return custom.trim().replace(/\/+$/, '');
    }
    return '';
  }

  private getWsUrl(): string {
    const custom = this.getBaseUrl();
    if (custom) {
      if (custom.startsWith('ws://') || custom.startsWith('wss://')) {
        return custom.endsWith('/ws') ? custom : `${custom}/ws`;
      }
      const proto = custom.startsWith('https://') ? 'wss:' : 'ws:';
      const cleanHost = custom.replace(/^https?:\/\//, '');
      return `${proto}//${cleanHost}/ws`;
    }

    const isHttps = window.location.protocol === 'https:';
    const proto = isHttps ? 'wss:' : 'ws:';
    // When served via Vite or same server, use /ws
    return `${proto}//${window.location.host}/ws`;
  }

  private connectWs() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
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
        // Auto-reconnect after 3 seconds
        this.reconnectTimer = setTimeout(() => this.connectWs(), 3000);
      };

      this.ws.onerror = () => {
        this.isConnected = false;
      };
    } catch {
      this.reconnectTimer = setTimeout(() => this.connectWs(), 4000);
    }
  }

  private handleIncoming(payload: any) {
    if (!payload || !payload.type) return;

    if (payload.type === 'init' || payload.type === 'init-full') {
      if (payload.settings) {
        this.cachedSettings = {
          ...this.cachedSettings,
          ...payload.settings,
          customBackendUrl: localStorage.getItem('streamchat_backend_url') || this.cachedSettings.customBackendUrl || '',
        };
      }
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
      this.cachedSettings = {
        ...this.cachedSettings,
        ...payload.data,
        customBackendUrl: localStorage.getItem('streamchat_backend_url') || this.cachedSettings.customBackendUrl || '',
      };
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
          const base = this.getBaseUrl();
          const res = await fetch(`${base}/api/youtube/connect`, {
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
          const base = this.getBaseUrl();
          await fetch(`${base}/api/youtube/disconnect`, { method: 'POST' });
        } catch {
          // ignore
        }
      },

      getYouTubeStatus: async () => {
        try {
          const base = this.getBaseUrl();
          const res = await fetch(`${base}/api/youtube/status`);
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
          const base = this.getBaseUrl();
          const res = await fetch(`${base}/api/tiktok/connect`, {
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
          const base = this.getBaseUrl();
          await fetch(`${base}/api/tiktok/disconnect`, { method: 'POST' });
        } catch {
          // ignore
        }
      },

      getTikTokStatus: async () => {
        try {
          const base = this.getBaseUrl();
          const res = await fetch(`${base}/api/tiktok/status`);
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
          const base = this.getBaseUrl();
          const res = await fetch(`${base}/api/settings`);
          const data = await res.json();
          this.cachedSettings = {
            ...this.cachedSettings,
            ...data,
            customBackendUrl: localStorage.getItem('streamchat_backend_url') || '',
          };
          return this.cachedSettings;
        } catch {
          return this.cachedSettings;
        }
      },

      saveSettings: async (settings: Partial<AppSettings>) => {
        const oldBackend = this.getBaseUrl();
        if (settings.customBackendUrl !== undefined) {
          localStorage.setItem('streamchat_backend_url', settings.customBackendUrl.trim());
          this.cachedSettings.customBackendUrl = settings.customBackendUrl.trim();
        }

        try {
          const base = this.getBaseUrl();
          const res = await fetch(`${base}/api/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings),
          });
          const data = await res.json();
          this.cachedSettings = {
            ...this.cachedSettings,
            ...data,
            customBackendUrl: localStorage.getItem('streamchat_backend_url') || '',
          };

          if (this.getBaseUrl() !== oldBackend) {
            this.connectWs();
          }

          return this.cachedSettings;
        } catch {
          this.cachedSettings = { ...this.cachedSettings, ...settings };
          if (this.getBaseUrl() !== oldBackend) {
            this.connectWs();
          }
          return this.cachedSettings;
        }
      },

      sendTestChat: async (custom?: Partial<ChatMessage>) => {
        try {
          const base = this.getBaseUrl();
          await fetch(`${base}/api/test/chat`, {
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
          const base = this.getBaseUrl();
          await fetch(`${base}/api/test/gift`, {
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
          const base = this.getBaseUrl();
          await fetch(`${base}/api/gift/replay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gift }),
          });
        } catch {
          // ignore
        }
      },

      getOverlayUrls: async () => {
        const base = this.getBaseUrl();
        const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
        const serverQuery = base ? `?server=${encodeURIComponent(base)}` : '';

        return {
          port: this.cachedSettings.overlayPort || 3210,
          chat: `${origin}/overlay/chat.html${serverQuery}`,
          gifts: `${origin}/overlay/gifts.html${serverQuery}`,
          all: `${origin}/overlay/all.html${serverQuery}`,
        };
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
      setOpacity: async (opacity: number) => {
        if (typeof document !== 'undefined') {
          document.documentElement.style.setProperty('--card-opacity', String(opacity));
        }
        return opacity;
      },
      getOpacity: async () => 1.0,
      getVersion: async () => '1.0.0',

      checkForUpdates: async () => ({ isPackaged: false, message: 'Running in browser/web mode' }),
      installUpdate: async () => {},
      onUpdateAvailable: () => () => {},
      onUpdateProgress: () => () => {},
      onUpdateDownloaded: () => () => {},
      onUpdateNotAvailable: () => () => {},
    };
  }
}

// Polyfill window.electronAPI if not running inside Electron desktop
if (typeof window !== 'undefined' && !(window as any).electronAPI) {
  const bridge = new WebBridge();
  (window as any).electronAPI = bridge.getApi();
}
