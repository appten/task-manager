'use client';

import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';

export const WelcomeDemoModal: React.FC = () => {
  const { clearAllTasksAndStartFresh, showToast } = useTask();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(1);

  useEffect(() => {
    // Periksa apakah pengunjung sudah pernah mengonfirmasi data bersih
    const isDismissed = localStorage.getItem('ten_tasks_demo_dismissed') === 'true';
    if (isDismissed) return;

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
            Aplikasi saat ini memuat data tugas & analisis demo untuk eksplorasi. Anda dapat langsung memulai dari awal secara bersih atau melanjutkan eksplorasi demo.
          </p>
          <p className="welcome-demo-notice-compact">
            * Pilihan data bersih hanya muncul satu kali. Jika lanjut demo, popup ini akan muncul lagi sesuai durasi yang dipilih.
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
            <span>Mulai Gunakan (Data Bersih)</span>
          </button>

          {/* Section: Masih Ingin Melihat Demo */}
          <div className="welcome-demo-snooze-section">
            <div className="snooze-title-bar">
              <span className="snooze-label">Masih ingin melihat demo? Pilih durasi:</span>
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
          </div>
        </div>
      </div>
    </div>
  );
};
