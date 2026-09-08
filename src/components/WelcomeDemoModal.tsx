'use client';

import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';

export const WelcomeDemoModal: React.FC = () => {
  const { clearAllTasksAndStartFresh, showToast } = useTask();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(1);

  useEffect(() => {
    // 1. Periksa apakah pengunjung sudah pernah mengonfirmasi data bersih
    const isDismissed = localStorage.getItem('ten_tasks_demo_dismissed') === 'true';
    if (isDismissed) return;

    // 2. Periksa apakah pengguna lama yang sudah memiliki data pribadi:
    // a. Sudah memiliki akun profil pengguna
    const hasUserAccount = Boolean(localStorage.getItem('ten_my_id_user_v01'));
    // b. Memiliki sasaran hidup yang tersimpan
    const hasSavedGoal = Boolean(localStorage.getItem('ten_my_id_user_goal_v01'));
    // c. Memiliki riwayat penyelesaian tugas harian
    const hasTodayLogs = Boolean(localStorage.getItem('today_daily_completion_logs_v1'));
    // d. Memiliki tugas kustom buatan sendiri atau aktivitas pengerjaan tugas
    let hasCustomTasks = false;
    const savedTasksStr = localStorage.getItem('ten_my_id_tasks_v01');
    if (savedTasksStr) {
      try {
        const parsed = JSON.parse(savedTasksStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasUserCreatedTask = parsed.some(
            (t: any) => (!t.id?.startsWith('task-')) || (t.timeSpent && t.timeSpent > 0)
          );
          if (hasUserCreatedTask) {
            hasCustomTasks = true;
          }
        }
      } catch {}
    }

    if (hasUserAccount || hasSavedGoal || hasTodayLogs || hasCustomTasks) {
      // Pengguna lama yang sudah ada data penggunanya -> jangan pernah munculkan popup
      try {
        localStorage.setItem('ten_tasks_demo_dismissed', 'true');
      } catch {}
      return;
    }

    let delayMs = 5000; // Standar: 5 detik setelah kunjungan perdana
    const snoozeUntilStr = localStorage.getItem('ten_tasks_demo_snooze_until');

    if (snoozeUntilStr) {
      const snoozeUntil = Number(snoozeUntilStr);
      const remainingMs = snoozeUntil - Date.now();
      if (remainingMs > 0) {
        delayMs = remainingMs;
      } else {
        delayMs = 5000; // Jika waktu tunda telah berlalu, beri jeda 5 detik saat kunjungan berikutnya
      }
    }

    const timer = setTimeout(() => {
      if (localStorage.getItem('ten_tasks_demo_dismissed') !== 'true') {
        setIsOpen(true);
      }
    }, delayMs);

    return () => clearTimeout(timer);
  }, []);

  const handleStartClean = () => {
    clearAllTasksAndStartFresh();
    setIsOpen(false);
  };

  const handleContinueDemo = () => {
    const delayMs = selectedMinutes * 60 * 1000;
    const snoozeUntil = Date.now() + delayMs;
    try {
      localStorage.setItem('ten_tasks_demo_snooze_until', snoozeUntil.toString());
    } catch {}

    setIsOpen(false);
    showToast(`Mode demo dilanjutkan. Popup akan muncul kembali dalam ${selectedMinutes} menit.`);

    // Jadwalkan kemunculan kembali jika halaman tetap aktif
    setTimeout(() => {
      if (localStorage.getItem('ten_tasks_demo_dismissed') !== 'true') {
        setIsOpen(true);
      }
    }, delayMs);
  };

  if (!isOpen) return null;

  return (
    <div className="welcome-demo-overlay" role="dialog" aria-modal="true">
      <div className="welcome-demo-card">
        {/* Header Icon & Title */}
        <div className="welcome-demo-header">
          <div className="welcome-demo-badge">
            <span className="welcome-badge-icon">✨</span>
            <span className="welcome-badge-text">Mode Demonstrasi</span>
          </div>
          <h2 className="welcome-demo-title">Selamat Datang di TEN Tasks</h2>
        </div>

        {/* Body Description */}
        <div className="welcome-demo-body">
          <p className="welcome-demo-intro">
            Aplikasi pengelola tugas harian dan jadwal cerdas yang dirancang untuk membantu Anda fokus menyelesaikan hal terpenting setiap hari dengan panduan ritme energi AI.
          </p>

          <div className="welcome-demo-mode-note">
            <span className="mode-note-dot" />
            <span className="mode-note-text">
              Saat ini aplikasi berjalan dalam <strong>mode demo</strong> dengan data contoh (dummy) agar Anda dapat menjelajahi seluruh fitur dengan mudah.
            </span>
          </div>

          <p className="welcome-demo-guide-text">
            Jika sudah yakin ingin menggunakan aplikasi ini, Anda dapat langsung memulai dengan data yang bersih. Jika masih ingin melihat-lihat, silakan lanjutkan mode demo.
          </p>
        </div>

        {/* Action 1: Mulai Menggunakan Bersih */}
        <div className="welcome-demo-actions">
          <button
            type="button"
            className="welcome-btn-primary"
            onClick={handleStartClean}
            id="btn-start-clean-data"
          >
            <span className="btn-icon">🚀</span>
            <span>Mulai Pakai Aplikasi (Data Bersih)</span>
          </button>

          {/* Section: Masih Ingin Melihat Demo */}
          <div className="welcome-demo-snooze-section">
            <div className="snooze-title-bar">
              <span className="snooze-label">Masih mau lihat-lihat demo? Pilih durasi:</span>
            </div>

            <div className="snooze-options-grid">
              {[1, 5, 10].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  className={`snooze-pill-btn ${selectedMinutes === mins ? 'active' : ''}`}
                  onClick={() => setSelectedMinutes(mins)}
                  id={`btn-snooze-${mins}m`}
                >
                  {mins} Menit
                </button>
              ))}
            </div>

            <button
              type="button"
              className="welcome-btn-secondary"
              onClick={handleContinueDemo}
              id="btn-continue-demo"
            >
              Lanjutkan Demo ({selectedMinutes} Menit)
            </button>

            <span className="welcome-demo-footnote">
              * Popup tidak akan muncul lagi setelah konfirmasi data bersih, namun akan muncul kembali jika Anda memilih melanjutkan demo.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
