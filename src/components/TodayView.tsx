'use client';

import React from 'react';
import { useTask } from '../context/TaskContext';
import { TaskCard } from './TaskCard';
import {
  Sun,
  PlusCircle,
  CheckCircle2,
  Sparkles,
  Inbox,
  ArrowRight,
  Target,
  Flame,
  Clock,
} from 'lucide-react';

export const TodayView: React.FC = () => {
  const { todayTasks, setActiveTab, tasks } = useTask();

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

  return (
    <div className="today-view-container">
      {/* Banner Header Today */}
      <div className="today-hero-card">
        <div className="today-hero-header">
          <div className="today-hero-badge">
            <Sun size={14} className="today-sun-icon" />
            <span>Fokus Harian (Rule of 5)</span>
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
            onClick={() => setActiveTab('inbox')}
          >
            <Inbox size={14} />
            <span>Kelola di Inbox</span>
            <ArrowRight size={12} />
          </button>
        </div>

        {todayTasks.length === 0 ? (
          /* Empty State jika belum ada tugas di Today */
          <div className="empty-state today-empty-state">
            <div className="empty-icon-circle today-empty-icon">
              <Sun size={32} />
            </div>
            <div className="empty-title">Belum Ada Tugas di Today</div>
            <p className="empty-desc">
              Pilih hingga 5 tugas dari Inbox yang ingin kamu selesaikan hari ini dengan menekan tombol{' '}
              <strong>⭐ + Today</strong> pada setiap kartu tugas.
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
          <div className="today-slots-list">
            {slots.map(({ slotNumber, task }) => {
              if (task) {
                return (
                  <div key={task.id} className="today-slot-item filled">
                    <TaskCard
                      task={task}
                      todayRank={slotNumber}
                      hideTodayToggle={false}
                    />
                  </div>
                );
              }

              // Slot Kosong
              return (
                <div
                  key={`empty-slot-${slotNumber}`}
                  className="today-empty-slot"
                  onClick={() => setActiveTab('inbox')}
                  role="button"
                  tabIndex={0}
                  title="Klik untuk memilih tugas dari Inbox"
                >
                  <div className="empty-slot-number">#{slotNumber}</div>
                  <div className="empty-slot-content">
                    <div className="empty-slot-title">Slot Kosong #{slotNumber}</div>
                    <div className="empty-slot-subtitle">
                      Pilih 1 tugas dari Inbox untuk mengisi fokus ini
                    </div>
                  </div>
                  <button type="button" className="btn-empty-slot-add">
                    <PlusCircle size={16} />
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
