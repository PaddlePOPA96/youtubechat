import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ConnectionPanel } from './components/ConnectionPanel';
import { ChatList } from './components/ChatList';
import { GiftEventPanel } from './components/GiftEventPanel';
import { SettingsModal } from './components/SettingsModal';
import { OverlayLinksModal } from './components/OverlayLinksModal';
import { LogDrawer, LogEntry } from './components/LogDrawer';
import { Preloader } from './components/Preloader';
import { UpdateNotification } from './components/UpdateNotification';
import { ChatMessage, GiftEvent, ConnectionStatus, AppSettings, DEFAULT_SETTINGS } from './types';

export const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [gifts, setGifts] = useState<GiftEvent[]>([]);

  // App Version & Auto-Updater State
  const [appVersion, setAppVersion] = useState<string>('1.0.0');
  const [updateInfo, setUpdateInfo] = useState<{
    version: string;
    isDownloaded: boolean;
    progress?: number | null;
  } | null>(null);
  const [isUpdateDismissed, setIsUpdateDismissed] = useState<boolean>(false);

  // YouTube Connection State
  const [ytStatus, setYtStatus] = useState<ConnectionStatus>('disconnected');
  const [ytError, setYtError] = useState<string | undefined>();
  const [ytTarget, setYtTarget] = useState<string>('');

  // TikTok Connection State
  const [ttStatus, setTtStatus] = useState<ConnectionStatus>('disconnected');
  const [ttError, setTtError] = useState<string | undefined>();
  const [ttUsername, setTtUsername] = useState<string>('');

  // Settings & View Modes
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [showAvatar, setShowAvatar] = useState<boolean>(true);
  const [isChatOnly, setIsChatOnly] = useState<boolean>(false);
  const [isPinned, setIsPinned] = useState<boolean>(false);

  // Dark Mode & Window Opacity
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('streamchat_dark_mode');
      if (saved !== null) return saved === 'true';
    }
    return false;
  });

  const [windowOpacity, setWindowOpacityState] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('streamchat_window_opacity');
      if (saved) return Number(saved) || 100;
    }
    return 100;
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
      localStorage.setItem('streamchat_dark_mode', String(isDarkMode));
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      localStorage.setItem('streamchat_window_opacity', String(windowOpacity));
      document.documentElement.style.setProperty('--card-opacity', String(windowOpacity / 100));
      document.documentElement.style.setProperty('--window-bg-opacity', String(windowOpacity / 100));
      const api = (window as any).electronAPI;
      if (api?.setOpacity) {
        api.setOpacity(windowOpacity / 100);
      }
    }
  }, [windowOpacity]);

  // Modals & Drawers
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOverlayLinksOpen, setIsOverlayLinksOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [unreadLogsCount, setUnreadLogsCount] = useState(0);

  // Add system log
  const addLog = useCallback((level: 'info' | 'warn' | 'error', message: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [
      ...prev.slice(-200), // keep last 200 logs
      { id: `${Date.now()}-${Math.random()}`, time, level, message },
    ]);
    setUnreadLogsCount((c) => c + 1);
  }, []);

  // Initialize electron bridge listeners
  useEffect(() => {
    const api = (window as any).electronAPI;
    if (!api) {
      addLog('warn', 'Running in standard browser mode (Electron API not detected). Mock data will be used.');
      return;
    }

    // Load initial settings
    api.getSettings().then((loaded: AppSettings) => {
      setSettings(loaded);
      if (loaded.youtubeTarget) setYtTarget(loaded.youtubeTarget);
      if (loaded.tiktokUsername) setTtUsername(loaded.tiktokUsername);
      setShowAvatar(loaded.chatShowAvatar);

      // Auto connect if configured
      if (loaded.autoConnect) {
        if (loaded.youtubeTarget) {
          api.connectYouTube(loaded.youtubeTarget);
        }
        if (loaded.tiktokUsername) {
          api.connectTikTok(loaded.tiktokUsername);
        }
      }
    }).catch((err: any) => {
      addLog('error', `Failed to load settings: ${err.message}`);
    });

    // Check status
    api.getYouTubeStatus().then((s: any) => {
      setYtStatus(s.status);
      if (s.target) setYtTarget(s.target);
    });

    api.getTikTokStatus().then((s: any) => {
      setTtStatus(s.status);
      if (s.username) setTtUsername(s.username);
    });

    // Check Pin on Top (Always on Top) status
    if (api.isAlwaysOnTop) {
      api.isAlwaysOnTop().then((pinned: boolean) => {
        setIsPinned(pinned);
      }).catch(() => {});
    }

    // Get current App Version
    if (api.getVersion) {
      api.getVersion().then((v: string) => {
        if (v) setAppVersion(v);
      }).catch(() => {});
    }

    // Subscribe to chat messages with deduplication
    const unsubChat = api.onChatMessage((msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        const next = [...prev, msg];
        return next.slice(-200); // Keep max 200 messages in memory
      });
    });

    // Subscribe to gift events with streak merge and deduplication
    const unsubGift = api.onGiftEvent((gift: GiftEvent) => {
      setGifts((prev) => {
        // Drop exact duplicate ID
        if (prev.some((g) => g.id === gift.id)) return prev;

        // If from same user & same gift within 3 seconds, update count instead of creating duplicate
        const existingIdx = prev.findIndex(
          (g) => g.username === gift.username && g.giftId === gift.giftId && Math.abs(g.timestamp - gift.timestamp) < 3000
        );
        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            giftCount: Math.max(updated[existingIdx].giftCount, gift.giftCount),
            timestamp: gift.timestamp
          };
          return updated;
        }

        const next = [gift, ...prev];
        return next.slice(-100); // Keep max 100 gifts in memory
      });
    });

    // Subscribe to connection status changes
    const unsubStatus = api.onStatusChange((platform: 'youtube' | 'tiktok', status: ConnectionStatus, error?: string) => {
      if (platform === 'youtube') {
        setYtStatus(status);
        setYtError(error);
      } else {
        setTtStatus(status);
        setTtError(error);
      }
    });

    // Subscribe to logs
    const unsubLog = api.onLog((level: 'info' | 'warn' | 'error', message: string) => {
      addLog(level, message);
    });

    // Auto-Updater Listeners
    let unsubUpdateAvailable = () => {};
    if (api.onUpdateAvailable) {
      unsubUpdateAvailable = api.onUpdateAvailable((info: any) => {
        setUpdateInfo({
          version: info?.version || 'terbaru',
          isDownloaded: false,
          progress: 0,
        });
        setIsUpdateDismissed(false);
        addLog('info', `[Updater] Pembaruan v${info?.version || ''} ditemukan. Mengunduh patch...`);
      });
    }

    let unsubUpdateProgress = () => {};
    if (api.onUpdateProgress) {
      unsubUpdateProgress = api.onUpdateProgress((prog: any) => {
        setUpdateInfo((prev) => prev ? {
          ...prev,
          progress: prog?.percent ?? null,
        } : null);
      });
    }

    let unsubUpdateDownloaded = () => {};
    if (api.onUpdateDownloaded) {
      unsubUpdateDownloaded = api.onUpdateDownloaded((info: any) => {
        setUpdateInfo({
          version: info?.version || 'terbaru',
          isDownloaded: true,
          progress: 100,
        });
        setIsUpdateDismissed(false);
        addLog('info', `[Updater] Patch v${info?.version || ''} berhasil diunduh dan siap diterapkan.`);
      });
    }

    let unsubUpdateNotAvailable = () => {};
    if (api.onUpdateNotAvailable) {
      unsubUpdateNotAvailable = api.onUpdateNotAvailable(() => {
        setUpdateInfo(null);
        addLog('info', '[Updater] Aplikasi sudah versi terbaru.');
      });
    }

    return () => {
      unsubChat();
      unsubGift();
      unsubStatus();
      unsubLog();
      unsubUpdateAvailable();
      unsubUpdateProgress();
      unsubUpdateDownloaded();
      unsubUpdateNotAvailable();
    };
  }, [addLog]);

  // Actions
  const handleConnectYouTube = async (target: string) => {
    setYtTarget(target);
    setYtError(undefined);
    const api = (window as any).electronAPI;
    if (api) {
      await api.saveSettings({ youtubeTarget: target });
      await api.connectYouTube(target);
    } else {
      setYtStatus('connected');
      addLog('info', `[Mock] Connected to YouTube: ${target}`);
    }
  };

  const handleDisconnectYouTube = async () => {
    const api = (window as any).electronAPI;
    if (api) {
      await api.disconnectYouTube();
    } else {
      setYtStatus('disconnected');
      addLog('info', '[Mock] Disconnected from YouTube');
    }
  };

  const handleConnectTikTok = async (username: string) => {
    setTtUsername(username);
    setTtError(undefined);
    const api = (window as any).electronAPI;
    if (api) {
      await api.saveSettings({ tiktokUsername: username });
      await api.connectTikTok(username);
    } else {
      setTtStatus('connected');
      addLog('info', `[Mock] Connected to TikTok: @${username}`);
    }
  };

  const handleDisconnectTikTok = async () => {
    const api = (window as any).electronAPI;
    if (api) {
      await api.disconnectTikTok();
    } else {
      setTtStatus('disconnected');
      addLog('info', '[Mock] Disconnected from TikTok');
    }
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    setShowAvatar(newSettings.chatShowAvatar);
    const api = (window as any).electronAPI;
    if (api) {
      await api.saveSettings(newSettings);
    }
    addLog('info', 'Pengaturan berhasil disimpan');
  };

  const handleSendTestChat = async () => {
    const api = (window as any).electronAPI;
    if (api) {
      await api.sendTestChat();
    } else {
      // Mock chat for browser mode
      const platforms: ('youtube' | 'tiktok')[] = ['youtube', 'tiktok'];
      const p = platforms[Math.floor(Math.random() * platforms.length)];
      const names = ['AlexGamer', 'BudiSantoso', 'SitiRatu', 'StreamingPro'];
      const name = names[Math.floor(Math.random() * names.length)];
      const newMsg: ChatMessage = {
        id: `mock-${Date.now()}`,
        platform: p,
        username: name.toLowerCase(),
        displayName: name,
        message: 'Halo bang gameplay-nya seru banget! Mantap terus 🚀',
        badges: ['VIP'],
        timestamp: Date.now(),
        type: 'chat'
      };
      setMessages((prev) => [...prev, newMsg]);
    }
  };

  const handleSendTestGift = async () => {
    const api = (window as any).electronAPI;
    if (api) {
      await api.sendTestGift();
    } else {
      // Mock gift for browser mode
      const giftNames = ['Rose', 'TikTok', 'Heart Me', 'Ferrari', 'Lion'];
      const randomGift = giftNames[Math.floor(Math.random() * giftNames.length)];
      const newGift: GiftEvent = {
        id: `mock-gift-${Date.now()}`,
        platform: 'tiktok',
        type: 'gift',
        username: 'sultangaming',
        displayName: 'Sultan Gaming',
        giftName: randomGift,
        giftCount: Math.floor(Math.random() * 5) + 1,
        repeatEnd: true,
        timestamp: Date.now()
      };
      setGifts((prev) => [newGift, ...prev]);
    }
  };

  const handleReplayGift = async (gift: GiftEvent) => {
    const api = (window as any).electronAPI;
    if (api && api.replayGift) {
      await api.replayGift(gift);
      addLog('info', `[Overlay] Replay alert gift: ${gift.displayName || gift.username} (${gift.giftName})`);
    }
  };

  const handleTogglePin = async () => {
    const api = (window as any).electronAPI;
    if (api && api.setAlwaysOnTop) {
      try {
        const nextState = !isPinned;
        const result = await api.setAlwaysOnTop(nextState);
        setIsPinned(result);
        addLog('info', result ? '📌 Pin on Top diaktifkan (Jendela selalu di atas)' : '📌 Pin on Top dinonaktifkan (Jendela normal)');
      } catch (err: any) {
        addLog('error', `Gagal mengubah Pin on Top: ${err.message}`);
      }
    } else {
      setIsPinned(!isPinned);
    }
  };

  const handleInstallUpdate = async () => {
    const api = (window as any).electronAPI;
    if (api && api.installUpdate) {
      addLog('info', '[Updater] Menutup aplikasi untuk memasang patch update terbaru...');
      await api.installUpdate();
    } else {
      addLog('info', '[Updater] Update akan otomatis terpasang saat aplikasi dimulai ulang.');
    }
  };

  return (
    <div className="glow-atmosphere" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden'
    }}>
      {/* Intro Preloader Splash Screen */}
      <Preloader minDuration={1800} />

      {/* Header */}
      <Header
        ytStatus={ytStatus}
        ttStatus={ttStatus}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenOverlayLinks={() => setIsOverlayLinksOpen(true)}
        onToggleLogs={() => {
          setIsLogsOpen(!isLogsOpen);
          if (!isLogsOpen) setUnreadLogsCount(0);
        }}
        isLogsOpen={isLogsOpen}
        unreadLogsCount={unreadLogsCount}
        isChatOnly={isChatOnly}
        onToggleChatOnly={() => setIsChatOnly(!isChatOnly)}
        isPinned={isPinned}
        onTogglePin={handleTogglePin}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        windowOpacity={windowOpacity}
        onChangeOpacity={(val) => setWindowOpacityState(val)}
        appVersion={appVersion}
        hasUpdateReady={Boolean(updateInfo?.isDownloaded)}
        onOpenUpdateNotification={() => setIsUpdateDismissed(false)}
      />

      {/* Connection Panel (Hidden in Chat-Only Mode) */}
      {!isChatOnly && (
        <ConnectionPanel
          ytStatus={ytStatus}
          ytError={ytError}
          ytTarget={ytTarget}
          onConnectYouTube={handleConnectYouTube}
          onDisconnectYouTube={handleDisconnectYouTube}
          ttStatus={ttStatus}
          ttError={ttError}
          ttUsername={ttUsername}
          onConnectTikTok={handleConnectTikTok}
          onDisconnectTikTok={handleDisconnectTikTok}
        />
      )}

      {/* Main Content Area (Unified Chat + TikTok Gifts) */}
      <main style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: isChatOnly ? '1fr' : '1fr 360px',
        gap: '16px',
        padding: isChatOnly ? '10px 14px' : '16px 20px',
        minHeight: 0,
        overflow: 'hidden'
      }}>
        {/* Unified Chat List (100% in chat-only mode) */}
        <ChatList
          messages={messages}
          onClearChat={() => setMessages([])}
          showAvatar={showAvatar}
          onToggleAvatar={() => setShowAvatar(!showAvatar)}
          isChatOnly={isChatOnly}
        />

        {/* Gift Activity Panel (Only in full mode) */}
        {!isChatOnly && (
          <GiftEventPanel
            gifts={gifts}
            onClearGifts={() => setGifts([])}
            onSendTestGift={handleSendTestGift}
            onReplayGift={handleReplayGift}
          />
        )}
      </main>

      {/* Modals & Logs */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        appVersion={appVersion}
      />

      <OverlayLinksModal
        isOpen={isOverlayLinksOpen}
        onClose={() => setIsOverlayLinksOpen(false)}
        overlayPort={settings.overlayPort || 3210}
        customBackendUrl={settings.customBackendUrl}
      />

      <LogDrawer
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
        logs={logs}
        onClearLogs={() => setLogs([])}
      />

      {/* Auto-Update Notification Banner */}
      {updateInfo && !isUpdateDismissed && (
        <UpdateNotification
          currentVersion={appVersion}
          newVersion={updateInfo.version}
          isDownloaded={updateInfo.isDownloaded}
          downloadProgress={updateInfo.progress}
          onInstallNow={handleInstallUpdate}
          onDismiss={() => setIsUpdateDismissed(true)}
        />
      )}
    </div>
  );
};
