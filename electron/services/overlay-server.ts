import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { ChatMessage, GiftEvent, AppSettings, DEFAULT_SETTINGS } from '../../src/types';
import { eventBus } from './event-bus';
import { youtubeAdapter } from './youtube-adapter';
import { tiktokAdapter } from './tiktok-adapter';
import { settingsStore } from './store';
import { giftQueue } from './gift-queue';
import { sendTestChatMessage, sendTestGiftEvent } from './test-generator';

function parseJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

export class OverlayServer {
  private server: http.Server | null = null;
  private wss: WebSocketServer | null = null;
  private port = 3210;
  private currentSettings: AppSettings = { ...DEFAULT_SETTINGS };
  private recentChats: ChatMessage[] = [];
  private maxStoredChats = 50;
  private seenGiftIds = new Set<string>();
  private lastGift: GiftEvent | null = null;

  constructor() {
    eventBus.on('chat-message', (msg) => {
      this.recentChats.push(msg);
      if (this.recentChats.length > this.maxStoredChats) {
        this.recentChats.shift();
      }
      this.broadcast({ type: 'chat', data: msg });
    });

    const handleGift = (gift: GiftEvent) => {
      if (!gift) return;
      const dedupeKey = gift.id || `${gift.username}:${gift.giftId}:${gift.giftCount}:${gift.timestamp || Date.now()}`;
      if (this.seenGiftIds.has(dedupeKey)) return;
      this.seenGiftIds.add(dedupeKey);
      setTimeout(() => this.seenGiftIds.delete(dedupeKey), 8000);

      this.lastGift = gift;
      this.broadcast({ type: 'gift-alert', data: gift });
      this.broadcast({ type: 'gift', data: gift });

      // Forward gift notification into chat feed so it also appears in the chat stream
      const giftChatMsg: ChatMessage = {
        id: `gift-chat-${gift.id || Date.now()}`,
        platform: 'tiktok',
        username: gift.username,
        displayName: gift.displayName || gift.username,
        avatar: gift.avatar,
        message: `🎁 Mengirim ${gift.giftName || 'Gift'} × ${gift.giftCount || 1}`,
        badges: ['GIFT'],
        timestamp: gift.timestamp || Date.now(),
        type: 'chat'
      };
      this.recentChats.push(giftChatMsg);
      if (this.recentChats.length > this.maxStoredChats) {
        this.recentChats.shift();
      }
      this.broadcast({ type: 'chat', data: giftChatMsg });
    };

    eventBus.on('gift-alert', handleGift);
    eventBus.on('gift-event', handleGift);

    eventBus.on('status-change', (platform, status, error) => {
      this.broadcast({ type: 'status-change', platform, status, error });
    });

    eventBus.on('log', (level, message) => {
      this.broadcast({ type: 'log', level, message });
    });

    eventBus.on('settings-updated', (settings) => {
      this.currentSettings = { ...settings };
      this.broadcast({ type: 'settings', data: settings });
    });
  }

  public updateSettings(settings: AppSettings) {
    this.currentSettings = { ...settings };
    this.broadcast({ type: 'settings', data: settings });
  }

  public getSettings(): AppSettings {
    return this.currentSettings;
  }

  public getRecentChats(): ChatMessage[] {
    return this.recentChats;
  }

