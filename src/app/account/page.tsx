'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { StatusBar } from '../../components/StatusBar';
import { Toast } from '../../components/Toast';
import { AccountView } from '../../components/AccountView';
import { ArrowLeft } from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();

  return (
    <div className="mobile-viewport-wrapper">
      <Toast />
      <StatusBar />
      <header className="android-app-bar" style={{ gap: '12px' }}>
        <button
          type="button"
          className="android-icon-btn"
          onClick={() => router.push('/')}
          aria-label="Kembali ke Beranda"
          title="Kembali ke Beranda"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="app-bar-title">Akun & Sinkronisasi</h1>
          <div className="app-bar-subtitle">Pengaturan profil & pencadangan cloud</div>
        </div>
      </header>
      <main className="app-screen">
        <div className="scrollable-content" style={{ paddingBottom: '30px' }}>
          <AccountView />
        </div>
      </main>
    </div>
  );
}

