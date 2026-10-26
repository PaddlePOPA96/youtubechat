import React from 'react';
import {
  ChatBubbleLeftRightIcon,
  Squares2X2Icon,
  ChatBubbleBottomCenterTextIcon,
  ArrowTopRightOnSquareIcon,
  Cog6ToothIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';
import { ChatBubbleLeftRightIcon as ChatBubbleSolidIcon } from '@heroicons/react/24/solid';
import { ConnectionStatus } from '../types';

interface HeaderProps {
  ytStatus: ConnectionStatus;
  ttStatus: ConnectionStatus;
  onOpenSettings: () => void;
  onOpenOverlayLinks: () => void;
  onToggleLogs: () => void;
  isLogsOpen: boolean;
  unreadLogsCount: number;
  isChatOnly: boolean;
  onToggleChatOnly: () => void;
  isPinned: boolean;
  onTogglePin: () => void;
}

// Pushpin Icon component
const PinIcon: React.FC<{ pinned?: boolean; style?: React.CSSProperties }> = ({ pinned, style }) => (
  <svg
    viewBox="0 0 24 24"
    fill={pinned ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={pinned ? '1.5' : '2'}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      ...style,
      transform: pinned ? 'rotate(-25deg)' : 'none',
      transition: 'transform 0.2s ease'
    }}
  >
    <path d="M12 17v5" />
    <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V5a1 1 0 0 1 1-1h1a1 1 0 0 0 0-2H7a1 1 0 0 0 0 2h1a1 1 0 0 1 1 1v5.76z" />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({
  ytStatus,
  ttStatus,
  onOpenSettings,
  onOpenOverlayLinks,
  onToggleLogs,
  isLogsOpen,
  unreadLogsCount,
  isChatOnly,
  onToggleChatOnly,
  isPinned,
  onTogglePin,
}) => {
  return (
    <header className="glass-panel" style={{
      padding: isChatOnly ? '8px 14px' : '14px 24px',
      margin: isChatOnly ? '8px 12px 0 12px' : '16px 20px 0 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '10px',
      flexWrap: 'wrap',
      borderRadius: isChatOnly ? '14px' : '20px',
      position: 'relative',
      zIndex: 10,
      background: 'rgba(255, 255, 255, 0.95)',
      boxShadow: '0 8px 30px -8px rgba(0, 133, 238, 0.12), 0 1px 3px rgba(0,0,0,0.04)',
      transition: 'all 0.2s ease'
    }}>
      {/* Brand & Connection Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: isChatOnly ? '30px' : '38px',
          height: isChatOnly ? '30px' : '38px',
          borderRadius: isChatOnly ? '8px' : '12px',
          background: 'linear-gradient(135deg, #0085ee 0%, #0066cc 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0, 133, 238, 0.35)',
          flexShrink: 0
        }}>
          {/* Message App Icon */}
          <ChatBubbleSolidIcon style={{ width: isChatOnly ? '16px' : '20px', height: isChatOnly ? '16px' : '20px', color: '#ffffff' }} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{
              fontSize: isChatOnly ? '15px' : '18px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#0f172a',
              margin: 0
            }}>
              StreamChat
            </h1>

            {/* Quick Status Chips in Chat-Only Mode */}
            {isChatOnly ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className={`badge-status ${ytStatus}`} style={{ padding: '2px 7px', fontSize: '9px' }}>
                  <span className={`status-dot ${ytStatus === 'connecting' ? 'pulse' : ''}`} style={{ width: '5px', height: '5px' }} />
                  YT
                </span>
                <span className={`badge-status ${ttStatus}`} style={{ padding: '2px 7px', fontSize: '9px' }}>
                  <span className={`status-dot ${ttStatus === 'connecting' ? 'pulse' : ''}`} style={{ width: '5px', height: '5px' }} />
                  TT
                </span>
              </div>
            ) : (
              <span className="badge-pill" style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
                background: '#e0f2fe',
                color: '#0284c7',
                borderColor: '#bae6fd'
              }}>
                v1.0 • Glow Blue
              </span>
            )}
          </div>

          {!isChatOnly && (
            <p style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              fontWeight: 500,
              marginTop: '2px',
              letterSpacing: '-0.01em'
            }}>
              Unified Multi-Platform Live Chat & TikTok Gifts for OBS Studio
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Toggle Mode: Hanya Chat vs Mode Lengkap */}
        <button
          className={isChatOnly ? 'btn btn-primary' : 'btn btn-secondary'}
          onClick={onToggleChatOnly}
          title={isChatOnly ? 'Kembali ke mode lengkap (Connection & Gifts)' : 'Tampilkan hanya chat saja'}
          style={{ padding: '6px 14px', fontSize: '12px' }}
        >
          {isChatOnly ? (
            <>
              <Squares2X2Icon style={{ width: '15px', height: '15px' }} />
              <span>Mode Lengkap</span>
            </>
          ) : (
            <>
              <ChatBubbleBottomCenterTextIcon style={{ width: '15px', height: '15px', color: '#0085ee' }} />
              <span>Hanya Chat</span>
            </>
          )}
        </button>

        {/* Pin on Top Toggle Button */}
        <button
          className={isPinned ? 'btn btn-primary' : 'btn btn-secondary'}
          onClick={onTogglePin}
          title={isPinned ? 'Pin on Top Aktif: Jendela selalu di atas aplikasi lain (Klik untuk lepas)' : 'Pin on Top Nonaktif: Klik agar jendela selalu melayang di atas game/OBS/aplikasi lain'}
          style={{
            padding: isChatOnly ? '6px 10px' : '6px 12px',
            fontSize: '12px',
            background: isPinned ? 'linear-gradient(135deg, #0085ee 0%, #0066cc 100%)' : undefined,
            color: isPinned ? '#ffffff' : undefined,
            boxShadow: isPinned ? '0 2px 10px rgba(0, 133, 238, 0.35)' : undefined,
            borderColor: isPinned ? '#0085ee' : undefined
          }}
        >
          <PinIcon pinned={isPinned} style={{ width: '15px', height: '15px', color: isPinned ? '#ffffff' : '#64748b' }} />
          <span>{isPinned ? 'Pinned' : 'Pin'}</span>
        </button>

        {/* OBS Overlays (Only in normal mode) */}
        {!isChatOnly && (
          <button
            className="btn btn-secondary"
            onClick={onOpenOverlayLinks}
            style={{ padding: '6px 12px', fontSize: '12px' }}
            title="Buka link Browser Source untuk OBS Studio"
          >
            <ArrowTopRightOnSquareIcon style={{ width: '15px', height: '15px' }} />
            <span>OBS Links</span>
          </button>
        )}

        {/* Settings Button */}
        <button
          className="btn btn-secondary"
          onClick={onOpenSettings}
          title="Pengaturan Chat, Gift, dan OBS"
          style={{ padding: '6px 10px' }}
        >
          <Cog6ToothIcon style={{ width: '16px', height: '16px' }} />
        </button>

        {/* Logs Toggle Button (Only in normal mode) */}
        {!isChatOnly && (
          <button
            className={`btn ${isLogsOpen ? 'btn-primary' : 'btn-secondary'}`}
            onClick={onToggleLogs}
            title="Console & Koneksi Log"
            style={{ padding: '6px 10px', position: 'relative' }}
          >
            <CommandLineIcon style={{ width: '15px', height: '15px' }} />
            {unreadLogsCount > 0 && !isLogsOpen && (
              <span style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                background: '#ef4444',
                color: '#ffffff',
                borderRadius: '9999px',
                fontSize: '9px',
                fontWeight: 800,
                padding: '1px 4px',
                minWidth: '14px',
                textAlign: 'center',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
              }}>
                {unreadLogsCount > 99 ? '99+' : unreadLogsCount}
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