  public start(port: number = 3210): Promise<void> {
    this.port = port;

    return new Promise((resolve, _reject) => {
      if (this.server) {
        this.stop();
      }

      this.server = http.createServer(async (req, res) => {
        // Enable CORS for API & Web access
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        const url = new URL(req.url || '/', `http://127.0.0.1:${this.port}`);
        const pathname = (url.pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';

        // --- REST API Endpoints ---
        if (pathname === '/api/status') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              status: 'ok',
              youtube: {
                status: youtubeAdapter.getStatus(),
                target: youtubeAdapter.getTarget(),
              },
              tiktok: {
                status: tiktokAdapter.getStatus(),
                username: tiktokAdapter.getUsername(),
              },
              settings: settingsStore.getSettings(),
            })
          );
          return;
        }

        if (pathname === '/api/youtube/connect' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          try {
            if (body.target) {
              settingsStore.saveSettings({ youtubeTarget: body.target });
            }
            await youtubeAdapter.connect(body.target || '');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } catch (err: any) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
          return;
        }

        if (pathname === '/api/youtube/disconnect' && req.method === 'POST') {
          youtubeAdapter.disconnect();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }

        if (pathname === '/api/youtube/status') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              status: youtubeAdapter.getStatus(),
              target: youtubeAdapter.getTarget(),
            })
          );
          return;
        }

        if (pathname === '/api/tiktok/connect' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          try {
            const current = settingsStore.getSettings();
            if (body.username) {
              settingsStore.saveSettings({ tiktokUsername: body.username });
            }
            await tiktokAdapter.connect(body.username || '', body.apiKey || current.tiktokApiKey);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } catch (err: any) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
          return;
        }

        if (pathname === '/api/tiktok/disconnect' && req.method === 'POST') {
          tiktokAdapter.disconnect();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }

        if (pathname === '/api/tiktok/status') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              status: tiktokAdapter.getStatus(),
              username: tiktokAdapter.getUsername(),
            })
          );
          return;
        }

        if (pathname === '/api/settings') {
          if (req.method === 'POST') {
            const body = await parseJsonBody(req);
            const saved = settingsStore.saveSettings(body);
            this.updateSettings(saved);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(saved));
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(settingsStore.getSettings()));
          }
          return;
        }

        if (pathname === '/api/test/chat' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const msg = sendTestChatMessage(body.custom);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: msg }));
          return;
        }

        if (pathname === '/api/test/gift' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          const gift = sendTestGiftEvent(body.custom);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, gift }));
          return;
        }

        if (pathname === '/api/gift/replay' && req.method === 'POST') {
          const body = await parseJsonBody(req);
          if (body.gift) {
            const replay: GiftEvent = {
              ...body.gift,
              id: `replay-${Date.now()}-${body.gift.giftId || 'g'}`,
              timestamp: Date.now(),
            };
            giftQueue.enqueueGift(replay);
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }

        if (pathname === '/api/overlay/urls') {
          const s = settingsStore.getSettings();
          const p = s.overlayPort || this.port;
          const host = req.headers.host || `127.0.0.1:${p}`;
          const proto = (req.headers['x-forwarded-proto'] as string) || (host.includes('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              port: p,
              chat: `${proto}://${host}/overlay/chat`,
              gifts: `${proto}://${host}/overlay/gifts`,
              all: `${proto}://${host}/overlay/all`,
            })
          );
          return;
        }

        // --- OBS Overlays HTML ---
        if (
          pathname === '/overlay/chat' ||
          pathname === '/overlay/chats' ||
          pathname === '/chat' ||
          pathname === '/chats'
        ) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(this.renderOverlayHtml('chat'));
        } else if (
          pathname === '/overlay/gifts' ||
          pathname === '/overlay/gift' ||
          pathname === '/gifts' ||
          pathname === '/gift'
        ) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(this.renderOverlayHtml('gifts'));
        } else if (
          pathname === '/overlay/all' ||
          pathname === '/all'
        ) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(this.renderOverlayHtml('all'));
        } else if (pathname === '/status') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok', clients: this.wss ? this.wss.clients.size : 0 }));
        } else {
          // Landing page with links to overlays
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(this.renderIndexHtml());
        }
      });

      // Setup WebSocket Server
      this.wss = new WebSocketServer({ server: this.server, path: '/ws' });

      this.wss.on('connection', (ws: WebSocket) => {
        eventBus.emit('log', 'info', `[OverlayServer] Client connected. Total: ${this.wss?.clients.size}`);

        // Send initial state to newly connected client
        const recentGiftValid =
          this.lastGift && Date.now() - (this.lastGift.timestamp || 0) < 15000 ? this.lastGift : null;

        ws.send(
          JSON.stringify({
            type: 'init',
            settings: this.currentSettings,
            recentChats: this.recentChats.slice(-this.currentSettings.chatMaxMessages),
            recentGift: recentGiftValid,
            youtube: {
              status: youtubeAdapter.getStatus(),
              target: youtubeAdapter.getTarget(),
            },
            tiktok: {
              status: tiktokAdapter.getStatus(),
              username: tiktokAdapter.getUsername(),
            },
          })
        );

        ws.on('message', async (message: string) => {
          try {
            const data = JSON.parse(message.toString());
            if (data.type === 'ping') {
              ws.send(JSON.stringify({ type: 'pong' }));
              return;
            }

            // WebSocket actions sent from Web/Codespaces frontend
            if (data.action === 'youtube:connect' && data.target) {
              settingsStore.saveSettings({ youtubeTarget: data.target });
              await youtubeAdapter.connect(data.target);
            } else if (data.action === 'youtube:disconnect') {
              youtubeAdapter.disconnect();
            } else if (data.action === 'tiktok:connect' && data.username) {
              const current = settingsStore.getSettings();
              settingsStore.saveSettings({ tiktokUsername: data.username });
              await tiktokAdapter.connect(data.username, data.apiKey || current.tiktokApiKey);
            } else if (data.action === 'tiktok:disconnect') {
              tiktokAdapter.disconnect();
            } else if (data.action === 'settings:save' && data.settings) {
              const updated = settingsStore.saveSettings(data.settings);
              this.updateSettings(updated);
            } else if (data.action === 'test:chat') {
              sendTestChatMessage(data.custom);
            } else if (data.action === 'test:gift') {
              sendTestGiftEvent(data.custom);
            } else if (data.action === 'gift:replay' && data.gift) {
              const replay: GiftEvent = {
                ...data.gift,
                id: `replay-${Date.now()}-${data.gift.giftId || 'g'}`,
                timestamp: Date.now(),
              };
              giftQueue.enqueueGift(replay);
            }
          } catch (err: any) {
            eventBus.emit('log', 'error', `[OverlayServer] Action error: ${err.message}`);
          }
        });

        ws.on('close', () => {
          eventBus.emit('log', 'info', `[OverlayServer] Client disconnected. Total: ${this.wss?.clients.size}`);
        });

        ws.on('error', (err) => {
          eventBus.emit('log', 'warn', `[OverlayServer] WS Client error: ${err.message}`);
        });
      });

      this.server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          eventBus.emit('log', 'warn', `[OverlayServer] Port ${this.port} sedang digunakan, mencoba port ${this.port + 1}...`);
          this.port++;
          this.currentSettings.overlayPort = this.port;
          setTimeout(() => {
            if (this.server) {
              this.server.listen(this.port, '0.0.0.0');
            }
          }, 200);
        } else {
          eventBus.emit('log', 'error', `[OverlayServer] Server error on port ${this.port}: ${err.message}`);
          resolve();
        }
      });

      this.server.listen(this.port, '0.0.0.0', () => {
        eventBus.emit('log', 'info', `[OverlayServer] Server listening on port ${this.port} (http://127.0.0.1:${this.port})`);
        resolve();
      });
    });
  }

  public broadcast(payload: any) {
    if (!this.wss) return;
    const jsonStr = JSON.stringify(payload);
    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(jsonStr);
      }
    }
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.wss) {
        this.wss.close();
        this.wss = null;
      }
      if (this.server) {
        this.server.close(() => {
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  private renderOverlayHtml(mode: 'chat' | 'gifts' | 'all'): string {
    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>StreamChat Overlay - ${mode.toUpperCase()}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden !important;
      background: transparent !important;
      font-family: 'Plus Jakarta Sans', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Apple Color Emoji', 'Noto Color Emoji', -apple-system, BlinkMacSystemFont, sans-serif;
      user-select: none;
    }

    #overlay-root {
      position: relative;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      pointer-events: none;
    }

    /* CHAT CONTAINER */
    #chat-container {
      display: ${mode === 'gifts' ? 'none' : 'flex'};
      flex-direction: column;
      justify-content: flex-end;
      gap: 8px;
      padding: 16px;
      position: absolute;
      left: 0;
      bottom: 0;
      width: 100%;
      max-width: 460px;
      max-height: 100vh;
      overflow: hidden;
    }

    .chat-bubble {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 8px 12px;
      border-radius: 12px;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      word-break: break-word;
      opacity: 1;
    }

    .chat-bubble.anim-slide {
      animation: slideInChat 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .chat-bubble.anim-fade {
      animation: fadeInChat 0.35s ease forwards;
    }
    .chat-bubble.anim-pop {
      animation: popInChat 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    @keyframes slideInChat {
      from { opacity: 0; transform: translateX(-30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes fadeInChat {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes popInChat {
      from { opacity: 0; transform: scale(0.85); }
      to { opacity: 1; transform: scale(1); }
    }

    .chat-bubble.fade-out {
      opacity: 0;
      transform: translateY(-8px) scale(0.96);
      transition: opacity 0.6s ease, transform 0.6s ease;
    }

    .chat-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
      background: #334155;
      border: 1.5px solid rgba(255, 255, 255, 0.2);
    }

    .chat-content {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }

    .chat-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 2px;
      flex-wrap: wrap;
    }

    .badge-yt, .badge-tt {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.5px;
      padding: 1px 6px;
      border-radius: 4px;
      color: #fff;
      text-transform: uppercase;
      box-shadow: 0 1px 4px rgba(0,0,0,0.4);
    }
    .badge-yt {
      background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
    }
    .badge-tt {
      background: linear-gradient(135deg, #00f2fe 0%, #4facfe 50%, #ff007f 100%);
      text-shadow: 0 0 4px rgba(0,0,0,0.6);
    }

    .author-badge {
      font-size: 9px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 3px;
      background: rgba(255, 215, 0, 0.2);
      color: #ffd700;
      border: 1px solid rgba(255, 215, 0, 0.3);
    }

    .chat-username {
      font-size: 13px;
      font-weight: 700;
      color: #f8fafc;
      text-shadow: 0 1px 2px rgba(0,0,0,0.8);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .chat-text {
      font-size: 15px;
      font-weight: 500;
      line-height: 1.35;
      color: #ffffff;
      text-shadow: 0 1px 3px rgba(0,0,0,0.85);
      word-wrap: break-word;
      font-variant-emoji: emoji;
    }

    .yt-custom-emote {
      height: 1.25em;
      width: 1.25em;
      vertical-align: -0.22em;
      display: inline-block;
      object-fit: contain;
    }

    /* GIFT ALERT CONTAINER */
    /* GIFT ALERT CONTAINER - NATIVE TIKTOK FLOATING STICKER */
    #gift-container {
      display: flex;
      position: absolute;
      top: 35%;
      left: 50%;
      transform: translate(-50%, -50%);
      justify-content: center;
      align-items: center;
      z-index: 1000;
      pointer-events: none;
    }

    .badge-gift {
      background: linear-gradient(135deg, #f43f5e, #fb7185) !important;
      color: #fff !important;
      font-weight: 800 !important;
      box-shadow: 0 0 8px rgba(244, 63, 94, 0.6) !important;
    }

    .gift-card {
      position: relative;
      display: inline-flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
      margin: 0 !important;
      pointer-events: none;
    }

    /* GIFT ANIMATION PRESETS */
    .gift-anim-bounce {
      animation: giftBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    .gift-anim-pop {
      animation: giftPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    .gift-anim-slide {
      animation: giftSlide 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .gift-anim-fade {
      animation: giftFade 0.4s ease-out forwards;
    }

    .gift-exit {
      animation: giftExit 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
    }

    @keyframes giftBounce {
      0% { opacity: 0; transform: scale(0.2) translateY(-70px); }
      50% { transform: scale(1.22) translateY(10px); }
      70% { transform: scale(0.95) translateY(-3px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes giftPop {
      0% { opacity: 0; transform: scale(0.25); }
      75% { transform: scale(1.25); }
      100% { opacity: 1; transform: scale(1); }
    }
    @keyframes giftSlide {
      0% { opacity: 0; transform: translateY(-90px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes giftFade {
      0% { opacity: 0; transform: scale(0.8); }
      100% { opacity: 1; transform: scale(1); }
    }
    @keyframes giftExit {
      0% { opacity: 1; transform: scale(1); }
      100% { opacity: 0; transform: scale(0.4) translateY(-35px); }
    }

    .tiktok-sticker-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 12px 28px rgba(0, 0, 0, 0.55));
    }

    .tiktok-sticker-img {
      width: 140px;
      height: 140px;
      object-fit: contain;
      filter: drop-shadow(0 0 24px rgba(254, 44, 85, 0.55)) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.4));
      animation: tiktokStickerWobble 1.2s ease-in-out infinite alternate;
      will-change: transform;
    }

    @keyframes tiktokStickerWobble {
      0% { transform: scale(1) rotate(-4deg); }
      100% { transform: scale(1.1) rotate(4deg); }
    }

    .tiktok-combo-badge {
      font-family: 'Plus Jakarta Sans', Impact, -apple-system, BlinkMacSystemFont, sans-serif;
      font-style: italic;
      font-weight: 900;
      font-size: 52px;
      line-height: 1;
      letter-spacing: -1.5px;
      margin-left: 12px;
      background: linear-gradient(180deg, #fffbc2 0%, #ffbe00 45%, #ff3b00 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      -webkit-text-stroke: 2.5px #000000;
      filter: drop-shadow(3px 3px 0 #000000) drop-shadow(0 0 16px rgba(255, 140, 0, 0.9));
      animation: comboPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      display: inline-block;
      white-space: nowrap;
    }

    @keyframes comboPop {
      0% { transform: scale(0.3) rotate(-15deg); opacity: 0; }
      75% { transform: scale(1.28) rotate(6deg); opacity: 1; }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
  </style>
</head>
<body>
  <div id="overlay-root">
    <!-- GIFT ALERT COMPONENT -->
    <div id="gift-container"></div>

    <!-- CHAT CONTAINER -->
    <div id="chat-container"></div>
  </div>

  <script>
    (function() {
      var currentSettings = {
        chatFontFamily: "'Plus Jakarta Sans'",
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
        giftShowUsername: true,
        giftShowGiftName: true,
        giftShowGiftCount: true,
        giftSoundEffect: true,
        giftDelaySeconds: 0.5
      };
      var chatContainer = document.getElementById('chat-container');
      var giftContainer = document.getElementById('gift-container');
      var audioCtx = null;

      function playChimeSound() {
        if (!currentSettings || currentSettings.giftSoundEffect === false) return;
        try {
          if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          }
          if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(function() {});
          }

          var now = audioCtx.currentTime;
          var osc1 = audioCtx.createOscillator();
          var osc2 = audioCtx.createOscillator();
          var gain = audioCtx.createGain();

          osc1.type = 'triangle';
          osc2.type = 'sine';

          osc1.frequency.setValueAtTime(587.33, now); // D5
          osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
          osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.28); // D6

          osc2.frequency.setValueAtTime(440, now);
          osc2.frequency.exponentialRampToValueAtTime(880, now + 0.28);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(audioCtx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.85);
          osc2.stop(now + 0.85);
        } catch (e) {
          console.warn('Audio play error:', e);
        }
      }

      function applyStyles(settings) {
        if (!settings) return;
        currentSettings = Object.assign({}, currentSettings, settings);

        var userFont = currentSettings.chatFontFamily || "'Plus Jakarta Sans'";
        document.body.style.fontFamily = userFont + ", 'Segoe UI Emoji', 'Segoe UI Symbol', 'Apple Color Emoji', 'Noto Color Emoji', -apple-system, BlinkMacSystemFont, sans-serif";

        var bubbles = document.querySelectorAll('.chat-bubble');
        var hexBg = currentSettings.chatBgColor || '#0f172a';
        var opacity = (currentSettings.chatBgOpacity !== undefined ? currentSettings.chatBgOpacity : 75) / 100;
        var r = parseInt(hexBg.slice(1, 3), 16) || 15;
        var g = parseInt(hexBg.slice(3, 5), 16) || 23;
        var b = parseInt(hexBg.slice(5, 7), 16) || 42;
        var rgbaBg = 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')';

        bubbles.forEach(function(el) {
          el.style.backgroundColor = rgbaBg;
          var textEl = el.querySelector('.chat-text');
          if (textEl) {
            textEl.style.color = currentSettings.chatTextColor || '#ffffff';
            textEl.style.fontSize = (currentSettings.chatFontSize || 16) + 'px';
          }
        });
      }

      function addChatMessage(msg) {
        if (!chatContainer || !currentSettings) return;

        var bubble = document.createElement('div');
        bubble.className = 'chat-bubble anim-' + (currentSettings.chatAnimation || 'slide');

        var hexBg = currentSettings.chatBgColor || '#0f172a';
        var opacity = (currentSettings.chatBgOpacity !== undefined ? currentSettings.chatBgOpacity : 75) / 100;
        var r = parseInt(hexBg.slice(1, 3), 16) || 15;
        var g = parseInt(hexBg.slice(3, 5), 16) || 23;
        var b = parseInt(hexBg.slice(5, 7), 16) || 42;
        bubble.style.backgroundColor = 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')';

        var avatarHtml = '';
        if (currentSettings.chatShowAvatar) {
          var avatarUrl = msg.avatar || (msg.platform === 'youtube'
            ? 'https://api.dicebear.com/7.x/identicon/svg?seed=' + encodeURIComponent(msg.username)
            : 'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(msg.username));
          avatarHtml = '<img class="chat-avatar" src="' + avatarUrl + '" onerror="this.remove()" />';
        }

        var badgeHtml = '';
        if (currentSettings.chatShowBadge) {
          if (msg.platform === 'youtube') {
            badgeHtml += '<span class="badge-yt">YT</span>';
          } else {
            badgeHtml += '<span class="badge-tt">TT</span>';
          }
        }

        if (Array.isArray(msg.badges)) {
          msg.badges.forEach(function(b) {
            badgeHtml += '<span class="author-badge' + (b === 'GIFT' ? ' badge-gift' : '') + '">' + escapeHtml(b) + '</span>';
          });
        }

        var name = escapeHtml(msg.displayName || msg.username);
        var text = renderMessageContent(msg.message);
        var fontSize = (currentSettings.chatFontSize || 16) + 'px';
        var textColor = currentSettings.chatTextColor || '#ffffff';

        bubble.innerHTML = avatarHtml +
          '<div class="chat-content">' +
            '<div class="chat-header">' +
              badgeHtml +
              '<span class="chat-username">' + name + '</span>' +
            '</div>' +
            '<div class="chat-text" style="color:' + textColor + '; font-size:' + fontSize + ';">' + text + '</div>' +
          '</div>';

        chatContainer.appendChild(bubble);

        // Limit visible messages
        var maxMsgs = currentSettings.chatMaxMessages || 40;
        while (chatContainer.children.length > maxMsgs) {
          chatContainer.removeChild(chatContainer.firstChild);
        }

        // Auto remove message after duration
        var durationSec = currentSettings.chatDurationSeconds;
        if (durationSec && durationSec > 0) {
          setTimeout(function() {
            bubble.classList.add('fade-out');
            setTimeout(function() {
              if (bubble.parentNode) {
                bubble.parentNode.removeChild(bubble);
              }
            }, 650);
          }, durationSec * 1000);
        }
      }

      var giftAlertQueue = [];
      var isGiftAlertActive = false;

      function enqueueGiftAlert(gift) {
        if (!gift) return;
        if (giftAlertQueue.length >= 35) {
          giftAlertQueue.shift();
        }
        giftAlertQueue.push(gift);
        processGiftAlertQueue();
      }

      function processGiftAlertQueue() {
        if (isGiftAlertActive || giftAlertQueue.length === 0) return;
        isGiftAlertActive = true;

        var gift = giftAlertQueue.shift();
        showGiftAlert(gift, function() {
          var delaySec = (currentSettings && currentSettings.giftDelaySeconds !== undefined)
            ? Number(currentSettings.giftDelaySeconds)
            : 0.5;
          var interDelayMs = Math.max(150, delaySec * 1000);

          setTimeout(function() {
            isGiftAlertActive = false;
            processGiftAlertQueue();
          }, interDelayMs);
        });
      }

      function showGiftAlert(gift, onComplete) {
        if (!giftContainer || !gift) {
          if (typeof onComplete === 'function') onComplete();
          return;
        }
        // On dedicated gifts overlay, always display! On other overlays, check settings
        if ('${mode}' !== 'gifts' && currentSettings && currentSettings.giftAnimationEnabled === false) {
          if (typeof onComplete === 'function') onComplete();
          return;
        }

        playChimeSound();

        var card = document.createElement('div');
        var preset = (currentSettings && currentSettings.giftAnimationPreset) || 'bounce';
        card.className = 'gift-card gift-anim-' + preset;

        var defaultSticker = 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/3f02fa9594bd1495ff4e8aa5ae265eef~tplv-obj.png';
        var stickerUrl = gift.giftPictureUrl || getTikTokStickerByName(gift.giftName || '', gift.giftId) || defaultSticker;
        var count = gift.giftCount || 1;

        var countHtml = '<span class="tiktok-combo-badge">× ' + count + '</span>';

        // PURE NATIVE TIKTOK FLOATING STICKER (NO USERNAME, NO GIFT NAME, NO BOX)
        card.innerHTML =
          '<div class="tiktok-sticker-wrapper">' +
            '<img class="tiktok-sticker-img" src="' + stickerUrl + '" onerror="handleGiftImgError(this)" />' +
            countHtml +
          '</div>';

        giftContainer.innerHTML = '';
        giftContainer.appendChild(card);

        var durationMs = ((currentSettings && currentSettings.giftDurationSeconds) || 4) * 1000;
        // Dynamically accelerate slightly if spam backlog exceeds 4
        if (giftAlertQueue.length > 4) {
          durationMs = Math.max(1600, durationMs * 0.65);
        }

        setTimeout(function() {
          card.classList.add('gift-exit');
          setTimeout(function() {
            if (card.parentNode) {
              card.parentNode.removeChild(card);
            }
            if (typeof onComplete === 'function') {
              onComplete();
            }
          }, 450);
        }, durationMs);
      }

      function handleGiftImgError(img) {
        if (!img) return;
        img.onerror = null;
        img.src = 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/3f02fa9594bd1495ff4e8aa5ae265eef~tplv-obj.png';
      }

      function getTikTokStickerByName(name, id) {
        var n = (name || '').toLowerCase();
        var idStr = String(id || '').trim();
        if (idStr === '6064' || n.includes('gg')) return 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/3f02fa9594bd1495ff4e8aa5ae265eef~tplv-obj.png';
        if (idStr === '5655' || idStr === '5489' || n.includes('rose') || n.includes('mawar')) return 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/9b1f08d38a7516eaa242c760dc0f5547.png~tplv-obj.png';
        if (idStr === '5269' || n.includes('tiktok')) return 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/d356c9d7499625345a90ad1df1b31278.png~tplv-obj.png';
        if (idStr === '5827' || n.includes('heart me')) return 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/4e2fc1042c03164917a26cb595bfddf9.png~tplv-obj.png';
        if (idStr === '5585' || n.includes('finger heart')) return 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/da931ff73e6587d159a6078e47f5cfb3.png~tplv-obj.png';
        if (idStr === '5658' || n.includes('doughnut') || n.includes('donat')) return 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/db1ebcfb99db10e39540c4a45a32b6e1.png~tplv-obj.png';
        if (idStr === '5656' || n.includes('ice cream') || n.includes('es krim')) return 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/0a316d3fdf6c63b15fa4d38c6b72a0c6.png~tplv-obj.png';
        if (idStr === '6143' || n.includes('lion') || n.includes('singa')) return 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/44d1565e3176d05f320f78a7f23be3f7.png~tplv-obj.png';
        if (idStr === '2150' || n.includes('whale') || n.includes('paus')) return 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/a6755ca7b6bb27efc6b75c5e87a27eb2.png~tplv-obj.png';
        if (idStr === '6144' || n.includes('universe')) return 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/6ecda201ee19d297ff0111f1ae55b76d.png~tplv-obj.png';
        return 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/3f02fa9594bd1495ff4e8aa5ae265eef~tplv-obj.png';
      }

      function escapeHtml(str) {
        if (!str) return '';
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      }

      function renderMessageContent(rawText) {
        if (!rawText) return '';
        var escaped = escapeHtml(rawText);
        var parts = escaped.split('[yt-emote:');
        if (parts.length === 1) return escaped;
        var res = parts[0];
        for (var i = 1; i < parts.length; i++) {
          var closeIdx = parts[i].indexOf(']');
          if (closeIdx !== -1) {
            var url = parts[i].substring(0, closeIdx);
            var rest = parts[i].substring(closeIdx + 1);
            res += '<img class="yt-custom-emote" src="' + url + '" onerror="this.remove()" />' + rest;
          } else {
            res += '[yt-emote:' + parts[i];
          }
        }
        return res;
      }

      // WebSocket Connection with Auto Reconnect
      var ws = null;
      var reconnectDelay = 1000;

      function connectWS() {
        var params = new URLSearchParams(window.location.search);
        var targetServer = params.get('server');
        var wsUrl;
        if (targetServer) {
          var trimmed = targetServer.trim().replace(/\/+$/, '');
          if (trimmed.startsWith('ws://') || trimmed.startsWith('wss://')) {
            wsUrl = trimmed.endsWith('/ws') ? trimmed : (trimmed + '/ws');
          } else {
            var proto = trimmed.startsWith('https://') ? 'wss:' : 'ws:';
            var host = trimmed.replace(/^https?:\/\//, '');
            wsUrl = proto + '//' + host + '/ws';
          }
        } else {
          var protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          wsUrl = protocol + '//' + window.location.host + '/ws';
        }

        ws = new WebSocket(wsUrl);

        ws.onopen = function() {
          reconnectDelay = 1000;
          console.log('[Overlay] Terhubung ke WebSocket server');

          var readyBadge = document.createElement('div');
          readyBadge.id = 'streamchat-ready-badge';
          readyBadge.innerText = '⚡ Overlay Connected & Ready';
          readyBadge.style.cssText = 'position:fixed;bottom:12px;right:12px;background:rgba(16,185,129,0.9);color:#ffffff;padding:5px 12px;border-radius:8px;font-size:12px;font-weight:700;z-index:99999;box-shadow:0 2px 10px rgba(0,0,0,0.5);transition:opacity 0.8s ease;pointer-events:none;font-family:sans-serif;';
          document.body.appendChild(readyBadge);
          setTimeout(function() {
            readyBadge.style.opacity = '0';
            setTimeout(function() {
              if (readyBadge.parentNode) {
                readyBadge.parentNode.removeChild(readyBadge);
              }
            }, 800);
          }, 3000);
        };

        ws.onmessage = function(event) {
          try {
            var msg = JSON.parse(event.data);
            if (msg.type === 'init') {
              applyStyles(msg.settings);
              if (Array.isArray(msg.recentChats)) {
                msg.recentChats.forEach(addChatMessage);
              }
              if (msg.recentGift) {
                enqueueGiftAlert(msg.recentGift);
              }
            } else if (msg.type === 'settings') {
              applyStyles(msg.data);
            } else if (msg.type === 'chat') {
              addChatMessage(msg.data);
            } else if (msg.type === 'gift-alert') {
              enqueueGiftAlert(msg.data);
            }
          } catch (e) {
            console.error('Error handling WS event:', e);
          }
        };

        ws.onclose = function() {
          console.warn('[Overlay] WebSocket terputus. Mencoba reconnect...');
          setTimeout(connectWS, reconnectDelay);
          reconnectDelay = Math.min(reconnectDelay * 1.5, 10000);
        };

        ws.onerror = function(err) {
          console.error('[Overlay] WebSocket error:', err);
        };
      }

      connectWS();
    })();
  </script>
</body>
</html>`;
  }

  private renderIndexHtml(): string {
    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>StreamChat Desktop - OBS Overlays</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    body {
      background: #090d16;
      color: #f1f5f9;
      font-family: 'Plus Jakarta Sans', sans-serif;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .card {
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 16px;
      max-width: 600px;
      width: 100%;
      padding: 32px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      color: #38bdf8;
      margin-bottom: 8px;
    }
    p {
      color: #94a3b8;
      font-size: 14px;
      margin-bottom: 24px;
    }
    .link-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .link-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #1e293b;
      padding: 14px 18px;
      border-radius: 10px;
      text-decoration: none;
      color: #fff;
      font-weight: 600;
      border: 1px solid #334155;
      transition: all 0.2s;
    }
    .link-item:hover {
      background: #2563eb;
      border-color: #3b82f6;
    }
    code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: #38bdf8;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>StreamChat Desktop — OBS Overlays</h1>
    <p>Salin URL berikut dan tambahkan sebagai Browser Source di OBS Studio:</p>
    <div class="link-group">
      <a class="link-item" href="/overlay/chat" target="_blank">
        <span>💬 Chat Overlay (YouTube + TikTok)</span>
        <code>/overlay/chat</code>
      </a>
      <a class="link-item" href="/overlay/gifts" target="_blank">
        <span>🎁 Gift Alert Overlay (TikTok)</span>
        <code>/overlay/gifts</code>
      </a>
      <a class="link-item" href="/overlay/all" target="_blank">
        <span>🔥 Combined Overlay (Chat + Gift)</span>
        <code>/overlay/all</code>
      </a>
    </div>
  </div>
</body>
</html>`;
  }
}

export const overlayServer = new OverlayServer();
