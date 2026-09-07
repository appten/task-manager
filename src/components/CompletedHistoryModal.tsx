'use client';

import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Trash2,
  Calendar,
  Search,
  CheckCheck,
  Trophy,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { formatReceivedTime } from '../data/seedTasks';

export const CompletedHistoryModal: React.FC = () => {
  const {
    tasks,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    toggleTaskStatus,
    deleteTask,
    clearAllCompletedTasks,
    showToast,
  } = useTask();

  const [historySearchQuery, setHistorySearchQuery] = useState('');

  if (!isHistoryModalOpen) return null;

  const completedTasks = tasks.filter((t) => t.isCompleted);
  const totalTasksCount = tasks.length;
  const completionRate =
    totalTasksCount > 0
      ? Math.round((completedTasks.length / totalTasksCount) * 100)
      : 0;

  // Filter pencarian di dalam riwayat
  const filteredCompleted = completedTasks.filter((task) => {
    if (!historySearchQuery.trim()) return true;
    const q = historySearchQuery.toLowerCase();
    const matchTitle = task.title.toLowerCase().includes(q);
    const matchDesc = task.description?.toLowerCase().includes(q);
    const matchCat = task.category?.toLowerCase().includes(q);
    const matchSub = task.subTasks.some((st) => st.title.toLowerCase().includes(q));
    return matchTitle || matchDesc || matchCat || matchSub;
  });

  // Fitur kembalikan tugas ke Inbox aktif
  const handleRestore = (taskId: string, title: string) => {
    toggleTaskStatus(taskId);
  };

  // Fitur hapus tugas selesai individual
  const handleDeleteTask = (e: React.MouseEvent, taskId: string, title: string) => {
    e.stopPropagation();
    if (window.confirm(`Hapus permanen tugas "${title}" dari riwayat?`)) {
      deleteTask(taskId);
      showToast('Tugas berhasil dihapus dari riwayat');
    }
  };

  // Fitur bersihkan seluruh riwayat tugas selesai
  const handleClearAll = () => {
    if (completedTasks.length === 0) return;
    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus SEMUA (${completedTasks.length}) tugas yang telah selesai? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      clearAllCompletedTasks();
    }
  };

  return (
    <div
      className="fullscreen-history-page"
      role="region"
      aria-label="Halaman Riwayat Tugas Selesai"
    >
      {/* 1. Header Halaman Riwayat Layar Penuh */}
      <header className="history-page-header">
        <button
          type="button"
          className="btn-history-back"
          onClick={() => setIsHistoryModalOpen(false)}
          title="Kembali ke tampilan utama"
          aria-label="Kembali"
        >
          <ArrowLeft size={20} />
          <span>Kembali</span>
        </button>

        <div className="history-header-center">
          <h1 className="history-page-title">Riwayat Tugas Selesai</h1>
          <span className="history-count-badge">
            {completedTasks.length} Selesai
          </span>
        </div>

        {completedTasks.length > 0 ? (
          <button
            type="button"
            className="btn-header-clear-all"
            onClick={handleClearAll}
            title="Bersihkan semua riwayat tugas selesai"
          >
            <Trash2 size={15} />
            <span>Bersihkan Semua</span>
          </button>
        ) : (
          <div style={{ width: '80px' }} />
        )}
      </header>

      {/* 2. Kartu Pencapaian Ringkas */}
      <div className="history-page-hero">
        <div className="hero-trophy-wrap">
          <Trophy size={22} className="trophy-gold" />
        </div>
        <div className="hero-text-wrap">
          <div className="hero-title">
            {completedTasks.length > 0
              ? `${completedTasks.length} Tugas Telah Dituntaskan`
              : 'Belum Ada Tugas yang Dituntaskan'}
          </div>
          <div className="hero-desc">
            {completedTasks.length > 0
              ? `Tingkat penyelesaian tugas: ${completionRate}% dari seluruh tugas yang pernah dicatat.`
              : 'Tugas yang dicentang selesai di Inbox akan berpindah ke sini secara otomatis.'}
          </div>
        </div>
      </div>

      {/* 3. Kolom Pencarian Riwayat */}
      {completedTasks.length > 0 && (
        <div className="history-page-search-section">
          <div className="android-search-bar history-full-search">
            <Search size={17} color="#64748b" />
            <input
              type="text"
              className="android-search-input"
              placeholder="Cari tugas di riwayat selesai..."
              value={historySearchQuery}
              onChange={(e) => setHistorySearchQuery(e.target.value)}
            />
            {historySearchQuery && (
              <button
                type="button"
                className="btn-cancel-search"
                onClick={() => setHistorySearchQuery('')}
              >
                Batal
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. Daftar Tugas Selesai (Scrollable) */}
      <main className="history-page-content">
        {completedTasks.length === 0 ? (
          <div className="empty-state history-fullscreen-empty">
            <div className="empty-icon-circle history-large-icon">
              <CheckCircle2 size={36} />
            </div>
            <div className="empty-title">Riwayat Masih Kosong</div>
            <p className="empty-desc">
              Ketika Anda menyelesaikan tugas di menu Inbox atau Today, tugas tersebut akan
              disimpan rapi di halaman ini agar Inbox Anda selalu fokus dan teratur.
            </p>
            <button
              type="button"
              className="btn-primary"
              style={{ maxWidth: '200px', marginTop: '16px' }}
              onClick={() => setIsHistoryModalOpen(false)}
            >
              Kembali ke Inbox
            </button>
          </div>
        ) : filteredCompleted.length === 0 ? (
          <div className="empty-state" style={{ marginTop: '24px' }}>
            <p className="empty-desc">
              Tidak ada tugas selesai yang cocok dengan &quot;{historySearchQuery}&quot;.
            </p>
            <button
              type="button"
              className="btn-secondary"
              style={{ marginTop: '10px' }}
              onClick={() => setHistorySearchQuery('')}
            >
              Reset Pencarian
            </button>
          </div>
        ) : (
          <div className="history-cards-container">
            {filteredCompleted.map((task) => (
              <div key={task.id} className="history-card-item">
                <div className="history-card-main">
                  {/* Status Centang Hijau */}
                  <div className="history-check-circle" title="Tugas selesai">
                    <CheckCheck size={16} strokeWidth={2.8} />
                  </div>

                  {/* Detail Konten Tugas */}
                  <div className="history-card-info">
                    <div className="history-card-title">{task.title}</div>
                    {task.description && (
                      <div className="history-card-desc">{task.description}</div>
                    )}

                    <div className="history-card-meta-row">
                      {task.category && (
                        <span className="history-pill-category">
                          #{task.category}
                        </span>
                      )}

                      <span className="history-meta-subitem">
                        <Calendar size={11} />
                        Batas: {task.dueDate}
                      </span>

                      {task.completedAt ? (
                        <span className="history-meta-subitem highlight-time">
                          <Clock size={11} />
                          Selesai: {formatReceivedTime(task.completedAt)}
                        </span>
                      ) : task.createdAt ? (
                        <span className="history-meta-subitem">
                          <Clock size={11} />
                          Diterima: {formatReceivedTime(task.createdAt).split(',')[0]}
                        </span>
                      ) : null}

                      {task.subTasks.length > 0 && (
                        <span className="history-meta-subitem">
                          {task.subTasks.filter((st) => st.isCompleted).length}/
                          {task.subTasks.length} subtask tuntas
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi: Kembalikan & Hapus */}
                <div className="history-card-actions">
                  <button
                    type="button"
                    className="btn-action-restore"
                    onClick={() => handleRestore(task.id, task.title)}
                    title="Kembalikan tugas ini ke Inbox aktif"
                  >
                    <RotateCcw size={13} />
                    <span>Kembalikan</span>
                  </button>

                  <button
                    type="button"
                    className="btn-action-delete"
                    onClick={(e) => handleDeleteTask(e, task.id, task.title)}
                    title="Hapus tugas ini secara permanen dari riwayat"
                    aria-label={`Hapus ${task.title}`}
                  >
                    <Trash2 size={15} />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
