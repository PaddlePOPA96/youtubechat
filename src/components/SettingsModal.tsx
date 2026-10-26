import React, { useState } from 'react';
import {
  XMarkIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  ServerIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { AppSettings, DEFAULT_SETTINGS } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [form, setForm] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<'chat' | 'gift' | 'server'>('chat');
  const [isSavedAlert, setIsSavedAlert] = useState(false);

  if (!isOpen) return null;

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(form);
    setIsSavedAlert(true);
    setTimeout(() => {
      setIsSavedAlert(false);
      onClose();
    }, 900);
  };

  const handleReset = () => {
    setForm({ ...DEFAULT_SETTINGS });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: '#e0f2fe',
              border: '1px solid #bae6fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0085ee',
              boxShadow: '0 2px 8px rgba(0, 133, 238, 0.15)'
            }}>
              <AdjustmentsHorizontalIcon style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>Pengaturan Overlay & Aplikasi</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Kustomisasi tampilan OBS overlay, animasi gift stiker, dan server
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '50%' }}>
            <XMarkIcon style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* Tab navigation (Glow Segmented Pills) */}
        <div style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '22px',
          background: '#f1f5f9',
          padding: '3px',
          borderRadius: '9999px',
          border: '1px solid #e2e8f0',
          width: 'fit-content'
        }}>
          <button
            type="button"
            className="btn"
            onClick={() => setActiveTab('chat')}
            style={{
              fontSize: '12px',
              padding: '6px 16px',
              borderRadius: '9999px',
              border: 'none',
              background: activeTab === 'chat' ? '#0085ee' : 'transparent',
              color: activeTab === 'chat' ? '#ffffff' : 'var(--text-secondary)',
              boxShadow: activeTab === 'chat' ? '0 2px 6px rgba(0, 133, 238, 0.35)' : 'none'
            }}
          >
            <ChatBubbleLeftRightIcon style={{ width: '14px', height: '14px' }} />
            <span>Chat Overlay</span>
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setActiveTab('gift')}
            style={{
              fontSize: '12px',
              padding: '6px 16px',
              borderRadius: '9999px',
              border: 'none',
              background: activeTab === 'gift' ? '#0085ee' : 'transparent',
              color: activeTab === 'gift' ? '#ffffff' : 'var(--text-secondary)',
              boxShadow: activeTab === 'gift' ? '0 2px 6px rgba(0, 133, 238, 0.35)' : 'none'
            }}
          >
            <SparklesIcon style={{ width: '14px', height: '14px' }} />
            <span>TikTok Gift Alert</span>
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setActiveTab('server')}
            style={{
              fontSize: '12px',
              padding: '6px 16px',
              borderRadius: '9999px',
              border: 'none',
              background: activeTab === 'server' ? '#0085ee' : 'transparent',
              color: activeTab === 'server' ? '#ffffff' : 'var(--text-secondary)',
              boxShadow: activeTab === 'server' ? '0 2px 6px rgba(0, 133, 238, 0.35)' : 'none'
            }}
          >
            <ServerIcon style={{ width: '14px', height: '14px' }} />
            <span>Server OBS</span>
          </button>
        </div>

        <form onSubmit={handleSave}>
          {/* TAB 1: CHAT OVERLAY */}
          {activeTab === 'chat' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Ukuran Font ({form.chatFontSize}px)
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="32"
                    value={form.chatFontSize}
                    onChange={(e) => handleChange('chatFontSize', Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Font Family
                  </label>
                  <select
                    className="input-field"
                    value={form.chatFontFamily}
                    onChange={(e) => handleChange('chatFontFamily', e.target.value)}
                    style={{ padding: '8px 10px' }}
                  >
                    <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans</option>
                    <option value="'Inter', sans-serif">Inter</option>
                    <option value="'Roboto', sans-serif">Roboto</option>
                    <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                    <option value="'Segoe UI', sans-serif">Segoe UI</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Warna Teks
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="color"
                      value={form.chatTextColor}
                      onChange={(e) => handleChange('chatTextColor', e.target.value)}
                      style={{ width: '40px', height: '38px', borderRadius: '8px', border: 'none', background: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="input-field"
                      value={form.chatTextColor}
                      onChange={(e) => handleChange('chatTextColor', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Warna Background Bubble
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="color"
                      value={form.chatBgColor}
                      onChange={(e) => handleChange('chatBgColor', e.target.value)}
                      style={{ width: '40px', height: '38px', borderRadius: '8px', border: 'none', background: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="input-field"
                      value={form.chatBgColor}
                      onChange={(e) => handleChange('chatBgColor', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Opacity Background ({form.chatBgOpacity}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={form.chatBgOpacity}
                  onChange={(e) => handleChange('chatBgOpacity', Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Maksimal Pesan Tampil ({form.chatMaxMessages})
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    className="input-field"
                    value={form.chatMaxMessages}
                    onChange={(e) => handleChange('chatMaxMessages', Number(e.target.value))}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Durasi Tampil (0 = permanen)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    className="input-field"
                    value={form.chatDurationSeconds}
                    onChange={(e) => handleChange('chatDurationSeconds', Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Animasi Masuk Chat
                  </label>
                  <select
                    className="input-field"
                    value={form.chatAnimation}
                    onChange={(e) => handleChange('chatAnimation', e.target.value as any)}
                  >
                    <option value="slide">Slide In (Kiri ke Kanan)</option>
                    <option value="fade">Fade In (Halus)</option>
                    <option value="pop">Pop In (Membal)</option>
                    <option value="none">Tanpa Animasi</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '22px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.chatShowAvatar}
                      onChange={(e) => handleChange('chatShowAvatar', e.target.checked)}
                      style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
                    />
                    <span>Tampilkan Foto Profil / Avatar</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.chatShowBadge}
                      onChange={(e) => handleChange('chatShowBadge', e.target.checked)}
                      style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
                    />
                    <span>Tampilkan Badge Platform (YT / TT)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TIKTOK GIFT ALERT */}
          {activeTab === 'gift' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                borderRadius: '10px',
                background: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={form.giftAnimationEnabled}
                  onChange={(e) => handleChange('giftAnimationEnabled', e.target.checked)}
                  style={{ accentColor: '#f43f5e', width: '18px', height: '18px' }}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#fca5a5' }}>Aktifkan Animasi Gift di OBS</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Menampilkan alert pop-up otomatis ketika viewer mengirim gift</div>
                </div>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Preset Animasi Gift
                  </label>
                  <select
                    className="input-field"
                    value={form.giftAnimationPreset}
                    onChange={(e) => handleChange('giftAnimationPreset', e.target.value as any)}
                  >
                    <option value="bounce">Bounce (Membal)</option>
                    <option value="pop">Pop Up (Membesar)</option>
                    <option value="slide">Slide In (Atas)</option>
                    <option value="fade">Fade In (Halus)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Durasi Tampil ({form.giftDurationSeconds}s)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    className="input-field"
                    value={form.giftDurationSeconds}
                    onChange={(e) => handleChange('giftDurationSeconds', Number(e.target.value))}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Jeda Spam ({form.giftDelaySeconds !== undefined ? form.giftDelaySeconds : 0.5}s)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="5"
                    className="input-field"
                    value={form.giftDelaySeconds !== undefined ? form.giftDelaySeconds : 0.5}
                    onChange={(e) => handleChange('giftDelaySeconds', Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.giftSoundEffect}
                    onChange={(e) => handleChange('giftSoundEffect', e.target.checked)}
                    style={{ accentColor: '#f43f5e', width: '16px', height: '16px' }}
                  />
                  <span>Efek Suara Chime Otomatis</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.giftShowUsername}
                    onChange={(e) => handleChange('giftShowUsername', e.target.checked)}
                    style={{ accentColor: '#f43f5e', width: '16px', height: '16px' }}
                  />
                  <span>Tampilkan Username Pengirim</span>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.giftShowGiftName}
                    onChange={(e) => handleChange('giftShowGiftName', e.target.checked)}
                    style={{ accentColor: '#f43f5e', width: '16px', height: '16px' }}
                  />
                  <span>Tampilkan Nama Gift (contoh: Rose)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.giftShowGiftCount}
                    onChange={(e) => handleChange('giftShowGiftCount', e.target.checked)}
                    style={{ accentColor: '#f43f5e', width: '16px', height: '16px' }}
                  />
                  <span>Tampilkan Jumlah Gift (× 5)</span>
                </label>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Batas Antrean Gift ({form.giftQueueLimit} item)
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  className="input-field"
                  value={form.giftQueueLimit}
                  onChange={(e) => handleChange('giftQueueLimit', Number(e.target.value))}
                />
              </div>

              <div style={{
                padding: '14px',
                borderRadius: '12px',
                background: 'rgba(244, 63, 94, 0.06)',
                border: '1px solid rgba(244, 63, 94, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginTop: '6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#f43f5e' }}>
                    EulerStream Free API Key (Bebas Rate Limit)
                  </label>
                  <a
                    href="https://www.eulerstream.com/pricing"
                    target="_blank"
                    style={{ fontSize: '11px', color: '#00f2fe', textDecoration: 'underline', cursor: 'pointer' }}
                    onClick={(e) => {
                      e.preventDefault();
                      if ((window as any).electronAPI?.openExternal) {
                        (window as any).electronAPI.openExternal('https://www.eulerstream.com/pricing');
                      } else {
                        window.open('https://www.eulerstream.com/pricing', '_blank');
                      }
                    }}
                  >
                    Dapatkan Key Gratis ↗
                  </a>
                </div>
                <input
                  type="text"
                  placeholder="Opsional - Masukkan API Key dari eulerstream.com"
                  className="input-field"
                  value={form.tiktokApiKey || ''}
                  onChange={(e) => handleChange('tiktokApiKey', e.target.value)}
                  style={{ fontSize: '12px' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                  Jika sering terkena rate limit, gunakan API Key gratis dari EulerStream agar tidak ada batasan kuota koneksi per menit.
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: SERVER OBS */}
          {activeTab === 'server' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Port Server Lokal Overlay
                </label>
                <input
                  type="number"
                  min="1024"
                  max="65535"
                  className="input-field"
                  value={form.overlayPort}
                  onChange={(e) => handleChange('overlayPort', Number(e.target.value))}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '4px', display: 'block' }}>
                  Default: 3210. Ubah jika port ini digunakan oleh aplikasi lain.
                </span>
              </div>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={form.autoConnect}
                  onChange={(e) => handleChange('autoConnect', e.target.checked)}
                  style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>Otomatis Terhubung Saat Aplikasi Dibuka</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Menghubungkan kembali target YouTube dan TikTok terakhir secara otomatis
                  </div>
                </div>
              </label>
            </div>
          )}

          {/* Footer Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '24px',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '16px'
          }}>
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-secondary"
              style={{ fontSize: '12px' }}
            >
              <ArrowPathIcon style={{ width: '14px', height: '14px' }} />
              <span>Reset Default</span>
            </button>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {isSavedAlert && (
                <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 600 }}>
                  ✓ Pengaturan disimpan & disinkronkan ke OBS!
                </span>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ minWidth: '130px' }}
              >
                <CheckIcon style={{ width: '15px', height: '15px' }} />
                <span>Simpan</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
