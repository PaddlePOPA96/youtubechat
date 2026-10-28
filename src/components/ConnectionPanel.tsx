import React, { useState, useEffect } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { PlayIcon, StopIcon } from '@heroicons/react/24/solid';
import { ConnectionStatus } from '../types';

const YouTubeIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

interface ConnectionPanelProps {
  ytStatus: ConnectionStatus;
  ytError?: string;
  ytTarget: string;
  onConnectYouTube: (target: string) => void;
  onDisconnectYouTube: () => void;

  ttStatus: ConnectionStatus;
  ttError?: string;
  ttUsername: string;
  onConnectTikTok: (username: string) => void;
  onDisconnectTikTok: () => void;
}

export const ConnectionPanel: React.FC<ConnectionPanelProps> = ({
  ytStatus,
  ytError,
  ytTarget,
  onConnectYouTube,
  onDisconnectYouTube,
  ttStatus,
  ttError,
  ttUsername,
  onConnectTikTok,
  onDisconnectTikTok,
}) => {
  const [ytInput, setYtInput] = useState(() => ytTarget || (typeof window !== 'undefined' ? localStorage.getItem('streamchat_yt_target') || '' : ''));
  const [ttInput, setTtInput] = useState(() => ttUsername || (typeof window !== 'undefined' ? localStorage.getItem('streamchat_tt_username') || '' : ''));
  const [ytSavedNotice, setYtSavedNotice] = useState(false);
  const [ttSavedNotice, setTtSavedNotice] = useState(false);

  useEffect(() => {
    if (ytTarget) {
      setYtInput(ytTarget);
      if (typeof window !== 'undefined') localStorage.setItem('streamchat_yt_target', ytTarget);
    }
  }, [ytTarget]);

  useEffect(() => {
    if (ttUsername) {
      setTtInput(ttUsername);
      if (typeof window !== 'undefined') localStorage.setItem('streamchat_tt_username', ttUsername);
    }
  }, [ttUsername]);

  const saveYtTarget = (target: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('streamchat_yt_target', target);
      try {
        (window as any).electronAPI?.saveSettings({ youtubeTarget: target });
      } catch {}
    }
    setYtSavedNotice(true);
    setTimeout(() => setYtSavedNotice(false), 2000);
  };

  const saveTtUsername = (username: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('streamchat_tt_username', username);
      try {
        (window as any).electronAPI?.saveSettings({ tiktokUsername: username });
      } catch {}
    }
    setTtSavedNotice(true);
    setTimeout(() => setTtSavedNotice(false), 2000);
  };

  const handleYtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveYtTarget(ytInput);
    if (ytStatus === 'connected' || ytStatus === 'connecting' || ytStatus === 'reconnecting') {
      onDisconnectYouTube();
    } else {
      onConnectYouTube(ytInput);
    }
  };

  const handleTtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveTtUsername(ttInput);
    if (ttStatus === 'connected' || ttStatus === 'connecting' || ttStatus === 'reconnecting') {
      onDisconnectTikTok();
    } else {
      onConnectTikTok(ttInput);
    }
  };

  const renderStatusBadge = (status: ConnectionStatus) => {
    if (status === 'connected') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: '#dcfce7',
          color: '#15803d',
          border: '1px solid #86efac',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: 800,
          boxShadow: '0 2px 6px rgba(34, 197, 94, 0.2)'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#22c55e',
            boxShadow: '0 0 8px #22c55e',
            animation: 'pulse 1.5s infinite ease-in-out'
          }} />
          LIVE CONNECTED
        </span>
      );
    }
    if (status === 'connecting' || status === 'reconnecting') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: '#fef3c7',
          color: '#b45309',
          border: '1px solid #fde68a',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: 700
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#f59e0b',
            animation: 'pulse 1s infinite ease-in-out'
          }} />
          {status === 'reconnecting' ? 'MENYAMBUNG ULANG...' : 'MENGHUBUNGKAN...'}
        </span>
      );
    }
    if (status === 'error') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: '#fee2e2',
          color: '#b91c1c',
          border: '1px solid #fca5a5',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: 700
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
          ERROR / OFFLINE
        </span>
      );
    }
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: '#f1f5f9',
        color: '#64748b',
        border: '1px solid #e2e8f0',
        padding: '4px 10px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 600
      }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }} />
        BELUM TERKONEKSI
      </span>
    );
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
      gap: '16px',
      margin: '16px 20px 0 20px'
    }}>
      {/* YOUTUBE CONNECTION CARD */}
      <div className="glass-panel" style={{
        padding: '22px',
        borderRadius: '20px',
        position: 'relative',
        overflow: 'hidden',
        background: ytStatus === 'connected' ? 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)' : '#ffffff',
        border: ytStatus === 'connected' ? '1px solid #86efac' : '1px solid rgba(0,0,0,0.06)',
        boxShadow: ytStatus === 'connected'
          ? '0 8px 25px -8px rgba(34, 197, 94, 0.25), 0 1px 3px rgba(0,0,0,0.03)'
          : '0 8px 25px -8px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0,0,0,0.03)',
        transition: 'all 0.3s ease'
      }}>
        {/* Subtle Top Red Accent Line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: ytStatus === 'connected' ? 'linear-gradient(90deg, #22c55e, #16a34a)' : 'linear-gradient(90deg, #ff2a2a, #dc2626)'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: ytStatus === 'connected' ? '#dcfce7' : '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: ytStatus === 'connected' ? '#16a34a' : '#dc2626',
              border: ytStatus === 'connected' ? '1px solid #bbf7d0' : '1px solid #fecaca'
            }}>
              <YouTubeIcon size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a' }}>YouTube Live</h2>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Live chat sync & superchats</span>
            </div>
          </div>
          {renderStatusBadge(ytStatus)}
        </div>

        {/* Prominent Live Connected Banner */}
        {ytStatus === 'connected' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '14px',
            padding: '8px 12px',
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '10px',
            color: '#15803d',
            fontSize: '12px',
            fontWeight: 600
          }}>
            <span>⚡ <strong>Live Stream Aktif</strong> — Pesan chat YouTube disinkronkan ke overlay</span>
          </div>
        )}

        <form onSubmit={handleYtSubmit} style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="input-field"
              placeholder="URL Live / Video ID (otomatis tersimpan)"
              value={ytInput}
              onChange={(e) => {
                setYtInput(e.target.value);
                saveYtTarget(e.target.value);
              }}
              onBlur={() => saveYtTarget(ytInput)}
              disabled={ytStatus === 'connected' || ytStatus === 'connecting'}
              style={{ borderRadius: '12px', width: '100%', paddingRight: '80px' }}
            />
            {ytSavedNotice && (
              <span style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '11px',
                fontWeight: 600,
                color: '#16a34a',
                background: '#dcfce7',
                padding: '2px 6px',
                borderRadius: '6px',
                pointerEvents: 'none'
              }}>
                💾 Tersimpan
              </span>
            )}
          </div>

          {ytStatus === 'connected' || ytStatus === 'connecting' || ytStatus === 'reconnecting' ? (
            <button type="submit" className="btn btn-danger" style={{ minWidth: '110px' }}>
              <StopIcon style={{ width: '15px', height: '15px' }} />
              <span>Putus</span>
            </button>
          ) : (
            <button
              type="submit"
              className="btn btn-yt"
              style={{ minWidth: '120px' }}
              disabled={!ytInput.trim()}
            >
              <PlayIcon style={{ width: '15px', height: '15px' }} />
              <span>Hubungkan</span>
            </button>
          )}
        </form>

        {ytError && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            marginTop: '12px',
            padding: '10px 14px',
            borderRadius: '10px',
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#b91c1c',
            fontSize: '12px'
          }}>
            <ExclamationCircleIcon style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '2px' }} />
            <span>{ytError}</span>
          </div>
        )}
      </div>

      {/* TIKTOK CONNECTION CARD */}
      <div className="glass-panel" style={{
        padding: '22px',
        borderRadius: '20px',
        position: 'relative',
        overflow: 'hidden',
        background: ttStatus === 'connected' ? 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)' : '#ffffff',
        border: ttStatus === 'connected' ? '1px solid #86efac' : '1px solid rgba(0,0,0,0.06)',
        boxShadow: ttStatus === 'connected'
          ? '0 8px 25px -8px rgba(34, 197, 94, 0.25), 0 1px 3px rgba(0,0,0,0.03)'
          : '0 8px 25px -8px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0,0,0,0.03)',
        transition: 'all 0.3s ease'
      }}>
        {/* Subtle Top Cyan/Pink Accent Line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: ttStatus === 'connected' ? 'linear-gradient(90deg, #22c55e, #16a34a)' : 'linear-gradient(90deg, #00d2ff, #fe2c55)'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: ttStatus === 'connected' ? '#dcfce7' : '#e0f2fe',
              border: ttStatus === 'connected' ? '1px solid #bbf7d0' : '1px solid #bae6fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: ttStatus === 'connected' ? '#16a34a' : '#0284c7'
            }}>
              <span style={{ fontWeight: 900, fontSize: '14px', letterSpacing: '0.5px' }}>TT</span>
            </div>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a' }}>TikTok LIVE</h2>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Real-time chat & native sticker gifts</span>
            </div>
          </div>
          {renderStatusBadge(ttStatus)}
        </div>

        {/* Prominent Live Connected Banner */}
        {ttStatus === 'connected' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '14px',
            padding: '8px 12px',
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '10px',
            color: '#15803d',
            fontSize: '12px',
            fontWeight: 600
          }}>
            <span>⚡ <strong>Live TikTok @{ttUsername} Aktif</strong> — Chat & gift stiker disinkronkan ke overlay</span>
          </div>
        )}

        <form onSubmit={handleTtSubmit} style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="input-field"
              placeholder="Username TikTok kreator (otomatis tersimpan)"
              value={ttInput}
              onChange={(e) => {
                setTtInput(e.target.value);
                saveTtUsername(e.target.value);
              }}
              onBlur={() => saveTtUsername(ttInput)}
              disabled={ttStatus === 'connected' || ttStatus === 'connecting'}
              style={{ borderRadius: '12px', width: '100%', paddingRight: '80px' }}
            />
            {ttSavedNotice && (
              <span style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '11px',
                fontWeight: 600,
                color: '#16a34a',
                background: '#dcfce7',
                padding: '2px 6px',
                borderRadius: '6px',
                pointerEvents: 'none'
              }}>
                💾 Tersimpan
              </span>
            )}
          </div>

          {ttStatus === 'connected' || ttStatus === 'connecting' || ttStatus === 'reconnecting' ? (
            <button type="submit" className="btn btn-danger" style={{ minWidth: '110px' }}>
              <StopIcon style={{ width: '15px', height: '15px' }} />
              <span>Putus</span>
            </button>
          ) : (
            <button
              type="submit"
              className="btn btn-tt"
              style={{ minWidth: '120px' }}
              disabled={!ttInput.trim()}
            >
              <PlayIcon style={{ width: '15px', height: '15px' }} />
              <span>Hubungkan</span>
            </button>
          )}
        </form>

        {ttError && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            marginTop: '12px',
            padding: '10px 14px',
            borderRadius: '10px',
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#b91c1c',
            fontSize: '12px'
          }}>
            <ExclamationCircleIcon style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '2px' }} />
            <span>{ttError}</span>
          </div>
        )}
      </div>
    </div>
  );
};
