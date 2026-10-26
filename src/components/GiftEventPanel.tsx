import React, { useState } from 'react';
import {
  SparklesIcon,
  TrashIcon,
  GiftIcon,
  ArrowPathIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { GiftEvent } from '../types';

interface GiftEventPanelProps {
  gifts: GiftEvent[];
  onClearGifts: () => void;
  onSendTestGift: () => void;
  onReplayGift?: (gift: GiftEvent) => void;
}

export const GiftEventPanel: React.FC<GiftEventPanelProps> = ({
  gifts,
  onClearGifts,
  onSendTestGift,
  onReplayGift,
}) => {
  const [replayingId, setReplayingId] = useState<string | null>(null);

  const handleReplay = (gift: GiftEvent) => {
    if (!onReplayGift) return;
    setReplayingId(gift.id);
    onReplayGift(gift);
    setTimeout(() => setReplayingId(null), 1500);
  };

  const getGiftEmoji = (name: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('rose') || n.includes('mawar')) return '🌹';
    if (n.includes('heart') || n.includes('love') || n.includes('hati')) return '💖';
    if (n.includes('diamond') || n.includes('berlian')) return '💎';
    if (n.includes('fire') || n.includes('api')) return '🔥';
    if (n.includes('crown') || n.includes('mahkota')) return '👑';
    if (n.includes('car') || n.includes('mobil') || n.includes('ferrari')) return '🏎️';
    if (n.includes('whale') || n.includes('paus')) return '🐳';
    if (n.includes('lion') || n.includes('singa')) return '🦁';
    if (n.includes('coffee') || n.includes('kopi')) return '☕';
    if (n.includes('donut') || n.includes('donat')) return '🍩';
    if (n.includes('star') || n.includes('bintang')) return '⭐';
    if (n.includes('rocket') || n.includes('roket')) return '🚀';
    return '🎁';
  };

  return (
    <div className="glass-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: '480px',
      overflow: 'hidden',
      borderRadius: '20px',
      background: '#ffffff',
      boxShadow: '0 8px 30px -8px rgba(0, 133, 238, 0.08), 0 1px 3px rgba(0,0,0,0.03)'
    }}>
      {/* Header */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: '#ffe4e6',
            border: '1px solid #fecdd3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <SparklesIcon style={{ width: '16px', height: '16px', color: '#f43f5e' }} />
          </div>
          <h2 style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.02em', color: '#0f172a' }}>TikTok Gifts</h2>
          <span className="badge-pill" style={{
            background: '#ffe4e6',
            color: '#e11d48',
            borderColor: '#fecdd3',
            fontSize: '11px',
            padding: '2px 10px'
          }}>
            {gifts.length} event
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onClearGifts}
            className="btn btn-secondary"
            style={{ padding: '6px 10px', fontSize: '11px' }}
            title="Hapus riwayat gift"
          >
            <TrashIcon style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
      </div>

      {/* Gift List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        background: '#f8fafd'
      }}>
        {gifts.length === 0 ? (
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
            <GiftIcon style={{ width: '36px', height: '36px', opacity: 0.3, color: '#f43f5e' }} />
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>Belum ada gift yang diterima</p>
            <p style={{ fontSize: '12px', maxWidth: '280px', color: 'var(--text-muted)' }}>
              Gift yang dikirim penonton TikTok LIVE akan muncul di sini dan memicu animasi stiker asli di OBS overlay.
            </p>
          </div>
        ) : (
          gifts.map((gift) => {
            const timeStr = new Date(gift.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const emoji = getGiftEmoji(gift.giftName);
            const avatarUrl = gift.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(gift.username)}`;
            const isReplaying = replayingId === gift.id;

            return (
              <div
                key={gift.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '16px',
                  background: '#ffffff',
                  border: '1px solid #fecdd3',
                  boxShadow: '0 2px 8px rgba(244, 63, 94, 0.08)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  animation: 'fadeInModal 0.25s ease-out'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#fda4af';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(244, 63, 94, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#fecdd3';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(244, 63, 94, 0.08)';
                }}
              >
                {/* User avatar */}
                <img
                  src={avatarUrl}
                  alt={gift.username}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1.5px solid #fda4af',
                    background: '#ffe4e6',
                    boxShadow: '0 2px 6px rgba(244, 63, 94, 0.2)'
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(gift.username)}`;
                  }}
                />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      letterSpacing: '-0.01em',
                      color: '#0f172a',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {gift.displayName || gift.username}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      color: 'var(--text-faint)',
                      marginLeft: 'auto',
                      fontFamily: 'JetBrains Mono, monospace'
                    }}>
                      {timeStr}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '4px'
                  }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      mengirim <strong style={{ color: '#e11d48' }}>{gift.giftName}</strong>
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 900,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                      color: '#ffffff',
                      boxShadow: '0 2px 6px rgba(244, 63, 94, 0.35)'
                    }}>
                      × {gift.giftCount}
                    </span>
                  </div>
                </div>

                {/* Gift Sticker Image or Emoji */}
                <div style={{
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {gift.giftPictureUrl ? (
                    <img
                      src={gift.giftPictureUrl}
                      alt={gift.giftName}
                      style={{
                        width: '36px',
                        height: '36px',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))'
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '24px' }}>{emoji}</span>
                  )}
                </div>

                {/* Replay Button for OBS test */}
                {onReplayGift && (
                  <button
                    onClick={() => handleReplay(gift)}
                    title="Putar ulang animasi di OBS overlay"
                    style={{
                      background: isReplaying ? '#d1fae5' : '#f1f5f9',
                      border: `1px solid ${isReplaying ? '#6ee7b7' : '#e2e8f0'}`,
                      color: isReplaying ? '#059669' : '#64748b',
                      padding: '7px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      flexShrink: 0
                    }}
                  >
                    {isReplaying ? <CheckIcon style={{ width: '14px', height: '14px' }} /> : <ArrowPathIcon style={{ width: '14px', height: '14px' }} />}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
