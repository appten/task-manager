'use client';

import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { CheckCheck, History, Target, Wifi, BatteryMedium, Signal } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    tasks,
    todayTasks,
    activeTab,
    currentUser,
    setIsGoalModalOpen,
    setIsHistoryModalOpen,
  } = useTask();
  const [currentTime, setCurrentTime] = useState('10:00');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

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
      case 'ai':
        return {
          title: 'AI Productivity Suite',
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
      {/* Android System Status Bar */}
      <div className="android-status-bar">
        <span>{currentTime}</span>
        <div className="android-punch-hole" />
        <div className="android-system-icons">
          <Signal size={13} />
          <Wifi size={14} />
          <BatteryMedium size={16} />
        </div>
      </div>

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
          <button
            className="android-icon-btn goal-btn-highlight"
            onClick={() => setIsGoalModalOpen(true)}
            title="Pengaturan Goals Tahun Ini & Personalisasi AI"
            aria-label="Pengaturan Goals"
          >
            <Target size={19} />
          </button>
          {/* Tombol Riwayat Tugas Selesai */}
          <button
            className="android-icon-btn history-btn-action"
            onClick={() => setIsHistoryModalOpen(true)}
            title="Riwayat Tugas Selesai"
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
