'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusText, setStatusText] = useState('Menghubungkan ke SSO TEN...');
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
          setStatusText(`Autentikasi ditolak atau dibatalkan: ${error}`);
          return;
        }

        if (!code) {
          if (!isMounted) return;
          setIsError(true);
          setStatusText('Kode otorisasi SSO TEN tidak ditemukan di URL callback.');
          return;
        }

        setStatusText('Menukar kode otorisasi dan memuat sesi akun TEN...');

        const clientId = 'ten_app_eaffqk';
        const clientSecret = 'sec_live_256rmh7fj21qcc6mbp3gkf';
        const redirectUri = 'https://task.ten.my.id/auth/callback';

        // 1. Penukaran Kode Otorisasi ke https://account.ten.my.id/api/oauth/token
        // Format body: JSON (Sesuai panduan resmi SSO TEN terbaru)
        const tokenRes = await fetch('https://account.ten.my.id/api/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: redirectUri,
          }),
        });

        if (!tokenRes.ok) {
          const errText = await tokenRes.text();
          throw new Error(`Gagal menukar token SSO TEN (${tokenRes.status}): ${errText}`);
        }

        const tokenData = (await tokenRes.json()) as any;
        const rawUser = tokenData.user || {};

        const userEmail = (rawUser.email || '').trim().toLowerCase();
        const userName =
          rawUser.displayName ||
          rawUser.name ||
          (userEmail ? userEmail.split('@')[0] : 'Pengguna TEN');
        const rawUsername = rawUser.username || '';
        const formattedUsername = rawUsername
          ? rawUsername.startsWith('@')
            ? rawUsername
            : `@${rawUsername}`
          : undefined;
        const userRole =
          rawUser.role?.toLowerCase() === 'admin' ||
          rawUser.role?.toLowerCase() === 'pengelola'
            ? 'admin'
            : 'user';
        const userAvatar = rawUser.avatar || rawUser.picture || rawUser.photoURL || undefined;

        const ssoUser = {
          id: rawUser.id || rawUser.uid || rawUser.sub || userEmail,
          name: userName,
          username: formattedUsername,
          email: userEmail,
          avatar: userAvatar,
          role: userRole as any,
          authProvider: 'ten-sso' as const,
          createdAt: new Date().toISOString(),
        };

        // 2. Simpan Sesi Pengguna ke Penyimpanan Lokal (Local Storage)
        try {
          localStorage.setItem('ten_my_id_user_v01', JSON.stringify(ssoUser));
          localStorage.setItem(
            'ten_cloud_session',
            JSON.stringify({ user: ssoUser, token: tokenData.access_token })
          );
          localStorage.setItem('ten_current_user', JSON.stringify(ssoUser));
          localStorage.setItem('ten_my_id_autosync_v01', 'true');
          window.dispatchEvent(new Event('storage'));
        } catch (storageErr) {
          console.warn('Gagal menyimpan sesi ke localStorage:', storageErr);
        }

        // 3. Cadangkan Sesi ke Task_KV via endpoint worker (/api/auth) di latar belakang (opsional)
        try {
          fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'ten-sso-callback',
              code,
              redirectUri,
            }),
          }).catch(() => {});
        } catch {}

        if (!isMounted) return;
        setStatusText(`Selamat datang, ${ssoUser.name || ssoUser.username}!`);

        // 4. Tutup Jendela Popup dan Perbarui Halaman Induk
        if (window.opener) {
          try {
            window.opener.postMessage(
              {
                type: 'TEN_SSO_LOGIN_SUCCESS',
                user: ssoUser,
              },
              '*'
            );
          } catch (postErr) {
            console.warn('Gagal postMessage ke window opener:', postErr);
          }

          setTimeout(() => {
            try {
              window.close();
            } catch {
              router.replace('/account');
            }
          }, 500);
        } else {
          // Jika login direct (bukan popup), langsung arahkan ke menu akun
          setTimeout(() => {
            router.replace('/account');
          }, 700);
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
            <span>Memperbarui sesi akun Anda...</span>
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
            Kembali ke Halaman Akun
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
          Memuat callback SSO TEN...
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
