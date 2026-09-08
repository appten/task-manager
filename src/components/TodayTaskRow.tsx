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
  Sparkles,
  Loader2,
  MoreVertical,
  Star,
  CheckSquare,
  Play,
  Pause,
  Square,
  XCircle,
} from 'lucide-react';

interface TodayTaskRowProps {
  task: Task;
  slotNumber: number;
}

export const TodayTaskRow: React.FC<TodayTaskRowProps> = ({ task, slotNumber }) => {
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
    if (window.confirm(`Hapus tugas "${task.title}"?`)) {
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
      const existingSubTitles = task.subTasks.map((st) => st.title);
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

  return (
    <div
      className={`today-task-row ${task.isCompleted ? 'completed' : ''} ${
        task.isTimerRunning ? 'timer-active' : ''
      } ${isMenuOpen ? 'is-menu-open' : ''}`}
    >
      <div className="today-row-main">
        {/* Nomor Urut Slot Fokus (#1 sampai #5) */}
        <div className={`today-slot-pill ${task.isCompleted ? 'done' : ''}`} title={`Prioritas #${slotNumber}`}>
          #{slotNumber}
        </div>

        {/* Lingkaran Checkbox Halus */}
        <button
          type="button"
          className={`today-circle-checkbox ${task.isCompleted ? 'checked' : ''}`}
          onClick={() => toggleTaskStatus(task.id)}
          aria-label={task.isCompleted ? 'Tandai belum selesai' : 'Tandai selesai'}
        >
          {task.isCompleted && <Check size={11} strokeWidth={3} />}
        </button>

        {/* Konten Utama */}
        <div className="today-row-content">
          <div
            className={`today-row-title ${task.isCompleted ? 'title-done' : ''}`}
            onClick={() => {
              if (totalSubtasksCount > 0) setIsSubtasksOpen((prev) => !prev);
              else if (task.description) setShowDesc((prev) => !prev);
              else setEditingTask(task);
            }}
          >
            {task.title}
          </div>

          {/* Baris Metadata Minimalis */}
          <div className="today-row-meta">
            {/* Notifikasi Rollover Berapa Hari di Today */}
            {task.todayDaysCount && task.todayDaysCount > 1 && (
              <span
                className="today-carryover-badge"
                title={`Tugas berlanjut dari hari sebelumnya (sudah ${task.todayDaysCount} hari di Today)`}
              >
                Hari ke-{task.todayDaysCount} di Today
              </span>
            )}

            {/* Waktu / Jadwal jika ada */}
            {(task.startTime || task.dueTime) && (
              <span className="today-meta-item">
                <Clock size={10} />
                <span>{task.startTime || task.dueTime}</span>
              </span>
            )}

            {/* Subtasks Count */}
            {totalSubtasksCount > 0 && (
              <button
                type="button"
                className={`today-meta-btn ${isSubtasksOpen ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSubtasksOpen((prev) => !prev);
                }}
              >
                <CheckSquare size={10} />
                <span>
                  {completedSubtasksCount}/{totalSubtasksCount}
                </span>
                {isSubtasksOpen ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
              </button>
            )}

            {/* Catatan Toggle */}
            {task.description && (
              <button
                type="button"
                className={`today-meta-btn ${showDesc ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDesc((prev) => !prev);
                }}
              >
                <FileText size={10} />
                <span>Catatan</span>
              </button>
            )}

            {/* Durasi Pengerjaan */}
            {!task.isTimerRunning && (task.timeSpentSeconds || 0) > 0 && (
              <span className="today-meta-item timer-badge">
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
                    title="Lanjutkan waktu"
                  >
                    <Play size={8} fill="currentColor" />
                  </button>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Sisi Kanan: Aksi Cepat */}
        <div className="today-row-actions">
          {/* Menu Opsi Titik Tiga */}
          <div className="today-more-wrap">
            <button
              ref={buttonRef}
              type="button"
              className="today-more-btn"
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
              title="Opsi tugas"
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

                  {/* 1x Klik AI Subtugas */}
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

                  {/* Keluarkan dari Today */}
                  <button
                    type="button"
                    className="more-menu-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      toggleTodayTask(task.id);
                    }}
                  >
                    <XCircle size={13} />
                    <span>Hapus Today</span>
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

      {/* Strip Stopwatch Aktif */}
      {task.isTimerRunning && (
        <div className="today-live-timer-strip">
          <div className="timer-pulse-left">
            <span className="pulse-dot" />
            <span className="timer-digits">
              {formatStopwatchDigits(liveElapsedSeconds)}
            </span>
            <span className="timer-type-tag">Sedang Berjalan</span>
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

      {/* Catatan / Deskripsi Expanded */}
      {task.description && showDesc && (
        <div className="today-desc-expanded">
          <div className="desc-content">{task.description}</div>
        </div>
      )}

      {/* Sub-tasks Expanded */}
      {totalSubtasksCount > 0 && isSubtasksOpen && (
        <div className="today-subtasks-container">
          {task.subTasks.map((subTask) => (
            <div key={subTask.id} className="today-subtask-row">
              <button
                type="button"
                className={`today-subtask-checkbox ${subTask.isCompleted ? 'checked' : ''}`}
                onClick={() => toggleSubTaskStatus(task.id, subTask.id)}
                aria-label={`Toggle subtask ${subTask.title}`}
              >
                {subTask.isCompleted && <Check size={9} strokeWidth={3} />}
              </button>
              <span
                className={`today-subtask-title ${
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
