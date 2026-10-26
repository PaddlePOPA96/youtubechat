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
  const [ytInput, setYtInput] = useState(ytTarget);
  const [ttInput, setTtInput] = useState(ttUsername);

  useEffect(() => {
    if (ytTarget) setYtInput(ytTarget);
  }, [ytTarget]);

  useEffect(() => {
    if (ttUsername) setTtInput(ttUsername);
  }, [ttUsername]);

  const handleYtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ytStatus === 'connected' || ytStatus === 'connecting' || ytStatus === 'reconnecting') {
      onDisconnectYouTube();
    } else {
      onConnectYouTube(ytInput);
    }
  };

  const handleTtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ttStatus === 'connected' || ttStatus === 'connecting' || ttStatus === 'reconnecting') {
      onDisconnectTikTok();
    } else {
      onConnectTikTok(ttInput);
    }
  };

  const renderStatusBadge = (status: ConnectionStatus) => {
    const isPulse = status === 'connecting' || status === 'reconnecting';
    return (
      <span className={`badge-status ${status}`}>
        <span className={`status-dot ${isPulse ? 'pulse' : ''}`} />
        {status}
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
        background: '#ffffff',
        boxShadow: '0 8px 25px -8px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {/* Subtle Top Red Accent Line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #ff2a2a, #dc2626)'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#dc2626',
              border: '1px solid #fecaca'
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

        <form onSubmit={handleYtSubmit} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="URL Live atau ID Video (contoh: https://youtube.com/watch?v=...)"
            value={ytInput}
            onChange={(e) => setYtInput(e.target.value)}
            disabled={ytStatus === 'connected' || ytStatus === 'connecting'}
            style={{ borderRadius: '12px' }}
          />
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
        background: '#ffffff',
        boxShadow: '0 8px 25px -8px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {/* Subtle Top Cyan/Pink Accent Line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #00d2ff, #fe2c55)'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: '#e0f2fe',
              border: '1px solid #bae6fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7'
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

        <form onSubmit={handleTtSubmit} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Username TikTok kreator (contoh: @username)"
            value={ttInput}
            onChange={(e) => setTtInput(e.target.value)}
            disabled={ttStatus === 'connected' || ttStatus === 'connecting'}
            style={{ borderRadius: '12px' }}
          />
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
