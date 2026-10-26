import { ChatMessage, ConnectionStatus } from '../../src/types';
import { eventBus } from './event-bus';

/**
 * YouTubeAdapter - Direct HTTP Live Chat Reader
 * 
 * Bypasses youtubei.js player API (which gets blocked by Google bot detection)
 * by directly fetching the watch page HTML, extracting the continuation token
 * from ytInitialData, and polling the live_chat/get_live_chat endpoint.
 */
export class YouTubeAdapter {
  private status: ConnectionStatus = 'disconnected';
  private currentTarget = '';
  private pollTimer: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isIntentionalDisconnect = false;
  private seenMessageIds = new Set<string>();
  private continuationToken: string | null = null;
  private pollIntervalMs = 2000;

  private readonly USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public getTarget(): string {
    return this.currentTarget;
  }

  private setStatus(newStatus: ConnectionStatus, error?: string) {
    this.status = newStatus;
    eventBus.emit('status-change', 'youtube', newStatus, error);
    if (error) {
      eventBus.emit('log', 'error', `[YouTube] ${error}`);
    } else {
      eventBus.emit('log', 'info', `[YouTube] Status: ${newStatus}`);
    }
  }

  public extractVideoId(input: string): string {
    const trimmed = input.trim();
    if (!trimmed) return '';

    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }

