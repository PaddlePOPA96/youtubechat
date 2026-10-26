import React, { useState, useEffect } from 'react';

interface PreloaderProps {
  onFinished?: () => void;
  minDuration?: number; // ms
}

export const Preloader: React.FC<PreloaderProps> = ({
  onFinished,
  minDuration = 1800,
}) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Memulai StreamChat...');
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);

  useEffect(() => {
    const startTime = Date.now();

    // Progress simulation
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / minDuration) * 100));
      setProgress(pct);

      if (pct < 35) {
        setStatusText('Menyiapkan koneksi YouTube & TikTok...');
      } else if (pct < 70) {
        setStatusText('Memuat overlay OBS & konfigurasi...');
      } else if (pct < 95) {
        setStatusText('Sinkronisasi tema Glow Blue...');
      } else {
        setStatusText('Aplikasi siap!');
      }

      if (elapsed >= minDuration) {
        clearInterval(interval);
        setIsFadingOut(true);
        setTimeout(() => {
          setIsRemoved(true);
          onFinished?.();
        }, 600); // match transition duration
      }
    }, 40);

    return () => clearInterval(interval);
  }, [minDuration, onFinished]);

  if (isRemoved) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafd',
        opacity: isFadingOut ? 0 : 1,
        transform: isFadingOut ? 'scale(1.03)' : 'scale(1)',
        pointerEvents: isFadingOut ? 'none' : 'auto',
        transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      {/* Dynamic Ambient Background Glows */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 133, 238, 0.16) 0%, rgba(0, 133, 238, 0.04) 50%, transparent 75%)',
          filter: 'blur(40px)',
          animation: 'preloaderPulse 3s ease-in-out infinite alternate',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 210, 255, 0.14) 0%, transparent 70%)',
          filter: 'blur(30px)',
          animation: 'preloaderPulse 2.4s ease-in-out infinite alternate-reverse',
          pointerEvents: 'none'
        }}
      />

      {/* Main Content Box */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          zIndex: 2,
          padding: '24px'
        }}
      >
        {/* Animated Icon Container */}
        <div
          style={{
            position: 'relative',
            width: '108px',
            height: '108px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Outer Pulsing Wave Ring */}
          <div
            style={{
              position: 'absolute',
              inset: '-12px',
              borderRadius: '34px',
              border: '2px solid rgba(0, 133, 238, 0.25)',
              animation: 'preloaderRing 2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite',
              pointerEvents: 'none'
            }}
          />

          {/* Secondary Soft Ring */}
          <div
            style={{
              position: 'absolute',
              inset: '-4px',
              borderRadius: '28px',
              background: 'linear-gradient(135deg, rgba(0, 133, 238, 0.2) 0%, rgba(0, 210, 255, 0.1) 100%)',
              filter: 'blur(6px)',
              pointerEvents: 'none'
            }}
          />

          {/* Icon Badge Surface */}
          <div
            style={{
              width: '92px',
              height: '92px',
              borderRadius: '24px',
              background: '#ffffff',
              border: '1px solid rgba(0, 133, 238, 0.25)',
              boxShadow: '0 16px 36px -10px rgba(0, 133, 238, 0.3), 0 0 0 1px rgba(255,255,255,0.9) inset',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'preloaderFloat 3s ease-in-out infinite',
              overflow: 'hidden'
            }}
          >
            <img
              src="/icon.webp"
              alt="StreamChat Icon"
              onError={(e) => {
                // Fallback to png if webp fails
                (e.currentTarget as HTMLImageElement).src = '/icon.png';
              }}
              style={{
                width: '74px',
                height: '74px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 6px 12px rgba(0, 133, 238, 0.25))',
                animation: 'preloaderIconPop 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
              }}
            />
          </div>
        </div>

        {/* Animated Brand Name & Shimmer */}
        <div style={{ overflow: 'hidden', padding: '4px 10px' }}>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              margin: 0,
              background: 'linear-gradient(135deg, #0f172a 0%, #0085ee 50%, #0066cc 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'preloaderTextReveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards, preloaderShimmer 3s linear infinite',
              lineHeight: 1.2
            }}
          >
            StreamChat
          </h1>
        </div>

        {/* Tagline / Subtitle */}
        <p
          style={{
            fontSize: '13px',
            color: '#64748b',
            fontWeight: 500,
            marginTop: '6px',
            marginBottom: '28px',
            letterSpacing: '0.02em',
            animation: 'preloaderFadeIn 1s ease forwards 0.2s',
            opacity: 0
          }}
        >
          Unified Live Chat & TikTok Gifts
        </p>

        {/* Progress Bar Container */}
        <div
          style={{
            width: '220px',
            height: '5px',
            borderRadius: '9999px',
            background: 'rgba(226, 232, 240, 0.8)',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
            marginBottom: '12px'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #0085ee 0%, #00d2ff 100%)',
              borderRadius: '9999px',
              transition: 'width 0.1s linear',
              boxShadow: '0 0 10px rgba(0, 133, 238, 0.5)'
            }}
          />
        </div>

        {/* Status Text & Percentage */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '220px',
            fontSize: '11px',
            color: '#94a3b8',
            fontWeight: 600,
            letterSpacing: '-0.01em'
          }}
        >
          <span style={{ transition: 'all 0.2s ease', color: '#64748b' }}>{statusText}</span>
          <span style={{ color: '#0085ee', fontVariantNumeric: 'tabular-nums' }}>{progress}%</span>
        </div>
      </div>
    </div>
  );
};
