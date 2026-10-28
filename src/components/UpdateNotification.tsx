import React from 'react';
import {
  ArrowPathIcon,
  XMarkIcon,
  SparklesIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

interface UpdateNotificationProps {
  currentVersion: string;
  newVersion: string;
  isDownloaded: boolean;
  downloadProgress?: number | null;
  onInstallNow: () => void;
  onDismiss: () => void;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  currentVersion,
  newVersion,
  isDownloaded,
  downloadProgress,
  onInstallNow,
  onDismiss,
}) => {
  return (
    <div
      className="update-banner"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        maxWidth: '430px',
        width: 'calc(100vw - 40px)',
        zIndex: 99999,
        padding: '18px 20px',
        borderRadius: '18px',
        border: '1px solid rgba(0, 133, 238, 0.35)',
        backdropFilter: 'blur(24px)',
        boxShadow: '0 20px 45px -10px rgba(0, 133, 238, 0.3), 0 4px 16px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: isDownloaded
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #0085ee 0%, #0066cc 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: isDownloaded
                ? '0 4px 12px rgba(16, 185, 129, 0.35)'
                : '0 4px 12px rgba(0, 133, 238, 0.35)',
              flexShrink: 0
            }}
          >
            {isDownloaded ? (
              <CheckCircleIcon style={{ width: '22px', height: '22px' }} />
            ) : (
              <ArrowDownTrayIcon style={{ width: '20px', height: '20px', animation: 'bounce 1.5s infinite' }} />
            )}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
                {isDownloaded ? 'Pembaruan Siap Dipasang! 🚀' : 'Mengunduh Pembaruan...'}
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Versi saat ini:</span>
              <span className="badge-pill" style={{ fontSize: '10px', padding: '1px 6px' }}>v{currentVersion}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>➔</span>
              <span
                className="badge-pill"
                style={{
                  fontSize: '10px',
                  padding: '1px 6px',
                  background: '#e0f2fe',
                  color: '#0085ee',
                  borderColor: '#bae6fd',
                  fontWeight: 800
                }}
              >
                v{newVersion}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="btn btn-secondary"
          title="Tutup pemberitahuan"
          style={{ padding: '5px', borderRadius: '50%', color: 'var(--text-muted)' }}
        >
          <XMarkIcon style={{ width: '15px', height: '15px' }} />
        </button>
      </div>

      {/* Progress Bar if still downloading */}
      {!isDownloaded && downloadProgress !== undefined && downloadProgress !== null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>Mengunduh patch update...</span>
            <span style={{ fontWeight: 700, color: '#0085ee' }}>{Math.round(downloadProgress)}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(0, 133, 238, 0.15)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, Math.max(0, downloadProgress))}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #0085ee, #00d2ff)',
                borderRadius: '9999px',
                transition: 'width 0.2s ease'
              }}
            />
          </div>
        </div>
      )}

      {/* Description */}
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
        {isDownloaded ? (
          <>
            Patch update telah selesai diunduh. Update akan <strong>otomatis terpasang saat aplikasi ditutup</strong>, atau kamu bisa klik tombol di bawah untuk langsung menutup & memperbarui sekarang.
          </>
        ) : (
          <>
            Sedang mengunduh berkas patch versi terbaru di latar belakang tanpa mengganggu live streaming kamu.
          </>
        )}
      </p>

      {/* Action Buttons */}
      {isDownloaded && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          <button
            onClick={onInstallNow}
            className="btn btn-primary"
            style={{
              flex: 1,
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #0085ee 0%, #0066cc 100%)',
              boxShadow: '0 4px 14px rgba(0, 133, 238, 0.4)'
            }}
          >
            <SparklesIcon style={{ width: '15px', height: '15px' }} />
            <span>Tutup & Update Sekarang</span>
          </button>

          <button
            onClick={onDismiss}
            className="btn btn-secondary"
            style={{
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 600
            }}
            title="Update akan otomatis diterapkan saat kamu menutup aplikasi nanti"
          >
            Nanti Saja
          </button>
        </div>
      )}
    </div>
  );
};
