import assert from 'assert';
import { youtubeAdapter } from '../electron/services/youtube-adapter';
import { tiktokAdapter } from '../electron/services/tiktok-adapter';
import { overlayServer } from '../electron/services/overlay-server';
import { settingsStore } from '../electron/services/store';
import { sendTestChatMessage, sendTestGiftEvent } from '../electron/services/test-generator';

async function runTests() {
  console.log('🧪 Running Core System Verification...');

  // 1. Settings Store
  const settings = settingsStore.getSettings();
  assert(settings && typeof settings === 'object', 'Settings must be an object');
  console.log('  ✓ SettingsStore loaded successfully');

  // 2. YouTube Adapter Initial State
  assert.strictEqual(youtubeAdapter.getStatus(), 'disconnected', 'YouTube should initially be disconnected');
  console.log('  ✓ YouTubeAdapter initialized correctly');

  // 3. TikTok Adapter Initial State
  assert.strictEqual(tiktokAdapter.getStatus(), 'disconnected', 'TikTok should initially be disconnected');
  console.log('  ✓ TikTokAdapter initialized correctly');

  // 4. Test Chat Generator
  const testChat = sendTestChatMessage({ message: 'Unit test chat message' });
  assert.strictEqual(testChat.message, 'Unit test chat message', 'Test chat content matches');
  console.log('  ✓ Chat Message generator works');

  // 5. Test Gift Generator
  const testGift = sendTestGiftEvent();
  assert(testGift.giftName, 'Test gift must have a name');
  console.log('  ✓ Gift Event generator works');

  // 6. Overlay Server Start & Stop
  const testPort = 3299;
  await overlayServer.start(testPort);
  console.log('  ✓ OverlayServer started on test port', testPort);
  await overlayServer.stop();
  console.log('  ✓ OverlayServer stopped cleanly');

  console.log('\n🎉 ALL CORE TESTS PASSED SUCCESSFULLY!\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
