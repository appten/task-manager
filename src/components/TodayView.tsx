'use client';

import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { TodayTaskRow } from './TodayTaskRow';
import { TodayHistoryView } from './TodayHistoryView';
import {
  Sun,
  PlusCircle,
  CheckCircle2,
  Inbox,
  ArrowRight,
  Flame,
  Clock,
  History,
  Lock,
  ShieldCheck,
  X,
} from 'lucide-react';

export const TodayView: React.FC = () => {
  const { todayTasks, setActiveTab, showToast } = useTask();

  // State untuk membuka view Riwayat Today
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // State Komitmen Today
  const todayDateKey = new Date().toISOString().slice(0, 10);
  const [isCommitted, setIsCommitted] = useState(false);
  const [showCommitModal, setShowCommitModal] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`ten_today_committed_${todayDateKey}`);
      if (saved === 'true') {
        setIsCommitted(true);
      }
    } catch {}
  }, [todayDateKey]);

  const handleConfirmCommit = () => {
    setIsCommitted(true);
    setShowCommitModal(false);
    try {
      localStorage.setItem(`ten_today_committed_${todayDateKey}`, 'true');
    } catch {}
    showToast('Komitmen terkunci permanen! Fokus penuh tuntaskan tugas hari ini 🎯');
  };

  const maxSlots = 5;
  const completedTodayCount = todayTasks.filter((t) => t.isCompleted).length;
  const progressPercent =
    todayTasks.length > 0 ? Math.round((completedTodayCount / todayTasks.length) * 100) : 0;

  // Render 5 fixed slots based on Ivy Lee method
  const slots = Array.from({ length: maxSlots }, (_, index) => {
    const task = todayTasks[index] || null;
    return { slotNumber: index + 1, task };
  });

  // Current formatted date in Indonesian
  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Jika tampilan Riwayat Today dibuka
  if (isHistoryOpen) {
    return <TodayHistoryView onBack={() => setIsHistoryOpen(false)} />;
  }

  return (
    <div className="today-view-container">
      {/* Banner Header Today */}
      <div className="today-hero-card">
        <div className="today-hero-header">
          <div className="today-hero-badge">
            <Sun size={14} className="today-sun-icon" />
            <span>Fokus Hari Ini</span>
          </div>
          <span className="today-date-text">{todayFormatted}</span>
        </div>

        <h2 className="today-hero-title">Prioritas Utama Hari Ini</h2>
        <p className="today-hero-subtitle">
          Pilih maksimal 5 tugas terpenting dari Inbox agar fokus dan tidak terbebani.
        </p>

        {/* Progress Bar Today */}
        <div className="today-progress-section">
          <div className="today-progress-labels">
            <span>
              Progres: <strong>{completedTodayCount}</strong> dari{' '}
              <strong>{todayTasks.length}</strong> tugas selesai
            </span>
            <span className="today-progress-percent">{progressPercent}%</span>
          </div>
          <div className="today-progress-bar-bg">
            <div
              className="today-progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Quick Stats Pills */}
        <div className="today-stats-pills">
          <div className="today-pill">
            <Flame size={12} color="#f97316" />
            <span>{todayTasks.length}/5 Slot Terisi</span>
          </div>
          <div className="today-pill">
            <CheckCircle2 size={12} color="#10b981" />
            <span>{completedTodayCount} Tuntas</span>
          </div>
          <div className="today-pill">
            <Clock size={12} color="#3b82f6" />
            <span>{todayTasks.length - completedTodayCount} Berjalan</span>
          </div>
        </div>
      </div>

      {/* Daftar 5 Slot Tugas */}
      <div className="today-slots-wrapper">
        <div className="today-slots-header">
          <h3 className="today-slots-title">Daftar 5 Tugas Fokus</h3>
          <button
            type="button"
            className="btn-select-from-inbox"
            onClick={() => setIsHistoryOpen(true)}
            title="Buka Log Riwayat Today"
          >
            <History size={13} />
            <span>Riwayat Today</span>
            <ArrowRight size={11} />
          </button>
        </div>

        {todayTasks.length === 0 ? (
          /* Empty State jika belum ada tugas sama sekali di Today */
          <div className="empty-state today-empty-state">
            <div className="empty-icon-circle today-empty-icon">
              <Sun size={32} />
            </div>
            <div className="empty-title">Belum Ada Tugas di Today</div>
            <p className="empty-desc">
              Pilih hingga 5 tugas dari Inbox yang ingin kamu selesaikan hari ini dengan menekan tombol{' '}
              <strong>⭐ + Today</strong> pada setiap item di Inbox.
            </p>
            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: '14px', maxWidth: '220px' }}
              onClick={() => setActiveTab('inbox')}
            >
              <Inbox size={16} />
              <span>Buka Inbox Tugas</span>
            </button>
          </div>
        ) : (
          /* Unboxed Flat Slots List */
          <div className="today-clean-list">
            {slots.map(({ slotNumber, task }) => {
              if (task) {
                return (
                  <TodayTaskRow
                    key={task.id}
                    task={task}
                    slotNumber={slotNumber}
                    isCommitted={isCommitted}
                  />
                );
              }

              // Slot Kosong Bersih & Rapi
              if (isCommitted) {
                return (
                  <div
                    key={`empty-slot-${slotNumber}`}
                    className="today-empty-slot-clean locked-slot"
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                    title="Komitmen hari ini sudah terkunci"
                  >
                    <div className="empty-slot-number-pill">#{slotNumber}</div>
                    <div className="empty-slot-text">
                      <span className="empty-slot-label">Slot #{slotNumber} Kosong</span>
                      <span className="empty-slot-hint">Komitmen sudah dikunci 🔒</span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={`empty-slot-${slotNumber}`}
                  className="today-empty-slot-clean"
                  onClick={() => setActiveTab('inbox')}
                  role="button"
                  tabIndex={0}
                  title="Klik untuk memilih tugas dari Inbox"
                >
                  <div className="empty-slot-number-pill">#{slotNumber}</div>
                  <div className="empty-slot-text">
                    <span className="empty-slot-label">Slot #{slotNumber} Kosong</span>
                    <span className="empty-slot-hint">Ketuk untuk memilih tugas dari Inbox</span>
                  </div>
                  <button type="button" className="btn-add-to-slot">
                    <PlusCircle size={13} />
                    <span>Pilih</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tombol & Status Komitmen Today */}
      {todayTasks.length > 0 && (
        <div className="today-commitment-section">
          {!isCommitted ? (
            <button
              type="button"
              className="today-btn-commit"
              onClick={() => setShowCommitModal(true)}
            >
              <Lock size={15} />
              <span>Komitmen Selesaikan Hari Ini ({todayTasks.length} Tugas)</span>
            </button>
          ) : (
            <div className="today-commitment-locked-card animate-fade-in">
              <div className="locked-card-left">
                <div className="locked-icon-badge">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 className="locked-title">Komitmen Hari Ini Terkunci 🔒</h4>
                  <p className="locked-desc">
                    Komitmen telah dikunci secara permanen untuk hari ini. Fokus penuh tuntaskan {todayTasks.length} tugas yang telah Anda pilih.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Konfirmasi Kunci Komitmen */}
      {showCommitModal && (
        <div
          className="pilah-modal-overlay animate-fade-in"
          onClick={() => setShowCommitModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="pilah-modal-card animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '400px' }}
          >
            <div className="pilah-modal-header">
              <div className="modal-header-lead">
                <div className="modal-icon-badge" style={{ background: '#fef3c7', color: '#d97706' }}>
                  <Lock size={16} />
                </div>
                <div>
                  <h3 className="modal-title">Kunci Komitmen Today?</h3>
                  <p className="modal-subtitle">{todayTasks.length} Tugas Diprioritaskan</p>
                </div>
              </div>
              <button
                type="button"
                className="modal-btn-close"
                onClick={() => setShowCommitModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="pilah-modal-body">
              <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.5', margin: 0 }}>
                Dengan menekan <strong>Komitmen</strong>, Anda menegaskan tekad untuk memusatkan energi
                dan menyelesaikan {todayTasks.length} tugas yang terpilih hari ini tanpa terdistraksi tugas baru.
              </p>

              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '9px 12px', marginTop: '10px' }}>
                <span style={{ fontSize: '11.5px', color: '#b91c1c', fontWeight: 600, display: 'block', lineHeight: 1.4 }}>
                  ⚠️ Perhatian: Sekali dikunci, komitmen hari ini TIDAK DAPAT diubah atau dibuka kembali. Anda hanya dapat melihat rincian, menyelesaikannya, dan menjalankan stopwatch timer.
                </span>
              </div>

              <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Daftar Tugas yang Dikomitmenkan:</span>
                <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px', fontSize: '12px', color: '#0f172a' }}>
                  {todayTasks.map((t) => (
                    <li key={t.id} style={{ marginBottom: '2px' }}>{t.title}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pilah-modal-footer" style={{ gap: '8px' }}>
              <button
                type="button"
                className="fast-desc-hide-btn"
                onClick={() => setShowCommitModal(false)}
                style={{ padding: '7px 14px' }}
              >
                Batal
              </button>
              <button
                type="button"
                className="modal-btn-confirm"
                onClick={handleConfirmCommit}
                style={{ background: '#d97706', color: '#ffffff' }}
              >
                Ya, Kunci Komitmen! 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Tip Filosofi Rule of 5 */}
      <div className="today-philosophy-card">
        <div className="philosophy-icon">💡</div>
        <div className="philosophy-text">
          <strong>Mengapa hanya 5 tugas?</strong> Batasan 5 tugas harian (Metode Ivy Lee & Rule of 5)
          melatih otak memprioritaskan yang bernilai tinggi tanpa terjebak kelelahan mental (*decision fatigue*).
        </div>
      </div>
    </div>
  );
};
