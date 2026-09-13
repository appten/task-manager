import React from 'react';
import { useRouter } from 'next/navigation';
import { useTask } from '../context/TaskContext';
import { StatusBar } from './StatusBar';
import { CheckCheck, Target, User } from 'lucide-react';

export const Header: React.FC = () => {
  const router = useRouter();
  const {
    tasks,
    todayTasks,
    activeTab,
    setActiveTab,
    currentUser,
  } = useTask();

  const pendingCount = tasks.filter((t) => !t.isCompleted).length;
  const todayCompleted = todayTasks.filter((t) => t.isCompleted).length;

  // Header Title & Subtitle dinamis
  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'today':
        return {
          title: 'Fokus Today',
          subtitle: `${todayCompleted}/${todayTasks.length} tugas tuntas hari ini`,
        };
      case 'calendar':
        return {
          title: 'Kalender & Jadwal',
          subtitle: 'Alokasi waktu & agenda harian',
        };
      case 'pilah':
      case 'ai':
        return {
          title: 'Pilah Tugas',
          subtitle: 'Analisis beban & ritme sirkadian',
        };
      case 'laporan':
        return {
          title: 'Laporan Produktivitas',
          subtitle: 'Statistik penyelesaian & performa',
        };
      case 'account':
        return {
          title: 'Akun & Sinkronisasi',
          subtitle: currentUser ? `Terhubung: ${currentUser.name}` : 'Mode Tamu & Cadangan Cloud',
        };
      case 'inbox':
      default:
        return {
          title: 'Inbox Tugas',
          subtitle: pendingCount > 0 ? `${pendingCount} tugas aktif di Inbox` : 'Semua tugas selesai 🎉',
        };
    }
  };

  const headerInfo = getHeaderInfo();

  const handleAvatarClick = () => {
    router.push('/account');
  };

  return (
    <>
      {/* Android System Status Bar (Hari, Tanggal & Jam, Tanpa Punch Hole) */}
      <StatusBar />

      {/* Android Material 3 Top App Bar */}
      <header className="android-app-bar">
        <div className="app-bar-brand">
          <div className="app-bar-logo">
            <CheckCheck size={22} strokeWidth={2.4} />
          </div>
          <div>
            <h1 className="app-bar-title">{headerInfo.title}</h1>
            <div className="app-bar-subtitle">{headerInfo.subtitle}</div>
          </div>
        </div>

        <div className="app-bar-actions">
          {/* Tombol Halaman Goals */}
          <button
            className="android-icon-btn goal-btn-highlight"
            onClick={() => router.push('/goal')}
            title="Tujuan & Sasaran Hidup (Goals 2026)"
            aria-label="Tujuan & Sasaran Hidup"
          >
            <Target size={19} />
          </button>

          {/* Avatar Akun (Menggantikan Riwayat Tugas) */}
          <button
            type="button"
            className={`header-avatar-btn ${activeTab === 'account' ? 'active-account' : ''}`}
            onClick={handleAvatarClick}
            title={currentUser ? `Akun: ${currentUser.name}` : 'Buka Menu Akun'}
            aria-label="Menu Akun"
          >
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="header-avatar-img"
              />
            ) : currentUser?.name ? (
              <span className="header-avatar-text">
                {currentUser.name.charAt(0).toUpperCase()}
              </span>
            ) : (
              <User size={17} />
            )}
            {currentUser && (
              <span className="header-avatar-online-dot" />
            )}
          </button>
        </div>
      </header>
    </>
  );
};
