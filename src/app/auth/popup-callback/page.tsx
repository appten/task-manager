'use client';

import React, { useEffect } from 'react';

export default function PopupCallbackPage() {
  useEffect(() => {
    try {
      if (window.opener) {
        window.opener.postMessage({ type: 'TEN_SSO_LOGIN_SUCCESS' }, '*');
        window.close();
      } else {
        window.location.href = '/dashboard';
      }
    } catch {
      window.location.href = '/dashboard';
    }
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '20px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: '#dcfce7',
          color: '#16a34a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          marginBottom: '12px',
        }}
      >
        ✓
      </div>
      <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
        Autentikasi SSO TEN Berhasil
      </h2>
      <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
        Menutup jendela login dan memuat sesi Anda...
      </p>
    </div>
  );
}
