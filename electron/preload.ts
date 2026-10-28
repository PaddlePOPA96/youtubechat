import { contextBridge, ipcRenderer } from 'electron';
import { ChatMessage, GiftEvent, AppSettings, Platform, ConnectionStatus } from '../src/types';

export interface ElectronAPI {
  // YouTube
  connectYouTube: (target: string) => Promise<{ success: boolean; error?: string }>;
  disconnectYouTube: () => Promise<void>;
  getYouTubeStatus: () => Promise<{ status: ConnectionStatus; target: string }>;

  // TikTok
  connectTikTok: (username: string) => Promise<{ success: boolean; error?: string }>;
  disconnectTikTok: () => Promise<void>;
  getTikTokStatus: () => Promise<{ status: ConnectionStatus; username: string }>;

  // Settings
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;

  // Testing & Replay
  sendTestChat: (custom?: Partial<ChatMessage>) => Promise<void>;
  sendTestGift: (custom?: Partial<GiftEvent>) => Promise<void>;
  replayGift: (gift: GiftEvent) => Promise<void>;

  // Overlay Server
  getOverlayUrls: () => Promise<{ chat: string; gifts: string; all: string; port: number }>;

  // Event Listeners (return unsubscribe function)
  onChatMessage: (callback: (msg: ChatMessage) => void) => () => void;
  onGiftEvent: (callback: (gift: GiftEvent) => void) => () => void;
  onStatusChange: (callback: (platform: Platform, status: ConnectionStatus, error?: string) => void) => () => void;
  onLog: (callback: (level: 'info' | 'warn' | 'error', message: string) => void) => () => void;
  openExternal: (url: string) => Promise<void>;

  // Window Controls (Pin on Top)
  isAlwaysOnTop: () => Promise<boolean>;
  setAlwaysOnTop: (flag: boolean) => Promise<boolean>;

  // Auto Updater
  checkForUpdates?: () => Promise<any>;
  installUpdate?: () => Promise<void>;
  onUpdateAvailable?: (callback: (info: any) => void) => () => void;
  onUpdateDownloaded?: (callback: (info: any) => void) => () => void;
}

const api: ElectronAPI = {
  connectYouTube: (target: string) => ipcRenderer.invoke('youtube:connect', target),
  disconnectYouTube: () => ipcRenderer.invoke('youtube:disconnect'),
  getYouTubeStatus: () => ipcRenderer.invoke('youtube:status'),

  connectTikTok: (username: string) => ipcRenderer.invoke('tiktok:connect', username),
  disconnectTikTok: () => ipcRenderer.invoke('tiktok:disconnect'),
  getTikTokStatus: () => ipcRenderer.invoke('tiktok:status'),

  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: Partial<AppSettings>) => ipcRenderer.invoke('settings:save', settings),

  sendTestChat: (custom?: Partial<ChatMessage>) => ipcRenderer.invoke('test:chat', custom),
  sendTestGift: (custom?: Partial<GiftEvent>) => ipcRenderer.invoke('test:gift', custom),
  replayGift: (gift: GiftEvent) => ipcRenderer.invoke('gift:replay', gift),

  getOverlayUrls: () => ipcRenderer.invoke('overlay:urls'),

  onChatMessage: (callback) => {
    const handler = (_event: any, msg: ChatMessage) => callback(msg);
    ipcRenderer.on('chat:message', handler);
    return () => ipcRenderer.removeListener('chat:message', handler);
  },

  onGiftEvent: (callback) => {
    const handler = (_event: any, gift: GiftEvent) => callback(gift);
    ipcRenderer.on('gift:event', handler);
    return () => ipcRenderer.removeListener('gift:event', handler);
  },

  onStatusChange: (callback) => {
    const handler = (_event: any, platform: Platform, status: ConnectionStatus, error?: string) =>
      callback(platform, status, error);
    ipcRenderer.on('status:change', handler);
    return () => ipcRenderer.removeListener('status:change', handler);
  },

  onLog: (callback) => {
    const handler = (_event: any, level: 'info' | 'warn' | 'error', message: string) =>
      callback(level, message);
    ipcRenderer.on('log:event', handler);
    return () => ipcRenderer.removeListener('log:event', handler);
  },

  openExternal: (url: string) => ipcRenderer.invoke('open:external', url),

  isAlwaysOnTop: () => ipcRenderer.invoke('window:isAlwaysOnTop'),
  setAlwaysOnTop: (flag: boolean) => ipcRenderer.invoke('window:setAlwaysOnTop', flag),

  checkForUpdates: () => ipcRenderer.invoke('app:checkForUpdates'),
  installUpdate: () => ipcRenderer.invoke('app:installUpdate'),
  onUpdateAvailable: (callback) => {
    const handler = (_event: any, info: any) => callback(info);
    ipcRenderer.on('updater:available', handler);
    return () => ipcRenderer.removeListener('updater:available', handler);
  },
  onUpdateDownloaded: (callback) => {
    const handler = (_event: any, info: any) => callback(info);
    ipcRenderer.on('updater:downloaded', handler);
    return () => ipcRenderer.removeListener('updater:downloaded', handler);
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);
