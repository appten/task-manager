'use client';

import React, { useEffect, useState } from 'react';
import { useTask } from '../context/TaskContext';
import { Task } from '../types/task';
import { formatReceivedTime } from '../data/seedTasks';
import {
  X,
  CheckCircle2,
  Calendar,
  Clock,
  Pencil,
  Trash2,
  Star,
  CheckSquare,
  Repeat,
  Sparkles,
  FileText,
  Tag,
  Lock,
  Check,
  Play,
  Pause,
  Square,
} from 'lucide-react';

export const TaskDetailModal: React.FC = () => {
  const {
    tasks,
    viewingTask,
    setViewingTask,
    setEditingTask,
    toggleTaskStatus,
    toggleSubTaskStatus,
    toggleTodayTask,
    deleteTask,
    startTaskTimer,
    pauseTaskTimer,
    stopTaskTimer,
    showToast,
  } = useTask();

  // Sinkronkan state task dengan tasks di context jika ada pembaruan (misal toggle subtask)
  const currentTask = viewingTask ? tasks.find((t) => t.id === viewingTask.id) || viewingTask : null;

  // Cek apakah komitmen Today hari ini sedang aktif
  const [isTodayCommitted, setIsTodayCommitted] = useState(false);
  useEffect(() => {
    try {
      const todayKey = new Date().toISOString().slice(0, 10);
      const committed = localStorage.getItem(`ten_today_committed_${todayKey}`);
      setIsTodayCommitted(committed === 'true');
    } catch {}
  }, [viewingTask]);

  if (!currentTask) return null;

  const isTaskLockedInToday = isTodayCommitted && currentTask.isToday;

  // Live Stopwatch State untuk Perekaman Waktu Pengerjaan
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState<number>(() => {
    const base = currentTask.timeSpentSeconds || 0;
    if (currentTask.isTimerRunning && currentTask.timerStartedAt) {
      const currentSession = Math.max(
        0,
        Math.floor((Date.now() - new Date(currentTask.timerStartedAt).getTime()) / 1000)
      );
      return base + currentSession;
    }
    return base;
  });

  useEffect(() => {
    if (!currentTask.isTimerRunning || !currentTask.timerStartedAt) {
      setLiveElapsedSeconds(currentTask.timeSpentSeconds || 0);
      return;
    }

    const updateTimer = () => {
      const base = currentTask.timeSpentSeconds || 0;
      const currentSession = Math.max(
        0,
        Math.floor((Date.now() - new Date(currentTask.timerStartedAt!).getTime()) / 1000)
      );
      setLiveElapsedSeconds(base + currentSession);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentTask.isTimerRunning, currentTask.timerStartedAt, currentTask.timeSpentSeconds]);

  const formatStopwatchDigits = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  const handleEdit = () => {
    if (isTaskLockedInToday) {
      showToast('Tugas ini terkunci dalam Komitmen Today dan tidak dapat diedit saat ini.');
      return;
    }
    const taskToEdit = currentTask;
    setViewingTask(null);
    setEditingTask(taskToEdit);
  };

  const handleDelete = () => {
    if (isTaskLockedInToday) {
      showToast('Tugas ini terkunci dalam Komitmen Today dan tidak dapat dihapus saat ini.');
      return;
    }
    if (window.confirm(`Hapus tugas "${currentTask.title}"?`)) {
      deleteTask(currentTask.id);
      setViewingTask(null);
      showToast('Tugas berhasil dihapus');
    }
  };

  const handleToggleToday = () => {
    if (isTaskLockedInToday) {
      showToast('Komitmen Today terkunci, tidak dapat menghapus tugas dari Today.');
      return;
    }
    const success = toggleTodayTask(currentTask.id);
    if (success && !currentTask.isToday) {
      showToast('Tugas berhasil ditambahkan ke Today ⭐');
    } else if (currentTask.isToday) {
      showToast('Tugas dilepas dari Today');
    }
  };

  const formatRecordedDuration = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    if (hours > 0) return `${hours} jam ${minutes} menit`;
    if (minutes > 0) return `${minutes} menit ${seconds} dtk`;
    return `${seconds} detik`;
  };

  const getPriorityLabel = (p: string) => {
    switch (p) {
      case 'high':
        return { text: 'Tinggi (P1)', color: '#ef4444', bg: '#fef2f2' };
      case 'medium':
        return { text: 'Sedang (P2)', color: '#f59e0b', bg: '#fffbeb' };
      case 'low':
      default:
        return { text: 'Rendah (P3)', color: '#10b981', bg: '#f0fdf4' };
    }
  };

  const getRecurrenceLabel = (r?: string) => {
    switch (r) {
      case 'daily':
        return 'Setiap Hari';
      case 'weekdays':
        return 'Senin - Jumat (Hari Kerja)';
      case 'weekly':
        return 'Setiap Minggu';
      case 'monthly':
        return 'Setiap Bulan';
      default:
        return 'Tidak Berulang';
    }
  };

  const priorityMeta = getPriorityLabel(currentTask.priority);

  return (
    <div className="modal-overlay" onClick={() => setViewingTask(null)}>
      <div
        className="modal-container task-detail-modal animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}
        role="dialog"
        aria-modal="true"
        aria-label={`Rincian Tugas: ${currentTask.title}`}
      >
        {/* 1. Header Rincian */}
        <div className="modal-header task-detail-header">
          <div className="detail-badge-group">
            <span className={`detail-type-badge ${currentTask.inboxType || 'tugas'}`}>
              {currentTask.inboxType === 'rutinitas'
                ? '🔄 Rutinitas'
                : currentTask.inboxType === 'kegiatan'
                ? '📅 Acara'
                : currentTask.inboxType === 'pengingat'
                ? '⏰ Pengingat'
                : '📝 Tugas'}
            </span>
            <span
              className="detail-priority-badge"
              style={{ color: priorityMeta.color, background: priorityMeta.bg }}
            >
              {priorityMeta.text}
            </span>
            {currentTask.isToday && (
              <span className="detail-today-badge">
                <Star size={11} fill="#f59e0b" color="#f59e0b" />
                <span>Today</span>
              </span>
            )}
            {isTaskLockedInToday && (
              <span className="detail-locked-badge" title="Terkunci dalam Komitmen Today">
                <Lock size={11} />
                <span>Terkunci</span>
              </span>
            )}
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={() => setViewingTask(null)}
            aria-label="Tutup rincian"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. Judul & Status Tugas */}
        <div className="detail-title-section">
          <div className="detail-title-row">
            <button
              type="button"
              className={`detail-status-checkbox ${currentTask.isCompleted ? 'checked' : ''}`}
              onClick={() => toggleTaskStatus(currentTask.id)}
              title={currentTask.isCompleted ? 'Tandai belum selesai' : 'Tandai selesai'}
            >
              {currentTask.isCompleted && <Check size={14} strokeWidth={3} />}
            </button>
            <h2 className={`detail-main-title ${currentTask.isCompleted ? 'completed-title' : ''}`}>
              {currentTask.title}
            </h2>
          </div>
          {currentTask.isCompleted && (
            <div className="detail-completed-notice">
              <CheckCircle2 size={13} color="#16a34a" />
              <span>
                Telah diselesaikan
                {currentTask.completedAt ? ` pada ${formatReceivedTime(currentTask.completedAt)}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* 3. Daftar Rincian (List-list Bersih) */}
        <div className="detail-list-container">
          {/* Deskripsi / Keterangan */}
          {currentTask.description && (
            <div className="detail-item-row">
              <div className="detail-item-icon">
                <FileText size={15} />
              </div>
              <div className="detail-item-content">
                <span className="detail-item-label">Keterangan / Deskripsi</span>
                <p className="detail-item-text-body">{currentTask.description}</p>
              </div>
            </div>
          )}

          {/* Jadwal & Waktu */}
          <div className="detail-item-row">
            <div className="detail-item-icon">
              <Calendar size={15} />
            </div>
            <div className="detail-item-content">
              <span className="detail-item-label">Jadwal & Batas Waktu</span>
              <div className="detail-time-grid">
                {currentTask.startDate || currentTask.startTime ? (
                  <div className="detail-time-slot">
                    <span className="time-slot-tag">Mulai</span>
                    <span className="time-slot-value">
                      {currentTask.startDate ? currentTask.startDate : 'Hari ini'}{' '}
                      {currentTask.startTime ? `• ${currentTask.startTime}` : ''}
                    </span>
                  </div>
                ) : null}

                {currentTask.endDate || currentTask.endTime ? (
                  <div className="detail-time-slot">
                    <span className="time-slot-tag">Selesai</span>
                    <span className="time-slot-value">
                      {currentTask.endDate ? currentTask.endDate : currentTask.dueDate}{' '}
                      {currentTask.endTime ? `• ${currentTask.endTime}` : ''}
                    </span>
                  </div>
                ) : null}

                <div className="detail-time-slot">
                  <span className="time-slot-tag">Batas Akhir</span>
                  <span className="time-slot-value">
                    {currentTask.dueDate} {currentTask.dueTime ? `• ${currentTask.dueTime}` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Pengulangan */}
          {currentTask.recurrence && currentTask.recurrence !== 'none' && (
            <div className="detail-item-row">
              <div className="detail-item-icon">
                <Repeat size={15} />
              </div>
              <div className="detail-item-content">
                <span className="detail-item-label">Pengulangan</span>
                <span className="detail-item-val">{getRecurrenceLabel(currentTask.recurrence)}</span>
              </div>
            </div>
          )}

          {/* Kategori */}
          {currentTask.category && (
            <div className="detail-item-row">
              <div className="detail-item-icon">
                <Tag size={15} />
              </div>
              <div className="detail-item-content">
                <span className="detail-item-label">Kategori</span>
                <span className="detail-item-pill">#{currentTask.category}</span>
              </div>
            </div>
          )}

          {/* Perekaman Waktu Pengerjaan (Stopwatch Interaktif) */}
          <div className="detail-item-row detail-stopwatch-row">
            <div className="detail-item-icon text-indigo-500">
              <Clock size={15} />
            </div>
            <div className="detail-item-content" style={{ width: '100%' }}>
              <div className="detail-stopwatch-header">
                <span className="detail-item-label">Catatan Waktu & Stopwatch Pengerjaan</span>
                {currentTask.isTimerRunning && (
                  <span className="detail-timer-live-badge animate-pulse">Sedang Merekam</span>
                )}
              </div>

              <div className="detail-stopwatch-widget">
                <div className="stopwatch-digits-display">
                  <span className="stopwatch-digits">{formatStopwatchDigits(liveElapsedSeconds)}</span>
                  {currentTask.estimatedTime && (
                    <span className="stopwatch-estimate-tag">Estimasi: {currentTask.estimatedTime}</span>
                  )}
                </div>

                <div className="stopwatch-buttons-group">
                  {currentTask.isTimerRunning ? (
                    <>
                      <button
                        type="button"
                        className="btn-timer-action pause"
                        onClick={() => pauseTaskTimer(currentTask.id)}
                        title="Jeda perekaman waktu"
                      >
                        <Pause size={13} fill="currentColor" />
                        <span>Jeda</span>
                      </button>
                      <button
                        type="button"
                        className="btn-timer-action stop"
                        onClick={() => stopTaskTimer(currentTask.id)}
                        title="Selesai dan simpan catatan waktu"
                      >
                        <Square size={13} fill="currentColor" />
                        <span>Simpan</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn-timer-action play"
                      onClick={() => startTaskTimer(currentTask.id)}
                      title="Mulai rekam waktu pengerjaan"
                    >
                      <Play size={13} fill="currentColor" />
                      <span>{liveElapsedSeconds > 0 ? 'Lanjutkan Record Time' : 'Mulai Record Time'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Catatan Penjadwalan AI */}
          {currentTask.schedulingNote && (
            <div className="detail-item-row ai-note-row">
              <div className="detail-item-icon text-indigo-500">
                <Sparkles size={15} />
              </div>
              <div className="detail-item-content">
                <span className="detail-item-label">Catatan Penjadwalan AI</span>
                <p className="detail-ai-note-text">{currentTask.schedulingNote}</p>
              </div>
            </div>
          )}

          {/* Daftar Sub-tugas (Interactive Checklist) */}
          <div className="detail-item-row">
            <div className="detail-item-icon">
              <CheckSquare size={15} />
            </div>
            <div className="detail-item-content" style={{ width: '100%' }}>
              <div className="subtasks-header-line">
                <span className="detail-item-label">
                  Sub-tugas ({currentTask.subTasks.filter((st) => st.isCompleted).length}/
                  {currentTask.subTasks.length})
                </span>
              </div>

              {currentTask.subTasks.length === 0 ? (
                <span className="empty-subtask-text">Belum ada rincian sub-tugas.</span>
              ) : (
                <div className="detail-subtasks-list">
                  {currentTask.subTasks.map((st) => (
                    <div
                      key={st.id}
                      className={`detail-subtask-item ${st.isCompleted ? 'completed' : ''}`}
                      onClick={() => toggleSubTaskStatus(currentTask.id, st.id)}
                      role="button"
                      tabIndex={0}
                    >
                      <button
                        type="button"
                        className={`mini-check-box ${st.isCompleted ? 'checked' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubTaskStatus(currentTask.id, st.id);
                        }}
                      >
                        {st.isCompleted && <Check size={11} strokeWidth={3} />}
                      </button>
                      <span className="subtask-item-title">{st.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. Footer Aksi */}
        <div className="modal-actions task-detail-actions">
          {/* Tombol Hapus */}
          <button
            type="button"
            className="btn-detail-action delete"
            onClick={handleDelete}
            disabled={isTaskLockedInToday}
            title={isTaskLockedInToday ? 'Terkunci dalam Komitmen Today' : 'Hapus tugas'}
          >
            <Trash2 size={14} />
            <span>Hapus</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Tombol + Today */}
            <button
              type="button"
              className={`btn-detail-action today-star ${currentTask.isToday ? 'active' : ''}`}
              onClick={handleToggleToday}
              disabled={isTaskLockedInToday}
              title={isTaskLockedInToday ? 'Terkunci dalam Komitmen Today' : 'Atur Today'}
            >
              <Star size={14} fill={currentTask.isToday ? '#f59e0b' : 'none'} color="#f59e0b" />
              <span>{currentTask.isToday ? 'Di Today' : '+ Today'}</span>
            </button>

            {/* Tombol Edit Tugas */}
            <button
              type="button"
              className="btn-detail-action edit-btn-highlight"
              onClick={handleEdit}
              disabled={isTaskLockedInToday}
              title={
                isTaskLockedInToday
                  ? 'Tugas terkunci dalam Komitmen Today dan tidak dapat diedit'
                  : 'Buka formulir edit tugas'
              }
            >
              <Pencil size={14} />
              <span>Edit Tugas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
