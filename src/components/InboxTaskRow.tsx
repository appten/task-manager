'use client';

import React, { useState, useEffect } from 'react';
import { Task } from '../types/task';
import { useTask } from '../context/TaskContext';
import { generateSubTasksAndEstimateWithAI } from '../services/geminiService';
import {
  Check,
  Calendar,
  Clock,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  Sparkles,
  Loader2,
  MoreVertical,
  Star,
  Bell,
  CheckSquare,
  Repeat,
  Play,
  Pause,
  Square,
} from 'lucide-react';

interface InboxTaskRowProps {
  task: Task;
}

export const InboxTaskRow: React.FC<InboxTaskRowProps> = ({ task }) => {
  const {
    toggleTaskStatus,
    toggleSubTaskStatus,
    toggleTodayTask,
    startTaskTimer,
    pauseTaskTimer,
    stopTaskTimer,
    setEditingTask,
    deleteTask,
    addAISubTasksAndEstimate,
    userGoal,
    showToast,
  } = useTask();

  const [isSubtasksOpen, setIsSubtasksOpen] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Live Stopwatch State
  const [liveElapsedSeconds, setLiveElapsedSeconds] = useState<number>(() => {
    const base = task.timeSpentSeconds || 0;
    if (task.isTimerRunning && task.timerStartedAt) {
      const currentSession = Math.max(
        0,
        Math.floor((Date.now() - new Date(task.timerStartedAt).getTime()) / 1000)
      );
      return base + currentSession;
    }
    return base;
  });

  useEffect(() => {
    if (!task.isTimerRunning || !task.timerStartedAt) {
      setLiveElapsedSeconds(task.timeSpentSeconds || 0);
      return;
    }

    const updateTimer = () => {
      const base = task.timeSpentSeconds || 0;
      const currentSession = Math.max(
        0,
        Math.floor((Date.now() - new Date(task.timerStartedAt!).getTime()) / 1000)
      );
      setLiveElapsedSeconds(base + currentSession);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [task.isTimerRunning, task.timerStartedAt, task.timeSpentSeconds]);

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

  const formatRecordedDuration = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    if (hours > 0) return `${hours}j ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const completedSubtasksCount = task.subTasks.filter((st) => st.isCompleted).length;
  const totalSubtasksCount = task.subTasks.length;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (window.confirm(`Hapus item "${task.title}" dari Inbox?`)) {
      deleteTask(task.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    setEditingTask(task);
  };

  const handleGenerateAIWithEstimate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGeneratingAI) return;
    setIsGeneratingAI(true);

    try {
      const existingSubTitles = (task.subTasks || []).map((st) => st.title);
      const res = await generateSubTasksAndEstimateWithAI(
        task.title,
        task.description,
        existingSubTitles,
        userGoal
      );
      if (res && res.subTasks && res.subTasks.length > 0) {
        addAISubTasksAndEstimate(
          task.id,
          res.subTasks,
          res.estimatedTime,
          res.goalAlignmentScore,
          res.goalAlignmentReason
        );
        setIsSubtasksOpen(true);
        showToast('Sub-tugas berhasil dibuat oleh AI! ✨');
      } else {
        showToast('AI tidak menghasilkan sub-tugas baru.');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Gagal memproses AI. Periksa koneksi.');
    } finally {
      setIsGeneratingAI(false);
      setIsMenuOpen(false);
    }
  };

  const formatReadableDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-');
      const target = new Date(Number(y), Number(m) - 1, Number(d));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      target.setHours(0, 0, 0, 0);

      const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Hari ini';
      if (diffDays === 1) return 'Besok';
      if (diffDays === -1) return 'Kemarin';

      return target.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  const todayDateStr = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();

  const taskDate = task.startDate || task.dueDate;
  const isScheduledEventNotToday =
    task.inboxType === 'kegiatan' &&
    Boolean(task.startTime || task.endTime || task.dueTime) &&
    Boolean(taskDate && taskDate !== todayDateStr);

  return (
    <div
      className={`inbox-task-row ${task.isCompleted ? 'completed' : ''} ${
        task.isToday ? 'today-active' : ''
      } ${task.isTimerRunning ? 'timer-active' : ''} ${isMenuOpen ? 'is-menu-open' : ''}`}
    >
      {/* 1. Baris Utama (Main Row) */}
      <div className="inbox-row-main">
        {/* Tombol Checkbox Lingkaran Minimalis */}
        <button
          type="button"
          className={`inbox-circle-checkbox ${task.isCompleted ? 'checked' : ''}`}
          onClick={() => toggleTaskStatus(task.id)}
          aria-label={task.isCompleted ? 'Tandai belum selesai' : 'Tandai selesai'}
        >
          {task.isCompleted && <Check size={11} strokeWidth={3} />}
        </button>

        {/* Konten Judul & Metadata */}
        <div className="inbox-row-content">
          <div
            className={`inbox-row-title ${task.isCompleted ? 'title-done' : ''}`}
            onClick={() => {
              if (totalSubtasksCount > 0) setIsSubtasksOpen((prev) => !prev);
              else if (task.description) setShowDesc((prev) => !prev);
              else setEditingTask(task);
            }}
          >
            {task.title}
          </div>

          {/* Baris Keterangan / Metadata yang Sangat Minimalis & Bersih */}
          <div className="inbox-row-meta">
            {/* Indikator Tipe: Ikon Halus (Acara / Pengingat) */}
            {task.inboxType === 'kegiatan' && (
              <span className="inbox-meta-badge kegiatan" title="Kegiatan / Acara">
                <Calendar size={11} />
                <span>Acara</span>
              </span>
            )}
            {task.inboxType === 'pengingat' && (
              <span className="inbox-meta-badge pengingat" title="Pengingat">
                <Bell size={11} />
                <span>Pengingat</span>
              </span>
            )}

            {/* Indikator Rutinitas */}
            {task.recurrence && task.recurrence !== 'none' && (
              <span className="inbox-meta-badge recurrence" title={`Rutin: ${task.recurrence}`}>
                <Repeat size={10} />
                <span>
                  {task.recurrence === 'daily'
                    ? 'Harian'
                    : task.recurrence === 'weekdays'
                    ? 'Sen-Jum'
                    : task.recurrence === 'weekly'
                    ? 'Mingguan'
                    : 'Bulanan'}
                </span>
              </span>
            )}

            {/* Indikator Prioritas Tinggi (Minimalist Accent) */}
            {task.priority === 'high' && !task.isBreakTask && (
              <span className="inbox-meta-badge priority-high" title="Prioritas Tinggi">
                <span className="priority-dot" />
                <span>Penting</span>
              </span>
            )}

            {/* Jadwal Tanggal & Jam Ringkas */}
            {(task.dueDate || task.startTime || task.dueTime) && (
              <span className="inbox-meta-badge date" title="Jadwal Waktu">
                <Calendar size={10} />
                <span>{formatReadableDate(task.dueDate || task.startDate)}</span>
                {task.startTime && task.endTime ? (
                  <span className="time-sep">• {task.startTime}-{task.endTime}</span>
                ) : task.startTime ? (
                  <span className="time-sep">• {task.startTime}</span>
                ) : task.dueTime ? (
                  <span className="time-sep">• {task.dueTime}</span>
                ) : null}
              </span>
            )}

            {/* Indikator Sub-task Ringkas */}
            {totalSubtasksCount > 0 && (
              <button
                type="button"
                className={`inbox-meta-btn subtask-count ${isSubtasksOpen ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSubtasksOpen((prev) => !prev);
                }}
                title="Lihat sub-tugas"
              >
                <CheckSquare size={10} />
                <span>
                  {completedSubtasksCount}/{totalSubtasksCount}
                </span>
                {isSubtasksOpen ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
              </button>
            )}

            {/* Indikator Catatan Deskripsi */}
            {task.description && (
              <button
                type="button"
                className={`inbox-meta-btn note-toggle ${showDesc ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDesc((prev) => !prev);
                }}
                title="Lihat catatan"
              >
                <FileText size={10} />
                <span>Catatan</span>
              </button>
            )}

            {/* Durasi Perekam Waktu (Jika ada durasi tersimpan) */}
            {!task.isTimerRunning && (task.timeSpentSeconds || 0) > 0 && (
              <span className="inbox-meta-badge timer-badge" title="Waktu pengerjaan tercatat">
                <Clock size={10} />
                <span>{formatRecordedDuration(task.timeSpentSeconds!)}</span>
                {!task.isCompleted && (
                  <button
                    type="button"
                    className="btn-resume-timer-inline"
                    onClick={(e) => {
                      e.stopPropagation();
                      startTaskTimer(task.id);
                    }}
                    title="Lanjutkan hitungan waktu"
                  >
                    <Play size={8} fill="currentColor" />
                  </button>
                )}
              </span>
            )}
          </div>
        </div>

        {/* 2. Sisi Kanan: Aksi Cepat & Tenang */}
        <div className="inbox-row-actions">
          {/* Tombol Star Today Cepat */}
          <button
            type="button"
            className={`inbox-star-btn ${task.isToday ? 'active' : ''} ${
              isScheduledEventNotToday ? 'disabled-event' : ''
            }`}
            onClick={(e) => {
              e.stopPropagation();
              toggleTodayTask(task.id);
            }}
            title={
              isScheduledEventNotToday
                ? `Acara terjadwal untuk ${formatReadableDate(taskDate)} (hanya acara hari ini yang bisa masuk ke Today)`
                : task.isToday
                ? 'Keluarkan dari Today'
                : 'Pilih ke Fokus Today (Maks 5)'
            }
          >
            <Star
              size={15}
              fill={task.isToday ? '#f59e0b' : 'none'}
              color={
                isScheduledEventNotToday
                  ? '#cbd5e1'
                  : task.isToday
                  ? '#d97706'
                  : '#94a3b8'
              }
            />
          </button>

          {/* Menu Opsi Titik Tiga */}
          <div className="inbox-more-wrap">
            <button
              ref={buttonRef}
              type="button"
              className="inbox-more-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (!isMenuOpen && buttonRef.current) {
                  const rect = buttonRef.current.getBoundingClientRect();
                  const navEl = document.querySelector('.android-bottom-nav-container');
                  const scrollContainer = buttonRef.current.closest('.scrollable-content');
                  const wrapper = buttonRef.current.closest('.mobile-viewport-wrapper');

                  let bottomBoundary = window.innerHeight;
                  if (navEl) {
                    bottomBoundary = navEl.getBoundingClientRect().top;
                  } else if (scrollContainer) {
                    bottomBoundary = scrollContainer.getBoundingClientRect().bottom;
                  } else if (wrapper) {
                    bottomBoundary = wrapper.getBoundingClientRect().bottom - 68;
                  }

                  const spaceBelow = bottomBoundary - rect.bottom;
                  setOpenUpward(spaceBelow < 225);
                }
                setIsMenuOpen((prev) => !prev);
              }}
              title="Opsi item"
            >
              <MoreVertical size={15} />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="more-menu-backdrop"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                  }}
                />
                <div
                  className={`more-menu-popover ${openUpward ? 'open-upward' : ''}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Timer Play / Pause */}
                  <button
                    type="button"
                    className={`more-menu-item ${
                      task.isTimerRunning ? 'timer-active-item' : 'timer-play-item'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      if (task.isTimerRunning) {
                        pauseTaskTimer(task.id);
                      } else {
                        startTaskTimer(task.id);
                      }
                    }}
                  >
                    {task.isTimerRunning ? (
                      <>
                        <Pause size={13} className="text-amber" />
                        <span>Jeda Timer</span>
                      </>
                    ) : (
                      <>
                        <Play size={13} className="text-emerald fill-emerald" />
                        <span>Mulai Timer</span>
                      </>
                    )}
                  </button>

                  {/* 1x Klik AI: Sub-tugas */}
                  <button
                    type="button"
                    className="more-menu-item ai-item"
                    onClick={handleGenerateAIWithEstimate}
                    disabled={isGeneratingAI}
                  >
                    {isGeneratingAI ? (
                      <Loader2 size={13} className="spin" />
                    ) : (
                      <Sparkles size={13} />
                    )}
                    <span>{isGeneratingAI ? 'Menganalisis...' : 'AI Sub-tugas'}</span>
                  </button>

                  {/* Toggle Today */}
                  <button
                    type="button"
                    className="more-menu-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      toggleTodayTask(task.id);
                    }}
                  >
                    <Star
                      size={13}
                      fill={task.isToday ? '#f59e0b' : 'none'}
                      color={task.isToday ? '#d97706' : 'currentColor'}
                    />
                    <span>{task.isToday ? 'Hapus Today' : 'Ke Today'}</span>
                  </button>

                  {/* Edit */}
                  <button
                    type="button"
                    className="more-menu-item"
                    onClick={handleEdit}
                  >
                    <Pencil size={13} />
                    <span>Edit</span>
                  </button>

                  {/* Hapus */}
                  <button
                    type="button"
                    className="more-menu-item delete-item"
                    onClick={handleDelete}
                  >
                    <Trash2 size={13} />
                    <span>Hapus</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Strip Live Stopwatch jika Timer sedang Aktif */}
      {task.isTimerRunning && (
        <div className="inbox-live-timer-strip">
          <div className="timer-pulse-left">
            <span className="pulse-dot" />
            <span className="timer-digits">
              {formatStopwatchDigits(liveElapsedSeconds)}
            </span>
            <span className="timer-type-tag">
              {task.inboxType === 'kegiatan'
                ? 'Acara berjalan'
                : task.inboxType === 'pengingat'
                ? 'Diproses'
                : 'Dikerjakan'}
            </span>
          </div>

          <div className="timer-controls-right">
            <button
              type="button"
              className="btn-timer-icon-clean pause"
              onClick={() => pauseTaskTimer(task.id)}
              title="Jeda"
            >
              <Pause size={12} />
              <span>Jeda</span>
            </button>
            <button
              type="button"
              className="btn-timer-icon-clean stop"
              onClick={() => stopTaskTimer(task.id)}
              title="Berhenti & simpan"
            >
              <Square size={11} />
              <span>Stop</span>
            </button>
            <button
              type="button"
              className="btn-timer-icon-clean done"
              onClick={() => toggleTaskStatus(task.id)}
              title="Selesai"
            >
              <Check size={12} strokeWidth={3} />
              <span>Selesai</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Deskripsi / Catatan Expanded */}
      {task.description && showDesc && (
        <div className="inbox-desc-expanded">
          <div className="desc-content">{task.description}</div>
        </div>
      )}

      {/* 5. Sub-tasks Expanded List (Clean & Indented) */}
      {totalSubtasksCount > 0 && isSubtasksOpen && (
        <div className="inbox-subtasks-container">
          {task.subTasks.map((subTask) => (
            <div key={subTask.id} className="inbox-subtask-row">
              <button
                type="button"
                className={`inbox-subtask-checkbox ${subTask.isCompleted ? 'checked' : ''}`}
                onClick={() => toggleSubTaskStatus(task.id, subTask.id)}
                aria-label={`Toggle subtask ${subTask.title}`}
              >
                {subTask.isCompleted && <Check size={9} strokeWidth={3} />}
              </button>
              <span
                className={`inbox-subtask-title ${
                  subTask.isCompleted ? 'checked-text' : ''
                }`}
                onClick={() => toggleSubTaskStatus(task.id, subTask.id)}
              >
                {subTask.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
