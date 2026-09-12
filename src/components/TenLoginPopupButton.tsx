'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useTask } from '../context/TaskContext';

export interface TenLoginPopupButtonProps {
  callbackUrl?: string;
  onSuccess?: () => void;
  className?: string;
  buttonText?: string;
  style?: React.CSSProperties;
}

export const TenLoginPopupButton: React.FC<TenLoginPopupButtonProps> = ({
  callbackUrl = '/auth/callback',
  onSuccess,
  className,
  buttonText = 'Masuk via SSO TEN (Popup)',
  style,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { showToast, refreshUserSession } = useTask();

  // Dengarkan sinyal sukses dari jendela popup
  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TEN_SSO_LOGIN_SUCCESS') {
        setIsLoading(false);
        refreshUserSession();
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.href = '/account';
        }
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, [onSuccess, refreshUserSession]);

  const handleLoginPopup = () => {
    setIsLoading(true);

    const width = 520;
    const height = 660;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const clientId = 'ten_app_eaffqk';
    const targetRedirect =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? `${window.location.origin}/auth/callback`
        : 'https://task.ten.my.id/auth/callback';
    const state = Math.random().toString(36).substring(2, 15);
    try {
      sessionStorage.setItem('ten_sso_state', state);
    } catch {
      // ignore
    }

    const authUrl = `https://account.ten.my.id/api/oauth/authorize?response_type=code&client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(targetRedirect)}&scope=${encodeURIComponent(
      'openid profile email'
    )}&state=${encodeURIComponent(state)}`;

    const popup = window.open(
      authUrl,
      'TEN_SSO_LOGIN_POPUP',
      `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no,location=yes,resizable=yes`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      // Jika popup diblokir browser, fallback langsung redirect di tab saat ini
      window.location.href = authUrl;
      return;
    }

    // Pantau jika popup selesai menyimpan sesi atau ditutup
    const intervalTimer = setInterval(() => {
      const saved =
        localStorage.getItem('ten_my_id_user_v01') ||
        localStorage.getItem('ten_cloud_session');

      if (saved) {
        clearInterval(intervalTimer);
        setIsLoading(false);
        refreshUserSession();
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.href = '/account';
        }
        return;
      }

      if (popup.closed) {
        clearInterval(intervalTimer);
        setIsLoading(false);
        const user = refreshUserSession();
        if (user) {
          if (onSuccess) {
            onSuccess();
          } else {
            window.location.href = '/account';
          }
        }
      }
    }, 400);
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
          <Loader2 size={16} className="spin-animate" />
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
