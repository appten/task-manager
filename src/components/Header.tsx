import React from 'react';
import { useRouter } from 'next/navigation';
import { useTask } from '../context/TaskContext';
import { StatusBar } from './StatusBar';
import { CheckCheck, History, Target } from 'lucide-react';

export const Header: React.FC = () => {
  const router = useRouter();
  const {
    tasks,
    todayTasks,
    activeTab,
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
          {/* Tombol Halaman Riwayat Tugas Selesai */}
          <button
            className="android-icon-btn history-btn-action"
            onClick={() => router.push('/history')}
            title="Halaman Riwayat Tugas Selesai"
            aria-label="Riwayat Tugas Selesai"
          >
            <History size={19} />
            {tasks.filter((t) => t.isCompleted).length > 0 && (
              <span className="navbar-badge-dot">
                {tasks.filter((t) => t.isCompleted).length}
              </span>
            )}
          </button>
        </div>
      </header>
    </>
  );
};
