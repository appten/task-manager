'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusText, setStatusText] = useState('Menghubungkan autentikasi SSO TEN...');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const processCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          if (!isMounted) return;
          setIsError(true);
          setStatusText(`Autentikasi dibatalkan atau ditolak: ${error}`);
          return;
        }

        if (!code) {
          if (!isMounted) return;
          setIsError(true);
          setStatusText('Kode otorisasi SSO TEN tidak ditemukan.');
          return;
        }

        setStatusText('Menukar token otorisasi dan memuat profil TEN...');

        const redirectUri = `${window.location.origin}/auth/callback`;

        // Panggil endpoint Cloudflare Pages Functions auth
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'ten-sso-callback',
            code,
            redirectUri,
          }),
        });

        const data = (await res.json()) as any;

        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Gagal memproses sesi SSO TEN.');
        }

        const user = data.user;

        // Simpan sesi login lokal untuk TaskContext & sinkronisasi
        try {
          localStorage.setItem('ten_cloud_session', JSON.stringify({ user, token: data.token }));
          localStorage.setItem('ten_current_user', JSON.stringify(user));
        } catch (e) {
          console.warn('Gagal menyimpan sesi ke localStorage:', e);
        }

        if (!isMounted) return;
        setStatusText(`Selamat datang, ${user.name || user.username}!`);

        // Jika login via popup window
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'TEN_SSO_LOGIN_SUCCESS',
              user,
            },
            '*'
          );
          setTimeout(() => {
            try {
              window.close();
            } catch {
              // fallback jika browser melarang window.close()
              router.replace('/dashboard');
            }
          }, 600);
        } else {
          // Jika login direct redirect
          setTimeout(() => {
            router.replace('/dashboard');
          }, 800);
        }
      } catch (err: any) {
        console.error('SSO Callback error:', err);
        if (!isMounted) return;
        setIsError(true);
        setStatusText(err.message || 'Terjadi kendala saat memproses login SSO TEN.');
      }
    };

    processCallback();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '24px',
        textAlign: 'center',
        background: '#f8fafc',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          padding: '36px 24px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: isError ? '#fee2e2' : '#ecfdf5',
            color: isError ? '#dc2626' : '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          {isError ? <AlertCircle size={28} /> : <CheckCircle2 size={28} />}
        </div>

        <h2
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#0f172a',
            margin: '0 0 8px 0',
          }}
        >
          {isError ? 'Autentikasi Gagal' : 'Autentikasi SSO TEN Berhasil'}
        </h2>

        <p
          style={{
            fontSize: '13.5px',
            color: '#64748b',
            margin: '0 0 20px 0',
            lineHeight: 1.5,
          }}
        >
          {statusText}
        </p>

        {!isError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12.5px',
              color: '#0284c7',
              fontWeight: 500,
            }}
          >
            <Loader2 size={16} className="spin-animate" />
            <span>Menyelaraskan sesi Anda...</span>
          </div>
        )}

        {isError && (
          <button
            type="button"
            onClick={() => router.replace('/account')}
            style={{
              marginTop: '12px',
              padding: '9px 18px',
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Kembali ke Akun
          </button>
        )}
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            fontFamily: 'system-ui, sans-serif',
            color: '#64748b',
            fontSize: '14px',
          }}
        >
          Memuat callback...
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
