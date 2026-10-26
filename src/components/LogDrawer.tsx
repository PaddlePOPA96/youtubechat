import React from 'react';
import { CommandLineIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';

export interface LogEntry {
  id: string;
  time: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

interface LogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
  onClearLogs: () => void;
}

export const LogDrawer: React.FC<LogDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  onClearLogs,
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '260px',
      background: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid #cbd5e1',
      boxShadow: '0 -15px 40px rgba(0, 0, 0, 0.1), inset 0 1px 0 #ffffff',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 500,
      animation: 'fadeInModal 0.2s ease-out'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 20px',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            background: '#e0f2fe',
            border: '1px solid #bae6fd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0085ee'
          }}>
            <CommandLineIcon style={{ width: '15px', height: '15px' }} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '-0.01em', color: '#0f172a' }}>
            System & Connection Logs
          </span>
          <span className="badge-pill" style={{
            fontSize: '10px',
            padding: '2px 8px',
            fontFamily: 'JetBrains Mono, monospace',
            background: '#f1f5f9'
          }}>
            {logs.length} entries
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onClearLogs}
            className="btn btn-secondary"
            style={{ padding: '5px 12px', fontSize: '11px' }}
            title="Bersihkan log"
          >
            <TrashIcon style={{ width: '13px', height: '13px' }} />
            <span>Bersihkan</span>
          </button>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '6px', borderRadius: '50%' }}
          >
            <XMarkIcon style={{ width: '15px', height: '15px' }} />
          </button>
        </div>
      </div>

      {/* Log Entries */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 20px',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '11px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        background: '#f8fafc'
      }}>
        {logs.length === 0 ? (
          <div style={{ color: 'var(--text-faint)', fontStyle: 'italic', padding: '10px 0' }}>
            Belum ada log sistem.
          </div>
        ) : (
          logs.map((log) => {
            let color = '#475569';
            let prefix = '[INFO]';
            let badgeBg = '#e2e8f0';

            if (log.level === 'warn') {
              color = '#b45309';
              prefix = '[WARN]';
              badgeBg = '#fef3c7';
            } else if (log.level === 'error') {
              color = '#dc2626';
              prefix = '[ERR] ';
              badgeBg = '#fee2e2';
            }

            return (
              <div key={log.id} style={{ display: 'flex', gap: '10px', lineHeight: '1.5', alignItems: 'flex-start' }}>
                <span style={{ color: '#94a3b8', flexShrink: 0 }}>{log.time}</span>
                <span style={{
                  color,
                  fontWeight: 700,
                  flexShrink: 0,
                  padding: '0 4px',
                  borderRadius: '3px',
                  background: badgeBg
                }}>
                  {prefix}
                </span>
                <span style={{ color: '#1e293b', wordBreak: 'break-all' }}>{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
