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

        const redirectUri =
          window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? `${window.location.origin}/auth/callback`
            : 'https://task.ten.my.id/auth/callback';

        let userData: any = null;
        let tokenData: any = null;

        // 1. Coba tukar via backend Cloudflare Pages Functions /api/auth
        try {
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

          if (res.ok) {
            const data = (await res.json()) as any;
            if (data?.success && data?.user) {
              userData = data.user;
              tokenData = data.token;
            }
          }
        } catch (fetchErr) {
          console.warn('Panggilan backend /api/auth tidak tersedia, beralih ke direct exchange:', fetchErr);
        }

        // 2. Jika backend /api/auth gagal (misal 404 pada local Next.js dev server), gunakan Direct Client Exchange
        if (!userData) {
          const clientId = 'ten_app_eaffqk';
          const clientSecret = 'sec_live_256rmh7fj21qcc6mbp3gkf';

          const tokenRes = await fetch('https://account.ten.my.id/api/oauth/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code,
              redirect_uri: redirectUri,
              client_id: clientId,
              client_secret: clientSecret,
            }),
          });

          if (!tokenRes.ok) {
            const errText = await tokenRes.text();
            throw new Error(`Gagal menukar token otorisasi SSO TEN (${tokenRes.status}): ${errText}`);
          }

          tokenData = (await tokenRes.json()) as any;
          const accessToken = tokenData.access_token;

          let profile: any = {};
          if (accessToken) {
            const userinfoRes = await fetch('https://account.ten.my.id/api/oauth/userinfo', {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            });
            if (userinfoRes.ok) {
              profile = await userinfoRes.json();
            }
          }

          const userEmail = (profile.email || tokenData.email || '').trim().toLowerCase();
          const rawUsername = profile.username || profile.preferred_username || '';
          const formattedUsername = rawUsername
            ? rawUsername.startsWith('@')
              ? rawUsername
              : `@${rawUsername}`
            : undefined;
          const userName = profile.name || profile.username || (userEmail ? userEmail.split('@')[0] : 'Pengguna TEN');
          const userAvatar = profile.picture || profile.avatar || null;
          const userRole = profile.role || 'user';

          userData = {
            id: profile.sub || tokenData.sub || userEmail,
            email: userEmail,
            name: userName,
            username: formattedUsername,
            role: userRole,
            avatar: userAvatar,
            authProvider: 'ten-sso',
          };
        }

        const ssoUser = {
          id: userData.id || userData.sub || userData.email,
          name: userData.name || 'Pengguna TEN',
          email: userData.email,
          username: userData.username,
          avatar: userData.avatar || userData.picture || userData.image,
          role: userData.role || 'user',
          authProvider: 'ten-sso' as const,
          createdAt: userData.createdAt || new Date().toISOString(),
        };

        // Simpan ke SELURUH key storage aplikasi agar terbaca oleh TaskContext & CloudSync
        try {
          localStorage.setItem('ten_my_id_user_v01', JSON.stringify(ssoUser));
          localStorage.setItem('ten_cloud_session', JSON.stringify({ user: ssoUser, token: tokenData }));
          localStorage.setItem('ten_current_user', JSON.stringify(ssoUser));
          localStorage.setItem('ten_my_id_autosync_v01', 'true');
          window.dispatchEvent(new Event('storage'));
        } catch (e) {
          console.warn('Gagal menyimpan sesi ke localStorage:', e);
        }

        if (!isMounted) return;
        setStatusText(`Selamat datang, ${ssoUser.name || ssoUser.username}!`);

        // Jika login via popup window
        if (window.opener) {
          try {
            window.opener.postMessage(
              {
                type: 'TEN_SSO_LOGIN_SUCCESS',
                user: ssoUser,
              },
              '*'
            );
          } catch (e) {
            console.warn('Gagal mengirim postMessage ke opener:', e);
          }

          setTimeout(() => {
            try {
              window.close();
            } catch {
              router.replace('/account');
            }
          }, 600);
        } else {
          // Jika login via direct redirect (bukan popup)
          setTimeout(() => {
            router.replace('/account');
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
