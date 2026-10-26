import { overlayServer } from './electron/services/overlay-server';
import { youtubeAdapter } from './electron/services/youtube-adapter';
import { tiktokAdapter } from './electron/services/tiktok-adapter';
import { giftQueue } from './electron/services/gift-queue';
import { settingsStore } from './electron/services/store';
import { eventBus } from './electron/services/event-bus';

// Initialize giftQueue to listen to incoming gifts
const _queue = giftQueue;

const port = Number(process.env.PORT) || 3210;

console.log('🚀 Starting StreamChat Live Bridge Server...');

overlayServer.start(port).then(() => {
  console.log(`\n======================================================`);
  console.log(`✅ StreamChat Server running at http://localhost:${port}`);
  console.log(`   - OBS Overlay Chat:  http://localhost:${port}/overlay/chat`);
  console.log(`   - OBS Overlay Gifts: http://localhost:${port}/overlay/gifts`);
  console.log(`   - OBS Overlay All:   http://localhost:${port}/overlay/all`);
  console.log(`   - WebSocket Bridge:  ws://localhost:${port}/ws`);
  console.log(`   - REST API Status:   http://localhost:${port}/api/status`);
  console.log(`======================================================\n`);

  // Auto connect if configured in settings
  const settings = settingsStore.getSettings();
  if (settings.autoConnect) {
    if (settings.youtubeTarget) {
      console.log(`[AutoConnect] Connecting to YouTube: ${settings.youtubeTarget}`);
      youtubeAdapter.connect(settings.youtubeTarget).catch((err: any) => {
        console.error(`[AutoConnect] YouTube connect error: ${err.message}`);
      });
    }
    if (settings.tiktokUsername) {
      console.log(`[AutoConnect] Connecting to TikTok: @${settings.tiktokUsername}`);
      tiktokAdapter.connect(settings.tiktokUsername, settings.tiktokApiKey).catch((err: any) => {
        console.error(`[AutoConnect] TikTok connect error: ${err.message}`);
      });
    }
  }
}).catch((err) => {
  console.error('Failed to start StreamChat Server:', err);
});
