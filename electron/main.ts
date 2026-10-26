import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { eventBus } from './services/event-bus';
import { youtubeAdapter } from './services/youtube-adapter';
import { tiktokAdapter, getTikTokStickerUrl } from './services/tiktok-adapter';
import { overlayServer } from './services/overlay-server';
import { giftQueue } from './services/gift-queue';
import { settingsStore } from './services/store';
import { ChatMessage, GiftEvent, AppSettings } from '../src/types';

let mainWindow: BrowserWindow | null = null;

const devServerUrl = process.env.VITE_DEV_SERVER_URL;

function getAppIcon(): string | undefined {
  const iconPaths = [
    path.join(__dirname, '../public/icon.ico'),
    path.join(__dirname, '../assets/icon.ico'),
    path.join(__dirname, '../public/icon.png'),
    path.join(__dirname, '../assets/icon.png'),
  ];
  return iconPaths.find((p) => fs.existsSync(p));
}

async function createWindow() {
  const appIcon = getAppIcon();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 280,
    minHeight: 350,
    backgroundColor: '#f8fafd',
    title: 'StreamChat Desktop',
    icon: appIcon,
    frame: true,
    autoHideMenuBar: true,
    show: true,
    center: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // needed for custom IPC preload
    },
  });

  if (appIcon) {
    mainWindow.setIcon(appIcon);
  }

  mainWindow.setMenu(null);
  mainWindow.setMenuBarVisibility(false);
  mainWindow.setMinimumSize(280, 350);
  mainWindow.focus();

  const distHtml = path.join(__dirname, '../dist/index.html');

  if (devServerUrl) {
    try {
      await mainWindow.loadURL(devServerUrl);
    } catch {
      console.warn('[Electron] Could not reach dev server, falling back to dist/index.html');
      if (fs.existsSync(distHtml)) {
        mainWindow.loadFile(distHtml);
      }
    }
  } else {
    if (fs.existsSync(distHtml)) {
      mainWindow.loadFile(distHtml);
    } else {
      mainWindow.loadURL('http://localhost:5173').catch(() => {
        mainWindow?.loadFile(distHtml);
      });
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Setup IPC and Event Forwarding
function setupEventForwarding() {
  eventBus.on('chat-message', (msg: ChatMessage) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('chat:message', msg);
    }
  });

  eventBus.on('gift-event', (gift: GiftEvent) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('gift:event', gift);
    }
  });

  eventBus.on('status-change', (platform, status, error) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('status:change', platform, status, error);
    }
  });

  eventBus.on('log', (level, message) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('log:event', level, message);
    }
  });
}

function registerIpcHandlers() {
  // YouTube Handlers
  ipcMain.handle('youtube:connect', async (_event, target: string) => {
    try {
      await youtubeAdapter.connect(target);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('youtube:disconnect', async () => {
    youtubeAdapter.disconnect();
    return { success: true };
  });

  ipcMain.handle('youtube:status', async () => {
    return {
      status: youtubeAdapter.getStatus(),
      target: youtubeAdapter.getTarget(),
    };
  });

  // TikTok Handlers
  ipcMain.handle('tiktok:connect', async (_event, username: string) => {
    try {
      const settings = settingsStore.getSettings();
      await tiktokAdapter.connect(username, settings.tiktokApiKey);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('tiktok:disconnect', async () => {
    tiktokAdapter.disconnect();
    return { success: true };
  });

  ipcMain.handle('tiktok:status', async () => {
    return {
      status: tiktokAdapter.getStatus(),
      username: tiktokAdapter.getUsername(),
    };
  });

  // Settings Handlers
  ipcMain.handle('settings:get', async () => {
    return settingsStore.getSettings();
  });

  ipcMain.handle('settings:save', async (_event, updated: Partial<AppSettings>) => {
    const newSettings = settingsStore.saveSettings(updated);
    overlayServer.updateSettings(newSettings);
    eventBus.emit('settings-updated', newSettings);
    return newSettings;
  });

  // Overlay URLs
  ipcMain.handle('overlay:urls', async () => {
    const settings = settingsStore.getSettings();
    const port = settings.overlayPort || 3210;
    return {
      port,
      chat: `http://127.0.0.1:${port}/overlay/chat`,
      gifts: `http://127.0.0.1:${port}/overlay/gifts`,
      all: `http://127.0.0.1:${port}/overlay/all`,
    };
  });

  // Test Events
  ipcMain.handle('test:chat', async (_event, custom?: Partial<ChatMessage>) => {
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
    return { success: true };
  });

  ipcMain.handle('test:gift', async (_event, custom?: Partial<GiftEvent>) => {
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
    return { success: true };
  });

  ipcMain.handle('gift:replay', async (_event, gift: GiftEvent) => {
    if (!gift) return { success: false };
    const replayGift: GiftEvent = {
      ...gift,
      id: `replay-${Date.now()}-${gift.giftId || 'g'}`,
      timestamp: Date.now()
    };
    // Route replay through giftQueue so it adheres to delay
    giftQueue.enqueueGift(replayGift);
    return { success: true };
  });

  ipcMain.handle('open:external', async (_event, url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      await shell.openExternal(url);
    }
  });

  // Window Controls (Pin on Top)
  ipcMain.handle('window:isAlwaysOnTop', async () => {
    return mainWindow && !mainWindow.isDestroyed() ? mainWindow.isAlwaysOnTop() : false;
  });

  ipcMain.handle('window:setAlwaysOnTop', async (_event, flag: boolean) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setAlwaysOnTop(flag, 'screen-saver');
      return mainWindow.isAlwaysOnTop();
    }
    return false;
  });
}

// App lifecycle
app.whenReady().then(async () => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.streamchat.desktop');
  }

  setupEventForwarding();
  registerIpcHandlers();

  // Load settings & start overlay server
  const settings = settingsStore.getSettings();
  overlayServer.updateSettings(settings);

  try {
    await overlayServer.start(settings.overlayPort || 3210);
  } catch (err) {
    console.error('Failed to start overlay server on configured port:', err);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  youtubeAdapter.disconnect();
  tiktokAdapter.disconnect();
  await overlayServer.stop();
});
