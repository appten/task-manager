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
      <header className="page-subnav-header">
        <button
          type="button"
          className="btn-subnav-back"
          onClick={() => router.push('/')}
          aria-label="Kembali ke Beranda"
          title="Kembali ke Beranda"
        >
          <ArrowLeft size={18} />
          <span>Kembali</span>
        </button>
        <div className="subnav-title-group">
          <h2 className="subnav-page-title">Akun & Pengaturan</h2>
          <span className="subnav-badge-caption">Profil & Pencadangan Cloud</span>
        </div>
        <div style={{ width: '68px' }} />
      </header>
      <main className="app-screen">
        <div className="scrollable-content" style={{ paddingBottom: '30px' }}>
          <AccountView />
        </div>
      </main>
    </div>
  );
}

