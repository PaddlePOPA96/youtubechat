import { ChatMessage, GiftEvent } from '../../src/types';
import { getTikTokStickerUrl } from './tiktok-adapter';
import { eventBus } from './event-bus';

export function sendTestChatMessage(custom?: Partial<ChatMessage>): ChatMessage {
  const platforms: ('youtube' | 'tiktok')[] = ['youtube', 'tiktok'];
  const p = custom?.platform || platforms[Math.floor(Math.random() * platforms.length)];
  const mockNames = ['AlexStream', 'BudiGamer', 'SitiRatuLive', 'GamingPro99', 'NekoChan'];
  const mockMessages = [
    'Halo bang salam kenal dari Bandung! 🔥',
    'Keren banget gameplay-nya hari ini!',
    'Gaskeuuun stream sampai pagi!! 🚀',
    'Follow balik dong bang hehe',
    'Overlay-nya mantep banget responsif 👍',
    'Semangat terus streamingnya!!'
  ];

  const randomName = mockNames[Math.floor(Math.random() * mockNames.length)];
  const randomMsg = mockMessages[Math.floor(Math.random() * mockMessages.length)];

  const msg: ChatMessage = {
    id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    platform: p,
    username: custom?.username || randomName.toLowerCase(),
    displayName: custom?.displayName || randomName,
    avatar: custom?.avatar || (p === 'youtube'
      ? `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(randomName)}`
      : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(randomName)}`),
    message: custom?.message || randomMsg,
    badges: custom?.badges || (Math.random() > 0.5 ? ['VIP', 'Member'] : ['Sub']),
    timestamp: Date.now(),
    type: 'chat'
  };

  eventBus.emit('chat-message', msg);
  return msg;
}

export function sendTestGiftEvent(custom?: Partial<GiftEvent>): GiftEvent {
  const mockGifts = [
    { name: 'GG', giftId: '6064', count: 1, diamond: 1 },
    { name: 'Rose', giftId: '5655', count: 5, diamond: 5 },
    { name: 'TikTok', giftId: '5269', count: 10, diamond: 10 },
    { name: 'Heart Me', giftId: '5827', count: 1, diamond: 1 },
    { name: 'Finger Heart', giftId: '5585', count: 3, diamond: 15 },
    { name: 'Doughnut', giftId: '5658', count: 2, diamond: 60 },
    { name: 'Whale', giftId: '2150', count: 1, diamond: 2150 },
    { name: 'Lion', giftId: '6143', count: 1, diamond: 29999 }
  ];
  const picked = mockGifts[Math.floor(Math.random() * mockGifts.length)];
  const mockUsers = ['RianSultan', 'DewiKecil', 'SultanGamer', 'BundaLive', 'AditTiktok'];
  const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];

  const giftId = custom?.giftId || picked.giftId;
  const giftName = custom?.giftName || picked.name;
  const giftCount = custom?.giftCount || picked.count;
  const stickerUrl = custom?.giftPictureUrl || getTikTokStickerUrl(giftId, giftName);

  const gift: GiftEvent = {
    id: `test-gift-${Date.now()}`,
    platform: 'tiktok',
    type: 'gift',
    username: custom?.username || randomUser.toLowerCase(),
    displayName: custom?.displayName || randomUser,
    avatar: custom?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(randomUser)}`,
    giftId,
    giftName,
    giftCount,
    diamondCount: custom?.diamondCount || picked.diamond,
    repeatEnd: true,
    timestamp: Date.now(),
    giftPictureUrl: stickerUrl
  };

  eventBus.emit('gift-event', gift);
  return gift;
}
