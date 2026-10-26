import React from 'react';
import { ChatMessage } from '../types';

interface ChatMessageItemProps {
  message: ChatMessage;
  showAvatar: boolean;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = React.memo(({ message, showAvatar }) => {
  const isYT = message.platform === 'youtube';
  const timeStr = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const fallbackAvatar = isYT
    ? `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(message.username)}`
    : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(message.username)}`;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '10px 14px',
      borderRadius: '14px',
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      wordBreak: 'break-word',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = '#ffffff';
      e.currentTarget.style.borderColor = '#cbd5e1';
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 133, 238, 0.08)';
      e.currentTarget.style.transform = 'translateX(2px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = '#ffffff';
      e.currentTarget.style.borderColor = '#e2e8f0';
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.03)';
      e.currentTarget.style.transform = 'translateX(0)';
    }}
    >
      {showAvatar && (
        <img
          src={message.avatar || fallbackAvatar}
          alt={message.displayName || message.username}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            objectFit: 'cover',
            flexShrink: 0,
            background: '#f1f5f9',
            border: `1.5px solid ${isYT ? '#fca5a5' : '#bae6fd'}`,
            boxShadow: `0 1px 4px ${isYT ? 'rgba(255, 42, 42, 0.2)' : 'rgba(0, 133, 238, 0.2)'}`
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallbackAvatar;
          }}
        />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header line: platform badge, role badges, username, timestamp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
          {/* Platform badge */}
          {isYT ? (
            <span style={{
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '9999px',
              background: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              letterSpacing: '0.04em'
            }}>
              YT
            </span>
          ) : (
            <span style={{
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '9999px',
              background: '#e0f2fe',
              color: '#0284c7',
              border: '1px solid #bae6fd',
              letterSpacing: '0.04em'
            }}>
              TT
            </span>
          )}

          {/* Author role badges */}
          {message.badges?.map((badge, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '9px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '9999px',
                background: '#fef3c7',
                color: '#b45309',
                border: '1px solid #fde68a'
              }}
            >
              {badge}
            </span>
          ))}

          {/* Username */}
          <span style={{
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: isYT ? '#dc2626' : '#0085ee',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {message.displayName || message.username}
          </span>

          {/* Time */}
          <span style={{
            fontSize: '11px',
            color: 'var(--text-faint)',
            marginLeft: 'auto',
            fontFamily: 'JetBrains Mono, monospace'
          }}>
            {timeStr}
          </span>
        </div>

        {/* Message Content */}
        <div style={{
          fontSize: '13.5px',
          fontWeight: 400,
          lineHeight: '1.45',
          color: '#1e293b',
          letterSpacing: '-0.01em'
        }}>
          {message.message}
        </div>
      </div>
    </div>
  );
});
