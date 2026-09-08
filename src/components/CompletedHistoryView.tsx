'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Clock,
  Sparkles,
  Inbox,
} from 'lucide-react';
import { formatReceivedTime } from '../data/seedTasks';

export const CompletedHistoryView: React.FC = () => {
  const router = useRouter();
  const {
    tasks,
    toggleTaskStatus,
    deleteTask,
    clearAllCompletedTasks,
    showToast,
  } = useTask();

  const [historySearchQuery, setHistorySearchQuery] = useState('');

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
    showToast(`"${title}" dikembalikan ke Inbox aktif`);
  };

  // Fitur hapus tugas selesai individual
  const handleDeleteTask = (e: React.MouseEvent, taskId: string, title: string) => {
    e.stopPropagation();
    if (window.confirm(`Hapus permanen tugas "${title}" dari riwayat?`)) {
      deleteTask(taskId);
      showToast('Tugas berhasil dihapus');
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
      showToast('Seluruh riwayat tugas selesai telah dibersihkan');
    }
  };

  return (
    <div className="completed-history-page-container">
      {/* 1. Header Navigasi Halaman Riwayat */}
      <header className="page-subnav-header">
        <button
          type="button"
          className="btn-subnav-back"
          onClick={() => router.back()}
          title="Kembali ke menu sebelumnya"
        >
          <ArrowLeft size={18} />
          <span>Kembali</span>
        </button>
        <div className="subnav-title-group">
          <h2 className="subnav-page-title">Riwayat Selesai</h2>
          <span className="subnav-badge-caption">{completedTasks.length} tugas tuntas</span>
        </div>
        {completedTasks.length > 0 ? (
          <button
            type="button"
            className="btn-subnav-clear"
            onClick={handleClearAll}
            title="Bersihkan seluruh riwayat selesai"
          >
            <Trash2 size={14} />
            <span>Bersihkan</span>
          </button>
        ) : (
          <div style={{ width: 60 }} />
        )}
      </header>

      <div className="completed-history-content">
        {/* 2. Kartu Ringkasan Pencapaian Bersih */}
        <div className="history-clean-hero">
          <div className="history-hero-badge">
            <Trophy size={15} className="trophy-gold" />
            <span>Pencapaian Produktivitas</span>
          </div>
          <div className="history-hero-stats-row">
            <div className="history-hero-stat">
              <span className="hero-stat-num">{completedTasks.length}</span>
              <span className="hero-stat-label">Tugas Tuntas</span>
            </div>
            <div className="history-hero-divider" />
            <div className="history-hero-stat">
              <span className="hero-stat-num">{completionRate}%</span>
              <span className="hero-stat-label">Penyelesaian</span>
            </div>
          </div>
          <p className="history-hero-info">
            Tugas yang diselesaikan di menu Inbox atau Today otomatis tersimpan rapi di sini agar ruang kerja harian Anda tetap fokus.
          </p>
        </div>

        {/* 3. Baris Pencarian Sederhana */}
        {completedTasks.length > 0 && (
          <div className="history-search-bar-wrap">
            <Search size={15} className="history-search-icon" />
            <input
              type="text"
              className="history-search-input"
              placeholder="Cari tugas yang sudah selesai..."
              value={historySearchQuery}
              onChange={(e) => setHistorySearchQuery(e.target.value)}
            />
            {historySearchQuery && (
              <button
                type="button"
                className="btn-history-clear-search"
                onClick={() => setHistorySearchQuery('')}
              >
                Batal
              </button>
            )}
          </div>
        )}

        {/* 4. Daftar Tugas Selesai (Unboxed Flat Rows) */}
        {completedTasks.length === 0 ? (
          <div className="history-empty-clean">
            <div className="history-empty-icon">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="history-empty-title">Belum Ada Tugas Selesai</h3>
            <p className="history-empty-desc">
              Selesaikan tugas di menu Inbox atau Today, maka catatan riwayat akan muncul rapi di halaman ini.
            </p>
            <button
              type="button"
              className="btn-go-inbox"
              onClick={() => router.push('/inbox')}
            >
              <Inbox size={14} />
              <span>Buka Inbox Tugas</span>
            </button>
          </div>
        ) : filteredCompleted.length === 0 ? (
          <div className="history-empty-clean">
            <p className="history-empty-desc">
              Tidak ditemukan tugas selesai dengan kata kunci &quot;{historySearchQuery}&quot;.
            </p>
            <button
              type="button"
              className="btn-history-reset-search"
              onClick={() => setHistorySearchQuery('')}
            >
              Reset Pencarian
            </button>
          </div>
        ) : (
          <div className="history-flat-list">
            {filteredCompleted.map((task) => (
              <div key={task.id} className="history-flat-row">
                <div className="history-row-check">
                  <CheckCheck size={16} strokeWidth={2.6} />
                </div>

                <div className="history-row-content">
                  <div className="history-row-title">{task.title}</div>
                  {task.description && (
                    <div className="history-row-desc">{task.description}</div>
                  )}
                  <div className="history-row-meta">
                    {task.category && (
                      <span className="history-meta-chip">#{task.category}</span>
                    )}
                    {task.completedAt ? (
                      <span className="history-meta-text">
                        <Clock size={11} /> Selesai: {formatReceivedTime(task.completedAt)}
                      </span>
                    ) : task.dueDate ? (
                      <span className="history-meta-text">
                        <Calendar size={11} /> Batas: {task.dueDate}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="history-row-actions">
                  <button
                    type="button"
                    className="btn-row-restore"
                    onClick={() => handleRestore(task.id, task.title)}
                    title="Kembalikan ke Inbox"
                  >
                    <RotateCcw size={13} />
                    <span>Kembalikan</span>
                  </button>
                  <button
                    type="button"
                    className="btn-row-delete"
                    onClick={(e) => handleDeleteTask(e, task.id, task.title)}
                    title="Hapus permanen"
                    aria-label={`Hapus ${task.title}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