    try {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      if (url.searchParams.has('v')) {
        return url.searchParams.get('v') || '';
      }
      const pathParts = url.pathname.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        if (['live', 'embed', 'v'].includes(pathParts[0])) {
          return pathParts[1] || '';
        }
        if (url.hostname.includes('youtu.be')) {
          return pathParts[0] || '';
        }
      }
    } catch {
      const match = trimmed.match(/(?:v=|\/live\/|\/embed\/|youtu\.be\/|\/v\/|^)([a-zA-Z0-9_-]{11})/);
      if (match) return match[1];
    }

    return trimmed;
  }

  public async connect(targetInput: string) {
    this.isIntentionalDisconnect = false;
    this.currentTarget = targetInput;
    const videoId = this.extractVideoId(targetInput);

    if (!videoId) {
      this.setStatus('error', 'URL atau Video ID YouTube tidak valid.');
      return;
    }

    this.setStatus('connecting');
    this.seenMessageIds.clear();

    try {
      eventBus.emit('log', 'info', `[YouTube] Fetching watch page for video: ${videoId}`);

      // Step 1: Fetch the watch page HTML
      const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const res = await fetch(watchUrl, {
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      });

      if (!res.ok) {
        throw new Error(`Gagal mengakses halaman YouTube (HTTP ${res.status}).`);
      }

      const html = await res.text();

      // Step 2: Extract ytInitialData from HTML
      const matchData = html.match(/var ytInitialData = ({.*?});<\/script>/s)
                      || html.match(/ytInitialData\s*=\s*({.*?});<\/script>/s);

      if (!matchData) {
        throw new Error('Gagal mengekstrak data dari halaman YouTube. Video mungkin tidak valid atau tidak sedang live.');
      }

      const ytData = JSON.parse(matchData[1]);

      // Step 3: Find liveChatRenderer and continuation token
      const liveChatRenderer = ytData.contents?.twoColumnWatchNextResults?.conversationBar?.liveChatRenderer;

      if (!liveChatRenderer) {
        // Check if video is live
        const isLiveNow = html.includes('"isLiveNow":true') || html.includes('"isLive":true');
        if (!isLiveNow) {
          throw new Error('Video ini bukan live stream atau live chat tidak tersedia. Pastikan Anda menggunakan URL live stream YouTube yang sedang aktif.');
        }
        throw new Error('Live chat tidak ditemukan pada stream ini. Streamer mungkin menonaktifkan live chat.');
      }

      const continuations = liveChatRenderer.continuations;
      const token = continuations?.[0]?.invalidationContinuationData?.continuation
                 || continuations?.[0]?.timedContinuationData?.continuation
                 || continuations?.[0]?.reloadContinuationData?.continuation;

      if (!token) {
        throw new Error('Token live chat tidak ditemukan. Live stream mungkin sudah berakhir.');
      }

      this.continuationToken = token;
      this.reconnectAttempts = 0;

      eventBus.emit('log', 'info', `[YouTube] Live chat ditemukan! Mulai polling pesan...`);
      this.setStatus('connected');

      // Step 4: Start polling for new messages
      this.startPolling();

    } catch (err: any) {
      eventBus.emit('log', 'error', `[YouTube] Koneksi gagal: ${err?.message || err}`);
      this.handleDisconnect(err?.message || 'Gagal terhubung ke live chat YouTube.');
    }
  }

  private startPolling() {
    this.stopPolling();

    const poll = async () => {
      if (this.isIntentionalDisconnect || !this.continuationToken) return;

      try {
        const chatRes = await fetch('https://www.youtube.com/youtubei/v1/live_chat/get_live_chat?prettyPrint=false', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': this.USER_AGENT,
            'Origin': 'https://www.youtube.com',
            'Referer': 'https://www.youtube.com',
          },
          body: JSON.stringify({
            context: {
              client: {
                clientName: 'WEB',
                clientVersion: '2.20241001.00.00',
                hl: 'id',
                gl: 'ID'
              }
            },
            continuation: this.continuationToken
          })
        });

        if (!chatRes.ok) {
          throw new Error(`HTTP ${chatRes.status} dari YouTube live chat API.`);
        }

        const chatData = await chatRes.json();
        const liveChatCont = chatData.continuationContents?.liveChatContinuation;

        if (!liveChatCont) {
          // Stream might have ended
          eventBus.emit('log', 'warn', `[YouTube] Live chat continuation kosong. Stream mungkin sudah berakhir.`);
          this.setStatus('disconnected', 'Live stream atau live chat telah berakhir.');
          return;
        }

        // Update continuation token for next poll
        const newContinuations = liveChatCont.continuations;
        const newToken = newContinuations?.[0]?.invalidationContinuationData?.continuation
                      || newContinuations?.[0]?.timedContinuationData?.continuation
                      || newContinuations?.[0]?.reloadContinuationData?.continuation;

        if (newToken) {
          this.continuationToken = newToken;
        }

        // Extract polling interval if provided
        const timeoutMs = newContinuations?.[0]?.invalidationContinuationData?.timeoutMs
                       || newContinuations?.[0]?.timedContinuationData?.timeoutMs;
        if (timeoutMs) {
          this.pollIntervalMs = Math.max(1500, Math.min(Number(timeoutMs), 5000));
        }

        // Parse chat actions
        const actions = liveChatCont.actions || [];
        for (const action of actions) {
          this.parseAction(action);
        }

      } catch (err: any) {
        eventBus.emit('log', 'warn', `[YouTube] Poll error: ${err?.message}`);
        // Don't disconnect immediately on a single poll error
      }

      // Schedule next poll
      if (!this.isIntentionalDisconnect && this.status === 'connected') {
        this.pollTimer = setTimeout(poll, this.pollIntervalMs);
      }
    };

    // Start first poll immediately
    poll();
  }

  private parseAction(action: any) {
    // Handle addChatItemAction (new messages)
    const addItem = action.addChatItemAction?.item;
    if (!addItem) return;

    // Regular text messages
    const textMsg = addItem.liveChatTextMessageRenderer;
    // Paid messages (Super Chat)
    const paidMsg = addItem.liveChatPaidMessageRenderer;

    const renderer = textMsg || paidMsg;
    if (!renderer) return;

    const id = renderer.id;
    if (!id || this.seenMessageIds.has(id)) return;
    this.seenMessageIds.add(id);

    // Keep memory bounded
    if (this.seenMessageIds.size > 2000) {
      const entries = Array.from(this.seenMessageIds);
      this.seenMessageIds = new Set(entries.slice(-1000));
    }

    const authorName = renderer.authorName?.simpleText || 'Penonton YouTube';
    const avatar = renderer.authorPhoto?.thumbnails?.[0]?.url || '';

    // Extract message text from runs
    let messageText = '';
    if (renderer.message?.runs) {
      messageText = renderer.message.runs.map((r: any) => {
        if (r.text) return r.text;
        if (r.emoji) {
          // If custom emoji with image thumbnail
          if (r.emoji.isCustomEmoji && r.emoji.image?.thumbnails?.[0]?.url) {
            return `[yt-emote:${r.emoji.image.thumbnails[0].url}]`;
          }
          // Prioritize unicode emojiId (e.g. 😝, 👍) over shortcut code (:thumbs_up:)
          return r.emoji.emojiId || r.emoji.shortcuts?.[0] || '😊';
        }
        return '';
      }).join('');
    }

    if (!messageText.trim()) return;

    // Extract badges
    const badges: string[] = [];
    if (renderer.authorBadges) {
      for (const badge of renderer.authorBadges) {
        const badgeRenderer = badge.liveChatAuthorBadgeRenderer;
        if (badgeRenderer) {
          const label = badgeRenderer.tooltip || badgeRenderer.accessibility?.accessibilityData?.label || '';
          if (label.toLowerCase().includes('owner')) badges.push('Owner');
          else if (label.toLowerCase().includes('moderator')) badges.push('Mod');
          else if (label.toLowerCase().includes('member')) badges.push('Member');
          else if (label.toLowerCase().includes('verified')) badges.push('Verified');
          else if (label) badges.push(label);
        }
      }
    }

    // Handle Super Chat prefix
    if (paidMsg) {
      const amount = paidMsg.purchaseAmountText?.simpleText || '';
      if (amount) {
        messageText = `[Super Chat ${amount}] ${messageText}`;
      }
    }

    const timestamp = renderer.timestampUsec
      ? Math.floor(Number(renderer.timestampUsec) / 1000)
      : Date.now();

    const chatMessage: ChatMessage = {
      id,
      platform: 'youtube',
      username: authorName.replace(/^@/, ''),
      displayName: authorName,
      avatar,
      message: messageText,
      badges,
      timestamp,
      type: 'chat'
    };

    eventBus.emit('chat-message', chatMessage);
  }

  private stopPolling() {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private handleDisconnect(errorReason?: string) {
    this.stopPolling();

    if (this.isIntentionalDisconnect) {
      this.setStatus('disconnected');
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 20000);
      this.setStatus('reconnecting', `Mencoba menghubungkan kembali (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

      this.reconnectTimeout = setTimeout(() => {
        if (!this.isIntentionalDisconnect && this.currentTarget) {
          this.connect(this.currentTarget);
        }
      }, delay);
    } else {
      this.setStatus('error', errorReason || 'Koneksi terputus dan gagal menghubungkan kembali.');
    }
  }

  public disconnect() {
    this.isIntentionalDisconnect = true;
    this.stopPolling();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.continuationToken = null;
    this.seenMessageIds.clear();
    this.setStatus('disconnected');
  }
}

export const youtubeAdapter = new YouTubeAdapter();
