import { ChatMessage, GiftEvent, ConnectionStatus } from '../../src/types';
import { eventBus } from './event-bus';

export const TIKTOK_STICKER_MAP: Record<string, string> = {
  // GG (ID 6064)
  '6064': 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/3f02fa9594bd1495ff4e8aa5ae265eef~tplv-obj.png',
  // Rose (ID 5655 & 5489)
  '5655': 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/9b1f08d38a7516eaa242c760dc0f5547.png~tplv-obj.png',
  '5489': 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/9b1f08d38a7516eaa242c760dc0f5547.png~tplv-obj.png',
  // TikTok Logo (ID 5269)
  '5269': 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/d356c9d7499625345a90ad1df1b31278.png~tplv-obj.png',
  // Heart Me (ID 5827)
  '5827': 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/4e2fc1042c03164917a26cb595bfddf9.png~tplv-obj.png',
  // Finger Heart (ID 5585)
  '5585': 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/da931ff73e6587d159a6078e47f5cfb3.png~tplv-obj.png',
  // Doughnut (ID 5658)
  '5658': 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/db1ebcfb99db10e39540c4a45a32b6e1.png~tplv-obj.png',
  // Ice Cream Cone (ID 5656)
  '5656': 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/0a316d3fdf6c63b15fa4d38c6b72a0c6.png~tplv-obj.png',
  // Lion (ID 6143)
  '6143': 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/44d1565e3176d05f320f78a7f23be3f7.png~tplv-obj.png',
  // Whale (ID 2150)
  '2150': 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/a6755ca7b6bb27efc6b75c5e87a27eb2.png~tplv-obj.png',
  // TikTok Universe (ID 6144)
  '6144': 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/6ecda201ee19d297ff0111f1ae55b76d.png~tplv-obj.png',
  // Hat and Mustache (ID 6040)
  '6040': 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/8bc82bc74c8b2a1a8c0282b012690d71.png~tplv-obj.png',
  // Paper Crane (ID 6061)
  '6061': 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/a010d8a59be524e0787a7ae89be6f903.png~tplv-obj.png',
  // Corgi (ID 5988)
  '5988': 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/c15b1fb4b14d3f572a72fe1b8fbfdbdc.png~tplv-obj.png'
};

export function getTikTokStickerUrl(giftId?: string | number, giftName?: string): string {
  const idStr = String(giftId || '').trim();
  if (idStr && TIKTOK_STICKER_MAP[idStr]) {
    return TIKTOK_STICKER_MAP[idStr];
  }

  const name = (giftName || '').toLowerCase();
  if (name.includes('gg')) return TIKTOK_STICKER_MAP['6064'];
  if (name.includes('rose') || name.includes('mawar')) return TIKTOK_STICKER_MAP['5655'];
  if (name.includes('heart me')) return TIKTOK_STICKER_MAP['5827'];
  if (name.includes('finger heart')) return TIKTOK_STICKER_MAP['5585'];
  if (name.includes('doughnut') || name.includes('donat')) return TIKTOK_STICKER_MAP['5658'];
  if (name.includes('ice cream') || name.includes('es krim')) return TIKTOK_STICKER_MAP['5656'];
  if (name.includes('lion') || name.includes('singa')) return TIKTOK_STICKER_MAP['6143'];
  if (name.includes('whale') || name.includes('paus')) return TIKTOK_STICKER_MAP['2150'];
  if (name.includes('universe')) return TIKTOK_STICKER_MAP['6144'];
  if (name.includes('corgi')) return TIKTOK_STICKER_MAP['5988'];
  if (name.includes('tiktok')) return TIKTOK_STICKER_MAP['5269'];

  // Default authentic TikTok sticker fallback (GG)
  return 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/3f02fa9594bd1495ff4e8aa5ae265eef~tplv-obj.png';
}

