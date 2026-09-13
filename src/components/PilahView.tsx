'use client';

import React, { useState, useMemo } from 'react';
import { useTask } from '../context/TaskContext';
import { Task, TaskAnalysisItem } from '../types/task';
import { AISettingsModal } from './AISettingsModal';
import {
  ListFilter,
  Sparkles,
  Loader2,
  RotateCcw,
  Clock,
  Scale,
  Target,
  Star,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Settings,
  X,
  Info,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

type ReasonModalType = 'goal' | 'weight' | 'duration' | null;

interface ActiveReasonModal {
  type: ReasonModalType;
  item: TaskAnalysisItem;
  task: Task;
}

export const PilahView: React.FC = () => {
  const {
    tasks,
    todayTasks,
    aiAnalysis,
    isAnalyzingAI,
    runTaskAnalysis,
    toggleTodayTask,
    toggleTaskStatus,
    userGoal,
    showToast,
  } = useTask();

  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'tugas' | 'kegiatan' | 'pengingat'>('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Modal State untuk melihat alasan skor / durasi
  const [activeModal, setActiveModal] = useState<ActiveReasonModal | null>(null);

  // Hanya memilah tugas aktif dari Inbox (belum selesai)
  const activeInboxTasks = useMemo(() => {
    return tasks.filter((t) => !t.isCompleted);
  }, [tasks]);

  // Filter pencarian dan kategori
  const filteredInboxTasks = useMemo(() => {
    return activeInboxTasks.filter((task) => {
      if (typeFilter !== 'all' && task.inboxType !== typeFilter) {
        return false;
      }
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }
      return true;
    });
  }, [activeInboxTasks, typeFilter, searchFilter]);

  // Format tanggal pendek
  const formatReadableDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length < 3) return dateStr;
      const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  // Helper mendapatkan analisis per task
  const getTaskAnalysis = (taskId: string): TaskAnalysisItem | undefined => {
    if (!aiAnalysis?.tasksAnalysis) return undefined;
    return aiAnalysis.tasksAnalysis.find((a) => a.taskId === taskId);
  };

  // Format ringkas durasi estimasi (contoh: "45 menit" -> "45m", "2 jam" -> "2j")
  const formatCompactDuration = (durationStr?: string): string => {
    if (!durationStr) return '30m';
    const s = durationStr.toLowerCase();
    if (s.includes('menit')) {
      const num = s.replace(/[^0-9]/g, '');
      return num ? `${num}m` : durationStr;
    }
    if (s.includes('jam')) {
      const num = s.replace(/[^0-9.]/g, '');
      return num ? `${num}j` : durationStr;
    }
    return durationStr;
  };

  return (
    <div className="pilah-view-container animate-fade-in">
      {/* 1. Header Menu Pilah */}
      <div className="pilah-clean-header">
        <div className="pilah-header-lead">
          <div className="pilah-icon-badge">
            <ListFilter size={18} />
          </div>
          <div className="pilah-header-texts">
            <div className="pilah-title-row">
              <h2 className="pilah-heading">Pilah Inbox & Rekomendasi Today</h2>
              <button
                type="button"
                className="ai-header-setting-icon-btn"
                onClick={() => setIsSettingsOpen(true)}
                title="Pengaturan Model AI & Mode Offline"
                aria-label="Pengaturan AI"
              >
                <Settings size={15} />
              </button>
            </div>
            <p className="pilah-subheading">
              Analisis cerdas tugas Inbox untuk menentukan 5 prioritas utama yang diselesaikan hari ini.
            </p>
          </div>
        </div>

        {/* Status Bar Today & Tombol Analisis */}
        <div className="pilah-action-bar">
          <div className="pilah-today-status-chip">
            <Star size={13} className="text-amber" fill="#f59e0b" />
            <span>Fokus Today: <strong>{todayTasks.filter((t) => !t.isCompleted).length}/5</strong></span>
          </div>

          <button
            type="button"
            className="pilah-btn-analyze"
            onClick={runTaskAnalysis}
            disabled={isAnalyzingAI}
            title="Jalankan evaluasi analisis cerdas untuk tugas-tugas Inbox"
          >
            {isAnalyzingAI ? (
              <>
                <Loader2 size={13} className="spin" />
                <span>Menganalisis...</span>
              </>
            ) : aiAnalysis ? (
              <>
                <RotateCcw size={13} />
                <span>Perbarui Analisis</span>
              </>
            ) : (
              <>
                <Sparkles size={13} />
                <span>Mulai Analisis</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Filter Tab Ringkas */}
      <div className="pilah-filter-bar">
        <button
          type="button"
          className={`pilah-filter-btn ${typeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setTypeFilter('all')}
        >
          Semua ({activeInboxTasks.length})
        </button>
        <button
          type="button"
          className={`pilah-filter-btn ${typeFilter === 'tugas' ? 'active' : ''}`}
          onClick={() => setTypeFilter('tugas')}
        >
          Tugas ({activeInboxTasks.filter((t) => t.inboxType === 'tugas').length})
        </button>
        <button
          type="button"
          className={`pilah-filter-btn ${typeFilter === 'kegiatan' ? 'active' : ''}`}
          onClick={() => setTypeFilter('kegiatan')}
        >
          Acara ({activeInboxTasks.filter((t) => t.inboxType === 'kegiatan').length})
        </button>
        <button
          type="button"
          className={`pilah-filter-btn ${typeFilter === 'pengingat' ? 'active' : ''}`}
          onClick={() => setTypeFilter('pengingat')}
        >
          Pengingat ({activeInboxTasks.filter((t) => t.inboxType === 'pengingat').length})
        </button>
      </div>

      {/* 3. Daftar Tugas Inbox dengan Analisis Independen */}
      {filteredInboxTasks.length === 0 ? (
        <div className="pilah-empty-state">
          <CheckCircle2 size={32} className="text-emerald" />
          <h3 className="pilah-empty-title">Inbox Bersih & Tertata</h3>
          <p className="pilah-empty-desc">
            Tidak ada item aktif di Inbox saat ini. Seluruh tugas telah selesai atau telah dipilih ke Today.
          </p>
        </div>
      ) : (
        <div className="pilah-tasks-list">
          {filteredInboxTasks.map((task) => {
            const analysis = getTaskAnalysis(task.id);
            const isToday = Boolean(task.isToday);

            // Default fallback calculation jika belum dianalisis
            const goalScore = analysis?.goalAlignmentScore ?? 45;
            const weightScore = analysis?.weightScore ?? 50;
            const compactDuration = formatCompactDuration(analysis?.estimatedDuration || task.estimatedTime);
            const generalReason = analysis?.reason || 'Item inbox siap dievaluasi untuk pengerjaan harian Anda.';

            // Tentukan style score kesesuaian goal (-100 s/d +100)
            const isGoalPositive = goalScore > 20;
            const isGoalNegative = goalScore < 0;
            const goalDisplay = goalScore > 0 ? `+${goalScore}` : `${goalScore}`;

            // Tentukan style score bobot (0 s/d 100)
            const isWeightHeavy = weightScore >= 75;
            const isWeightLight = weightScore <= 40;

            const todayDateStr = (() => {
              const d = new Date();
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              return `${y}-${m}-${day}`;
            })();
            const taskDate = task.startDate || task.dueDate;
            const isNotToday = Boolean(taskDate && taskDate !== todayDateStr);

            return (
              <div
                key={task.id}
                className={`pilah-task-card ${isToday ? 'is-selected-today' : ''}`}
              >
                {/* Header Kartu: Checkbox, Judul, Kategori & Tombol Today */}
                <div className="pilah-card-header">
                  <button
                    type="button"
                    className="pilah-checkbox-btn"
                    onClick={() => toggleTaskStatus(task.id)}
                    title="Tandai selesai"
                  >
                    <div className="pilah-circle-ring" />
                  </button>

                  <div className="pilah-title-wrap">
                    <div className="pilah-tag-row">
                      <span className={`pilah-type-badge ${task.inboxType || 'tugas'}`}>
                        {task.inboxType === 'kegiatan' ? 'Acara' : task.inboxType === 'pengingat' ? 'Pengingat' : 'Tugas'}
                      </span>
                      {task.priority === 'high' && (
                        <span className="pilah-prio-badge high">Prioritas Tinggi</span>
                      )}
                      {(task.dueDate || task.startDate) && (
                        <span className="pilah-date-badge">
                          <Calendar size={10} />
                          <span>{formatReadableDate(task.dueDate || task.startDate)}</span>
                          {task.startTime && <span> {task.startTime}</span>}
                        </span>
                      )}
                    </div>
                    <h3 className="pilah-task-title">{task.title}</h3>
                  </div>

                  {/* Tombol Pilih / Hapus dari Today (Maks 5) */}
                  <button
                    type="button"
                    className={`pilah-today-toggle-btn ${isToday ? 'active' : ''} ${isNotToday ? 'disabled-event' : ''}`}
                    onClick={() => {
                      if (isNotToday && !isToday) {
                        showToast(`Item terjadwal pada ${formatReadableDate(taskDate)}. Hanya item hari ini yang bisa masuk ke Today.`);
                        return;
                      }
                      toggleTodayTask(task.id);
                    }}
                    title={
                      isNotToday && !isToday
                        ? `Terjadwal untuk ${formatReadableDate(taskDate)} (hanya item hari ini yang bisa masuk ke Today)`
                        : isToday
                        ? 'Keluarkan dari Today'
                        : 'Pilih masuk ke fokus Today'
                    }
                  >
                    <Star
                      size={15}
                      fill={isToday ? '#f59e0b' : 'none'}
                      color={isNotToday && !isToday ? '#cbd5e1' : isToday ? '#d97706' : '#94a3b8'}
                    />
                    <span className="today-btn-label">{isToday ? 'Di Today' : '+ Today'}</span>
                  </button>
                </div>

                {/* 4. Deskripsi Penilaian Umum Langsung di Bawah Tugas */}
                <div className="pilah-general-reason-box">
                  <p className="pilah-general-reason-text">
                    {generalReason}
                  </p>
                </div>

                {/* Bagian Skor dan Durasi: HANYA ICON DAN NILAI SAJA AGAR RINGKAS */}
                <div className="pilah-compact-scores-row">
                  {/* 1. Skor Kesesuaian Goal Pengguna (-100 s/d +100) */}
                  <button
                    type="button"
                    className={`pilah-compact-chip goal-chip ${
                      isGoalPositive ? 'positive' : isGoalNegative ? 'negative' : 'neutral'
                    }`}
                    onClick={() => {
                      if (!analysis) {
                        showToast('Klik "Mulai Analisis" untuk evaluasi cerdas lengkap!');
                        return;
                      }
                      setActiveModal({ type: 'goal', item: analysis, task });
                    }}
                    title={`Skor Goal: ${goalDisplay} (-100 s/d +100) • Klik untuk melihat alasan`}
                  >
                    <Target size={12} className="chip-icon" />
                    <span className="chip-val">{goalDisplay}</span>
                  </button>

                  {/* 2. Skor Bobot / Beban Penyelesaian (0 s/d 100) */}
                  <button
                    type="button"
                    className={`pilah-compact-chip weight-chip ${
                      isWeightHeavy ? 'heavy' : isWeightLight ? 'light' : 'medium'
                    }`}
                    onClick={() => {
                      if (!analysis) {
                        showToast('Klik "Mulai Analisis" untuk evaluasi cerdas lengkap!');
                        return;
                      }
                      setActiveModal({ type: 'weight', item: analysis, task });
                    }}
                    title={`Skor Bobot: ${weightScore}/100 • Klik untuk melihat alasan`}
                  >
                    <Scale size={12} className="chip-icon" />
                    <span className="chip-val">{weightScore}</span>
                  </button>

                  {/* 3. Estimasi Waktu Penyelesaian (Menit / Jam) */}
                  <button
                    type="button"
                    className="pilah-compact-chip duration-chip"
                    onClick={() => {
                      if (!analysis) {
                        showToast('Klik "Mulai Analisis" untuk evaluasi cerdas lengkap!');
                        return;
                      }
                      setActiveModal({ type: 'duration', item: analysis, task });
                    }}
                    title={`Estimasi Waktu: ${compactDuration} • Klik untuk melihat alasan`}
                  >
                    <Clock size={12} className="chip-icon" />
                    <span className="chip-val">{compactDuration}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL PENJELASAN ALASAN SKOR & DURASI */}
      {activeModal && (
        <div
          className="pilah-modal-overlay animate-fade-in"
          onClick={() => setActiveModal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="pilah-modal-card animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="pilah-modal-header">
              <div className="modal-header-lead">
                {activeModal.type === 'goal' && (
                  <div className="modal-icon-badge goal">
                    <Target size={16} />
                  </div>
                )}
                {activeModal.type === 'weight' && (
                  <div className="modal-icon-badge weight">
                    <Scale size={16} />
                  </div>
                )}
                {activeModal.type === 'duration' && (
                  <div className="modal-icon-badge duration">
                    <Clock size={16} />
                  </div>
                )}
                <div>
                  <h3 className="modal-title">
                    {activeModal.type === 'goal'
                      ? 'Kesesuaian Goal Pengguna'
                      : activeModal.type === 'weight'
                      ? 'Bobot & Beban Penyelesaian'
                      : 'Estimasi Waktu Penyelesaian'}
                  </h3>
                  <p className="modal-subtitle">{activeModal.task.title}</p>
                </div>
              </div>

              <button
                type="button"
                className="modal-btn-close"
                onClick={() => setActiveModal(null)}
                title="Tutup"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body Modal */}
            <div className="pilah-modal-body">
              {/* Highlight Metrik */}
              <div className="modal-metric-highlight">
                <span className="metric-caption">Nilai Evaluasi:</span>
                <span className="metric-score-value">
                  {activeModal.type === 'goal' && (
                    <span className={activeModal.item.goalAlignmentScore && activeModal.item.goalAlignmentScore > 0 ? 'text-emerald' : 'text-rose'}>
                      {activeModal.item.goalAlignmentScore && activeModal.item.goalAlignmentScore > 0
                        ? `+${activeModal.item.goalAlignmentScore}`
                        : activeModal.item.goalAlignmentScore ?? 0}{' '}
                      <small className="metric-scale-text">(Skala -100 s/d +100)</small>
                    </span>
                  )}
                  {activeModal.type === 'weight' && (
                    <span>
                      {activeModal.item.weightScore ?? 50}/100{' '}
                      <small className="metric-scale-text">
                        ({(activeModal.item.weightScore ?? 50) >= 75 ? 'Tinggi / Berat' : (activeModal.item.weightScore ?? 50) <= 40 ? 'Ringan' : 'Sedang'})
                      </small>
                    </span>
                  )}
                  {activeModal.type === 'duration' && (
                    <span>
                      {activeModal.item.estimatedDuration || '30 menit'}
                    </span>
                  )}
                </span>
              </div>

              {/* Detail Alasan */}
              <div className="modal-reason-box">
                <span className="reason-box-label">
                  <Info size={12} /> Alasan Penilaian AI:
                </span>
                <p className="reason-box-content">
                  {activeModal.type === 'goal' &&
                    (activeModal.item.goalAlignmentReason ||
                      'Tugas ini dianalisis dampaknya terhadap fokus utama dan target produktivitas hidup Anda.')}
                  {activeModal.type === 'weight' &&
                    (activeModal.item.weightReason ||
                      'Skor bobot dihitung berdasarkan kombinasi tingkat prioritas, kompleksitas kognitif, dan batasan waktu.')}
                  {activeModal.type === 'duration' &&
                    (activeModal.item.estimatedDurationReason ||
                      'Estimasi durasi ini mempertimbangkan beban pengerjaan optimal dan sub-tugas yang perlu diselesaikan.')}
                </p>
              </div>

              {/* Sasaran Hidup User jika modal goal */}
              {activeModal.type === 'goal' && userGoal && (
                <div className="modal-goal-context-box">
                  <span className="context-label">🎯 Sasaran Hidup Anda:</span>
                  <p className="context-text">"{userGoal}"</p>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="pilah-modal-footer">
              <button
                type="button"
                className="modal-btn-confirm"
                onClick={() => setActiveModal(null)}
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Setting AI */}
      <AISettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={() => {
          showToast('Pengaturan AI berhasil diperbarui');
        }}
        showToast={showToast}
      />
    </div>
  );
};
