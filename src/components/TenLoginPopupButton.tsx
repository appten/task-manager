'use client';

import React, { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { Shield, Loader2, LogIn } from 'lucide-react';

export interface TenLoginPopupButtonProps {
  callbackUrl?: string;
  onSuccess?: () => void;
  className?: string;
  buttonText?: string;
  style?: React.CSSProperties;
}

export const TenLoginPopupButton: React.FC<TenLoginPopupButtonProps> = ({
  callbackUrl = '/auth/popup-callback',
  onSuccess,
  className,
  buttonText = 'Masuk via SSO TEN (Popup)',
  style,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session, status } = useSession();

  // Dengarkan sinyal sukses dari jendela popup
  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TEN_SSO_LOGIN_SUCCESS') {
        setIsLoading(false);
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.reload();
        }
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, [onSuccess]);

  const handleLoginPopup = () => {
    setIsLoading(true);

    const width = 520;
    const height = 660;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const targetCallback = callbackUrl.startsWith('http')
      ? callbackUrl
      : `${window.location.origin}${callbackUrl.startsWith('/') ? callbackUrl : `/${callbackUrl}`}`;

    const signinUrl = `/api/auth/signin/ten?callbackUrl=${encodeURIComponent(targetCallback)}`;

    const popup = window.open(
      signinUrl,
      'TEN_SSO_LOGIN_POPUP',
      `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no,location=yes,resizable=yes`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      // Jika popup diblokir browser, fallback langsung redirect
      signIn('ten', { callbackUrl: targetCallback });
      return;
    }

    // Pantau penutupan jendela popup (fallback jika postMessage terhalang)
    const intervalTimer = setInterval(() => {
      if (popup.closed) {
        clearInterval(intervalTimer);
        setIsLoading(false);
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.reload();
        }
      }
    }, 600);
  };

  return (
    <button
      type="button"
      onClick={handleLoginPopup}
      disabled={isLoading}
      className={
        className ||
        'inline-flex items-center justify-center gap-2.5 font-semibold text-white transition-all disabled:opacity-60 cursor-pointer'
      }
      style={{
        background: 'linear-gradient(135deg, #1d4ed8 0%, #4f46e5 100%)',
        color: '#ffffff',
        padding: '11px 20px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        fontWeight: 700,
        fontSize: '13.5px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '9px',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
        transition: 'all 0.15s ease',
        ...style,
      }}
    >
      {isLoading ? (
        <>
          <Loader2 size={16} className="spin" />
          <span>Menghubungkan ke TEN...</span>
        </>
      ) : (
        <>
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '6px',
              background: '#ffffff',
              color: '#1d4ed8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 900,
            }}
          >
            T
          </div>
          <span>{buttonText}</span>
        </>
      )}
    </button>
  );
};
