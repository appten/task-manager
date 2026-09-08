'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

export const TodayView: React.FC = () => {
  const { todayTasks, setActiveTab } = useTask();

  // State untuk membuka view Riwayat Today
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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
            <span>Fokus Harian (Rule of 5)</span>
          </div>

          <div className="today-header-right-actions">
            <span className="today-date-text">{todayFormatted}</span>
            <button
              type="button"
              className="btn-today-history-icon"
              onClick={() => setIsHistoryOpen(true)}
              title="Lihat Log Riwayat Today"
            >
              <History size={14} />
              <span>Riwayat</span>
            </button>
          </div>
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
            onClick={() => setActiveTab('inbox')}
          >
            <Inbox size={13} />
            <span>Kelola di Inbox</span>
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
                  />
                );
              }

              // Slot Kosong Bersih & Rapi
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
