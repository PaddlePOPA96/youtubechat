export type Platform = 'youtube' | 'tiktok';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface ChatMessage {
  id: string;
  platform: Platform;
  username: string;
  displayName?: string;
  avatar?: string;
  message: string;
  badges?: string[];
  timestamp: number;
  type: 'chat';
}

export interface GiftEvent {
  id: string;
  platform: 'tiktok';
  type: 'gift';
  username: string;
  displayName?: string;
  avatar?: string;
  giftId?: string | number;
  giftName: string;
  giftCount: number;
  diamondCount?: number;
  repeatEnd?: boolean;
  repeatCount?: number;
  groupId?: string;
  timestamp: number;
  giftPictureUrl?: string;
}

export interface PlatformConnectionState {
  status: ConnectionStatus;
  target: string;
  error?: string;
  connectedAt?: number;
}

export interface AppSettings {
  // Connection
  youtubeTarget: string; // URL or Video ID
  tiktokUsername: string;
  autoConnect: boolean;
  
  // Overlay Server
  overlayPort: number;

  // Chat Overlay Customization
  chatFontFamily: string;
  chatFontSize: number;
  chatTextColor: string;
  chatBgColor: string;
  chatBgOpacity: number;
  chatMaxMessages: number;
  chatDurationSeconds: number; // 0 for persistent
  chatShowAvatar: boolean;
  chatShowBadge: boolean;
  chatAnimation: 'slide' | 'fade' | 'pop' | 'none';

  // Gift Overlay Customization
  giftAnimationEnabled: boolean;
  giftAnimationPreset: 'pop' | 'slide' | 'bounce' | 'fade';
  giftDurationSeconds: number;
  giftShowUsername: boolean;
  giftShowGiftName: boolean;
  giftShowGiftCount: boolean;
  giftSoundEffect: boolean;
  giftQueueLimit: number;
  giftDelaySeconds: number;
  tiktokApiKey?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  youtubeTarget: '',
  tiktokUsername: '',
  tiktokApiKey: '',
  autoConnect: false,
  overlayPort: 3210,

  chatFontFamily: "'Plus Jakarta Sans', 'Segoe UI Emoji', sans-serif",
  chatFontSize: 16,
  chatTextColor: '#ffffff',
  chatBgColor: '#0f172a',
  chatBgOpacity: 75,
  chatMaxMessages: 40,
  chatDurationSeconds: 20,
  chatShowAvatar: true,
  chatShowBadge: true,
  chatAnimation: 'slide',

  giftAnimationEnabled: true,
  giftAnimationPreset: 'bounce',
  giftDurationSeconds: 4,
  giftDelaySeconds: 0.5,
  giftShowUsername: true,
  giftShowGiftName: false,
  giftShowGiftCount: true,
  giftSoundEffect: true,
  giftQueueLimit: 25,
};

export type OverlayType = 'chat' | 'gifts' | 'all';
