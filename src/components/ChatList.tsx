import React, { useState, useRef, useEffect } from 'react';
import {
  ChatBubbleLeftEllipsisIcon,
  ArrowDownIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { ChatMessage, Platform } from '../types';
import { ChatMessageItem } from './ChatMessageItem';

interface ChatListProps {
  messages: ChatMessage[];
  onClearChat: () => void;
  showAvatar: boolean;
  onToggleAvatar: () => void;
  isChatOnly?: boolean;
}

export const ChatList: React.FC<ChatListProps> = ({
  messages,
  onClearChat,
  showAvatar,
  onToggleAvatar,
  isChatOnly = false,
}) => {
  const [platformFilter, setPlatformFilter] = useState<'all' | Platform>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter messages (in chatOnly mode, show all messages without filtering)
  const filteredMessages = messages.filter((msg) => {
    if (!isChatOnly && platformFilter !== 'all' && msg.platform !== platformFilter) {
      return false;
    }
    if (!isChatOnly && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = msg.message.toLowerCase().includes(q);
      const matchUser = (msg.displayName || msg.username).toLowerCase().includes(q);
      return matchText || matchUser;
    }
    return true;
  });

  // Handle auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  // Detect when user scrolls manually
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - (scrollTop + clientHeight) < 50;
    if (autoScroll !== isAtBottom) {
      setAutoScroll(isAtBottom);
    }
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      setAutoScroll(true);
    }
  };

  return (
    <div className="glass-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: isChatOnly ? '200px' : '480px',
      overflow: 'hidden',
      borderRadius: isChatOnly ? '16px' : '20px',
      background: '#ffffff',
      boxShadow: '0 8px 30px -8px rgba(0, 133, 238, 0.08), 0 1px 3px rgba(0,0,0,0.03)'
    }}>
      {/* Header Bar - Hidden in Chat-Only mode */}
      {!isChatOnly && (
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
          background: '#ffffff'
        }}>
          {/* Title & Count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: '#e0f2fe',
              border: '1px solid #bae6fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ChatBubbleLeftEllipsisIcon style={{ width: '16px', height: '16px', color: '#0085ee' }} />
            </div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a' }}>Unified Chat</h2>
            <span className="badge-pill" style={{
              background: '#e0f2fe',
              color: '#0284c7',
              borderColor: '#bae6fd',
              fontSize: '11px',
              padding: '2px 10px'
            }}>
              {filteredMessages.length} pesan
            </span>
          </div>

          {/* Filter Tabs (Segmented Pill) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f1f5f9',
            padding: '3px',
            borderRadius: '9999px',
            border: '1px solid #e2e8f0'
          }}>
            <button
              onClick={() => setPlatformFilter('all')}
              style={{
                padding: '4px 14px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: platformFilter === 'all' ? '#0085ee' : 'transparent',
                color: platformFilter === 'all' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: platformFilter === 'all' ? '0 2px 6px rgba(0, 133, 238, 0.35)' : 'none'
              }}
            >
              Semua
            </button>
            <button
              onClick={() => setPlatformFilter('youtube')}
              style={{
                padding: '4px 14px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: platformFilter === 'youtube' ? '#ff2a2a' : 'transparent',
                color: platformFilter === 'youtube' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: platformFilter === 'youtube' ? '0 2px 6px rgba(255, 42, 42, 0.35)' : 'none'
              }}
            >
              YouTube
            </button>
            <button
              onClick={() => setPlatformFilter('tiktok')}
              style={{
                padding: '4px 14px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: platformFilter === 'tiktok' ? '#fe2c55' : 'transparent',
                color: platformFilter === 'tiktok' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: platformFilter === 'tiktok' ? '0 2px 6px rgba(254, 44, 85, 0.35)' : 'none'
              }}
            >
              TikTok
            </button>
          </div>

          {/* Controls: Search, Avatar Toggle, Clear */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: '1 1 auto', justifyContent: 'flex-end' }}>
            {/* Search box */}
            <div style={{ position: 'relative', minWidth: '100px', flex: '1 1 120px', maxWidth: '180px' }}>
              <MagnifyingGlassIcon style={{ width: '14px', height: '14px', position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
              <input
                type="text"
                placeholder="Cari chat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field"
                style={{
                  paddingLeft: '28px',
                  paddingTop: '6px',
                  paddingBottom: '6px',
                  fontSize: '12px',
                  borderRadius: '9999px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  width: '100%'
                }}
              />
            </div>

            <button
              onClick={onToggleAvatar}
              className="btn btn-secondary"
              style={{ padding: '6px 10px', fontSize: '11px' }}
              title={showAvatar ? 'Sembunyikan Avatar' : 'Tampilkan Avatar'}
            >
              {showAvatar ? <EyeIcon style={{ width: '14px', height: '14px' }} /> : <EyeSlashIcon style={{ width: '14px', height: '14px' }} />}
            </button>

            <button
              onClick={onClearChat}
              className="btn btn-secondary"
              style={{ padding: '6px 10px', fontSize: '11px' }}
              title="Bersihkan riwayat chat"
            >
              <TrashIcon style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        </div>
      )}

      {/* Chat Messages List */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          background: '#f8fafd'
        }}
      >
        {filteredMessages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-faint)',
            gap: '10px',
            textAlign: 'center',
            padding: '40px 20px'
          }}>
            <ChatBubbleLeftEllipsisIcon style={{ width: '36px', height: '36px', opacity: 0.3, color: '#0085ee' }} />
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Menunggu pesan chat masuk...</p>
            <p style={{ fontSize: '12px', maxWidth: '320px', color: 'var(--text-muted)' }}>
              Pesan dari YouTube Live dan TikTok LIVE akan langsung terkumpul di sini secara otomatis.
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <ChatMessageItem
              key={msg.id}
              message={msg}
              showAvatar={showAvatar}
            />
          ))
        )}
      </div>

      {/* Floating Scroll to Bottom pill */}
      {!autoScroll && (
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10
        }}>
          <button
            onClick={scrollToBottom}
            className="btn btn-primary"
            style={{
              padding: '6px 16px',
              fontSize: '11px',
              boxShadow: '0 4px 16px rgba(0, 133, 238, 0.4)'
            }}
          >
            <ArrowDownIcon style={{ width: '13px', height: '13px' }} />
            <span>Pesan Baru di Bawah</span>
          </button>
        </div>
      )}
    </div>
  );
};
