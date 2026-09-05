'use client';

import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { CheckCheck, RotateCcw, Target, Wifi, BatteryMedium, Signal } from 'lucide-react';

export const Header: React.FC = () => {
  const { tasks, resetToSampleData, setIsGoalModalOpen } = useTask();
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
            <h1 className="app-bar-title">Tugas Saya</h1>
            <div className="app-bar-subtitle">
              {pendingCount > 0
                ? `${pendingCount} tugas aktif`
                : 'Semua tugas selesai 🎉'}
            </div>
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
          <button
            className="android-icon-btn"
            onClick={resetToSampleData}
            title="Reset ke data contoh"
            aria-label="Reset data"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </header>
    </>
  );
};
