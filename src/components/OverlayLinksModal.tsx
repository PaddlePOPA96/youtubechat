import React, { useState } from 'react';
import {
  XMarkIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  ArrowTopRightOnSquareIcon,
  TvIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  Square3Stack3DIcon
} from '@heroicons/react/24/outline';

interface OverlayLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  overlayPort: number;
  customBackendUrl?: string;
}

export const OverlayLinksModal: React.FC<OverlayLinksModalProps> = ({
  isOpen,
  onClose,
  overlayPort,
  customBackendUrl,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const currentOrigin =
    typeof window !== 'undefined' && window.location.origin && !window.location.origin.startsWith('file://')
      ? window.location.origin
      : `http://127.0.0.1:${overlayPort}`;

  const isLocalHost =
    typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // In local desktop, default to local port. On web/Vercel/Codespaces, default to current domain!
  const [useCurrentDomain, setUseCurrentDomain] = useState<boolean>(!isLocalHost);

  if (!isOpen) return null;

  const backend =
    customBackendUrl ||
    (typeof window !== 'undefined' ? localStorage.getItem('streamchat_backend_url') : '') ||
    '';

  const activeOrigin = useCurrentDomain ? currentOrigin : `http://127.0.0.1:${overlayPort}`;

  // If on Vercel or different domain, attach ?server= so the overlay connects to backend
  const serverQuery =
    backend && (activeOrigin.includes('vercel.app') || !activeOrigin.includes(backend.replace(/^https?:\/\//, '')))
      ? `?server=${encodeURIComponent(backend)}`
      : '';

  const links = [
    {
      key: 'chat',
      title: 'Chat Overlay (YouTube + TikTok)',
      desc: 'Menampilkan gabungan live chat transparan dengan badge YT & TT',
      url: `${activeOrigin}/overlay/chat${serverQuery}`,
      icon: ChatBubbleLeftRightIcon,
      color: '#0085ee',
      bg: '#e0f2fe',
      border: '#bae6fd',
    },
    {
      key: 'gifts',
      title: 'TikTok Gift Alert Overlay',
      desc: 'Stiker kado asli TikTok floating di layar dengan audio chime & anti-spam delay',
      url: `${activeOrigin}/overlay/gifts${serverQuery}`,
      icon: SparklesIcon,
      color: '#e11d48',
      bg: '#ffe4e6',
      border: '#fecdd3',
    },
    {
      key: 'all',
      title: 'Combined Overlay (Chat & Gifts)',
      desc: 'Satu Browser Source untuk chat transparan dan stiker gift mengambang',
      url: `${activeOrigin}/overlay/all${serverQuery}`,
      icon: Square3Stack3DIcon,
      color: '#7c3aed',
      bg: '#ede9fe',
      border: '#ddd6fe',
    },
  ];

  const handleCopy = (key: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpen = (url: string) => {
    if ((window as any).electronAPI?.openExternal) {
      (window as any).electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ padding: '28px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
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
              <TvIcon style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>OBS Studio Overlays</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Tambahkan URL berikut ke OBS sebagai <b>Browser Source</b>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '50%' }}>
            <XMarkIcon style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* Domain Toggle Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f1f5f9',
          border: '1px solid #e2e8f0',
          padding: '10px 14px',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Domain URL:</span>
            <span style={{
              fontSize: '11px',
              fontFamily: 'monospace',
              color: '#0284c7',
              background: '#e0f2fe',
              padding: '2px 8px',
              borderRadius: '6px',
              fontWeight: 600
            }}>
              {activeOrigin}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setUseCurrentDomain(true)}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: useCurrentDomain ? '#0085ee' : '#ffffff',
                color: useCurrentDomain ? '#ffffff' : '#64748b',
                borderColor: useCurrentDomain ? '#0085ee' : '#cbd5e1'
              }}
            >
              Domain Saat Ini
            </button>
            <button
              type="button"
              onClick={() => setUseCurrentDomain(false)}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: !useCurrentDomain ? '#0085ee' : '#ffffff',
                color: !useCurrentDomain ? '#ffffff' : '#64748b',
                borderColor: !useCurrentDomain ? '#0085ee' : '#cbd5e1'
              }}
            >
              127.0.0.1 (Lokal)
            </button>
          </div>
        </div>

        {/* Links List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '22px' }}>
          {links.map((item) => {
            const Icon = item.icon;
            const isCopied = copiedKey === item.key;
            return (
              <div
                key={item.key}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '16px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 133, 238, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.02)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: item.bg,
                    border: `1px solid ${item.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: item.color
                  }}>
                    <Icon style={{ width: '16px', height: '16px' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{item.title}</h3>
                  </div>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.4 }}>
                  {item.desc}
                </p>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={item.url}
                    className="input-field"
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '11px',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0'
                    }}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={() => handleCopy(item.key, item.url)}
                    className={isCopied ? 'btn btn-primary' : 'btn btn-secondary'}
                    style={{
                      padding: '8px 14px',
                      fontSize: '11px',
                      minWidth: '95px'
                    }}
                  >
                    {isCopied ? <CheckIcon style={{ width: '14px', height: '14px' }} /> : <DocumentDuplicateIcon style={{ width: '14px', height: '14px' }} />}
                    <span>{isCopied ? 'Tersalin!' : 'Salin'}</span>
                  </button>
                  <button
                    onClick={() => handleOpen(item.url)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 12px' }}
                    title="Buka di browser"
                  >
                    <ArrowTopRightOnSquareIcon style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tip Box */}
        <div style={{
          padding: '14px 18px',
          borderRadius: '14px',
          background: '#e0f2fe',
          border: '1px solid #bae6fd',
          fontSize: '12px',
          color: '#0369a1',
          lineHeight: '1.5'
        }}>
          <strong style={{ color: '#0284c7' }}>💡 Petunjuk OBS:</strong> Klik <b>+</b> pada panel Sources di OBS Studio, pilih <b>Browser</b>, tempelkan salah satu URL di atas, dan atur ukuran (misal 450x800).
        </div>
      </div>
    </div>
  );
};