export class TikTokAdapter {
  private tiktokLive: any = null;
  private status: ConnectionStatus = 'disconnected';
  private currentUsername = '';
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isIntentionalDisconnect = false;
  private seenMessageIds = new Set<string>();
  private seenGiftMsgIds = new Set<string>();
  private streakMap = new Map<string, { gift: GiftEvent; timer: NodeJS.Timeout }>();

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getUsername(): string {
    return this.currentUsername;
  }

  private setStatus(newStatus: ConnectionStatus, error?: string) {
    this.status = newStatus;
    eventBus.emit('status-change', 'tiktok', newStatus, error);
    if (error) {
      eventBus.emit('log', 'error', `[TikTok] ${error}`);
    } else {
      eventBus.emit('log', 'info', `[TikTok] Status changed to ${newStatus}`);
    }
  }

  public async connect(usernameInput: string, apiKey?: string) {
    this.isIntentionalDisconnect = false;
    let cleanUsername = usernameInput.trim();
    if (cleanUsername.startsWith('@')) {
      cleanUsername = cleanUsername.slice(1);
    }

    if (!cleanUsername) {
      this.setStatus('error', 'Username TikTok tidak boleh kosong.');
      return;
    }

    if (apiKey && apiKey.trim()) {
      process.env.SIGN_API_KEY = apiKey.trim();
      eventBus.emit('log', 'info', '[TikTok] Menggunakan EulerStream API Key kustom');
    }

    this.currentUsername = cleanUsername;
    this.setStatus('connecting');

    // Clean up previous connection if any
    if (this.tiktokLive) {
      try {
        this.tiktokLive.disconnect();
      } catch {
        // ignore
      }
      this.tiktokLive = null;
    }

    try {
      // Dynamic import to support both ESM and CJS bundling
      const mod = await (Function('return import("tiktok-live-connector")')() as Promise<any>);
      const ConnectionClass = mod.TikTokLiveConnection || mod.WebcastPushConnection || mod.default;

      if (!ConnectionClass) {
        throw new Error('TikTokLiveConnection class tidak ditemukan di tiktok-live-connector');
      }

      // Minimal sign requests to prevent hitting rate limit
      this.tiktokLive = new ConnectionClass(cleanUsername, {
        fetchRoomInfoOnConnect: false,
        enableExtendedGiftInfo: false,
        processInitialData: true
      });

      // Register Event Listeners
      this.tiktokLive.on('connected', (state: any) => {
        this.reconnectAttempts = 0;
        this.setStatus('connected');
        eventBus.emit('log', 'info', `[TikTok] Terhubung ke live stream @${cleanUsername} (Room ID: ${state?.roomId || 'ok'})`);
      });

      this.tiktokLive.on('disconnected', () => {
        eventBus.emit('log', 'warn', `[TikTok] Koneksi live stream @${cleanUsername} terputus`);
        this.handleDisconnect('Koneksi live TikTok terputus.');
      });

      this.tiktokLive.on('streamEnd', () => {
        eventBus.emit('log', 'info', `[TikTok] Live stream @${cleanUsername} telah berakhir`);
        this.setStatus('disconnected', 'Live stream telah diakhiri oleh kreator.');
      });

      this.tiktokLive.on('error', (err: any) => {
        let errStr = '';
        if (typeof err === 'string') {
          errStr = err;
        } else if (err?.message) {
          errStr = String(err.message);
        } else if (err?.info) {
          errStr = String(err.info);
        } else if (err) {
          try {
            errStr = JSON.stringify(err);
          } catch {
            errStr = String(err);
          }
        } else {
          errStr = 'Terjadi kesalahan pada koneksi TikTok.';
        }

        eventBus.emit('log', 'error', `[TikTok] Error: ${errStr}`);

        if (errStr.toLowerCase().includes('rate limit') || errStr.includes('rate_limit')) {
          this.reconnectAttempts = 0;
          if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
          }
          this.setStatus('error', 'TikTok Rate Limit. Harap tunggu sekitar 1-2 menit sebelum mencoba lagi.');
          return;
        }

        this.handleDisconnect(errStr);
      });

      // Chat message event (compatible with both v1 and v2 payload structures)
      this.tiktokLive.on('chat', (data: any) => {
        try {
          const comment = (data.comment || data.content || '').trim();
          if (!comment) return;

          const u = data.user || data;
          const authorNickname = u.nickname || u.uniqueId || data.nickname || data.uniqueId || 'User';
          const authorUsername = u.uniqueId || u.displayId || u.id || authorNickname;
          const avatarUrl =
            u.avatarThumb?.urlList?.[0] ||
            u.avatarMedium?.urlList?.[0] ||
            u.avatarLarge?.urlList?.[0] ||
            u.profilePictureUrl ||
            data.profilePictureUrl ||
            '';

          const msgId = String(data.common?.msgId || data.msgId || '');
          if (msgId && this.seenMessageIds.has(msgId)) {
            return;
          }
          if (msgId) {
            this.seenMessageIds.add(msgId);
            if (this.seenMessageIds.size > 1000) {
              const [first] = this.seenMessageIds;
              this.seenMessageIds.delete(first);
            }
          }

          const timestamp = data.common?.createTime
            ? Number(data.common.createTime)
            : data.createTime
            ? Number(data.createTime)
            : Date.now();

          const chatMsg: ChatMessage = {
            id: `tt-${msgId}-${Math.random().toString(36).slice(2, 6)}`,
            platform: 'tiktok',
            username: String(authorUsername),
            displayName: String(authorNickname),
            avatar: avatarUrl,
            message: comment,
            badges: Array.isArray(data.userBadges)
              ? data.userBadges.map((b: any) => b.name || b.type || 'Badge')
              : [],
            timestamp,
            type: 'chat'
          };

          eventBus.emit('chat-message', chatMsg);
        } catch (err: any) {
          eventBus.emit('log', 'warn', `[TikTok] Error parsing chat: ${err?.message}`);
        }
      });

      // Gift event
      this.tiktokLive.on('gift', (data: any) => {
        try {
          const rawMsgId = data.common?.msgId || data.msgId;
          if (rawMsgId && this.seenGiftMsgIds.has(String(rawMsgId))) {
            return;
          }
          if (rawMsgId) {
            this.seenGiftMsgIds.add(String(rawMsgId));
            if (this.seenGiftMsgIds.size > 1000) {
              const first = this.seenGiftMsgIds.values().next().value;
              if (first) this.seenGiftMsgIds.delete(first);
            }
          }

          const u = data.user || data;
          const authorNickname = u.nickname || u.uniqueId || 'User';
          const authorUsername = u.uniqueId || u.displayId || authorNickname;
          const avatarUrl =
            u.avatarThumb?.urlList?.[0] ||
            u.avatarMedium?.urlList?.[0] ||
            u.profilePictureUrl ||
            '';

          const giftCount = data.repeatCount || data.comboCount || data.count || 1;
          const giftName =
            data.giftDetails?.giftName ||
            data.giftName ||
            data.gift?.name ||
            data.gift?.describe ||
            data.extendedGiftInfo?.name ||
            `Gift #${data.giftId || 'gift'}`;
          const isRepeatEnd = data.repeatEnd !== undefined ? Boolean(data.repeatEnd) : true;
          const isStreakable = data.giftType === 1 || data.giftDetails?.giftType === 1;
          const rawPic =
            data.giftPictureUrl ||
            data.giftDetails?.giftImage?.urlList?.[0] ||
            data.giftDetails?.giftImage?.url?.[0] ||
            data.gift?.image?.urlList?.[0] ||
            data.gift?.image?.url_list?.[0] ||
            data.gift?.icon?.urlList?.[0] ||
            data.gift?.icon?.url_list?.[0] ||
            data.extendedGiftInfo?.image?.url_list?.[0] ||
            data.extendedGiftInfo?.icon?.url_list?.[0] ||
            '';
          const giftPicture = rawPic || getTikTokStickerUrl(data.giftId, giftName);

          const giftEvt: GiftEvent = {
            id: `tt-gift-${rawMsgId || Date.now()}-${data.giftId || ''}`,
            platform: 'tiktok',
            type: 'gift',
            username: String(authorUsername),
            displayName: String(authorNickname),
            avatar: avatarUrl,
            giftId: data.giftId ? String(data.giftId) : 'unknown',
            giftName,
            giftCount,
            diamondCount:
              data.diamondCount ||
              (data.giftDetails?.diamondCount ? data.giftDetails.diamondCount * giftCount : 0),
            repeatEnd: isRepeatEnd,
            repeatCount: data.repeatCount || 1,
            groupId: data.groupId ? String(data.groupId) : undefined,
            timestamp: Date.now(),
            giftPictureUrl: giftPicture
          };

          const streakKey = `${authorUsername}:${data.giftId || giftName}`;

          // If streak is in progress, debounce so we only emit the completed gift once
          if (isStreakable && !isRepeatEnd) {
            if (this.streakMap.has(streakKey)) {
              clearTimeout(this.streakMap.get(streakKey)!.timer);
            }
            const timer = setTimeout(() => {
              const entry = this.streakMap.get(streakKey);
              if (entry) {
                eventBus.emit('gift-event', entry.gift);
                this.streakMap.delete(streakKey);
              }
            }, 1800);

            this.streakMap.set(streakKey, { gift: giftEvt, timer });
            return;
          }

          // Streak finished or single gift: clear timer and emit
          if (this.streakMap.has(streakKey)) {
            clearTimeout(this.streakMap.get(streakKey)!.timer);
            this.streakMap.delete(streakKey);
          }

          eventBus.emit('gift-event', giftEvt);
        } catch (err: any) {
          eventBus.emit('log', 'warn', `[TikTok] Error parsing gift: ${err?.message}`);
        }
      });

      // Connect
      const state = await this.tiktokLive.connect();
      eventBus.emit('log', 'info', `[TikTok] Connect response: room id ${state?.roomId || 'ok'}`);
    } catch (err: any) {
      const errMsg = String(err?.message || err);
      eventBus.emit('log', 'error', `[TikTok] Failed to connect: ${errMsg}`);

      if (errMsg.toLowerCase().includes('rate limit') || errMsg.includes('rate_limit')) {
        this.reconnectAttempts = 0;
        this.setStatus('error', 'Kena rate limit TikTok (terlalu sering connect). Tunggu 1-2 menit ya sebelum connect lagi.');
        return;
      }

      this.setStatus('error', errMsg || 'Gagal terhubung ke TikTok LIVE. Pastikan akun sedang live.');
    }
  }

  private handleDisconnect(errorReason?: string) {
    if (this.isIntentionalDisconnect) {
      this.setStatus('disconnected');
      return;
    }

    if (errorReason && (errorReason.toLowerCase().includes('rate limit') || errorReason.includes('rate_limit'))) {
      this.reconnectAttempts = 0;
      this.setStatus('error', 'TikTok Rate Limit. Harap tunggu sekitar 1-2 menit sebelum mencoba lagi.');
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(10000 * this.reconnectAttempts, 45000);
      this.setStatus('reconnecting', `Mencoba menghubungkan kembali (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

      this.reconnectTimeout = setTimeout(() => {
        if (!this.isIntentionalDisconnect && this.currentUsername) {
          this.connect(this.currentUsername);
        }
      }, delay);
    } else {
      this.setStatus('error', errorReason || 'Koneksi terputus dan mencapai batas percobaan ulang.');
    }
  }

  public disconnect() {
    this.isIntentionalDisconnect = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.streakMap.forEach((entry) => clearTimeout(entry.timer));
    this.streakMap.clear();
    this.seenGiftMsgIds.clear();

    if (this.tiktokLive) {
      try {
        this.tiktokLive.disconnect();
      } catch {
        // ignore
      }
      this.tiktokLive = null;
    }

    this.setStatus('disconnected');
  }
}

export const tiktokAdapter = new TikTokAdapter();
