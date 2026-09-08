'use client';

import React, { useState } from 'react';
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
  AlignLeft,
  AlertCircle,
  Sparkles,
  Loader2,
  MoreVertical,
  Star,
  Bell,
  CheckSquare,
  Repeat,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  todayRank?: number;
  hideTodayToggle?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, todayRank, hideTodayToggle = false }) => {
  const {
    toggleTaskStatus,
    toggleSubTaskStatus,
    toggleTodayTask,
    setEditingTask,
    deleteTask,
    addAISubTasksAndEstimate,
    userGoal,
    showToast,
  } = useTask();

  const [isSubtasksOpen, setIsSubtasksOpen] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

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

  // 1-Click AI: Buat Sub-tugas & Estimasi Waktu Penyelesaian tanpa duplikasi & analisis goals
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

  // Format date readable (e.g. "05 Sep")
  const formatReadableDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-');
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      return date.toLocaleDateString('id-ID', {
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
      className={`task-card ${task.isCompleted ? 'completed' : ''} ${
        task.isBreakTask ? 'break-task-card' : ''
      } ${task.isToday ? 'is-today-selected' : ''}`}
    >
      <div className="task-card-header">
        {/* Checkbox Lingkaran Utama */}
        <button
          type="button"
          className={`android-checkbox ${task.isCompleted ? 'checked' : ''}`}
          onClick={() => toggleTaskStatus(task.id)}
          aria-label={task.isCompleted ? 'Tandai belum selesai' : 'Tandai selesai'}
        >
          {task.isCompleted && <Check size={12} strokeWidth={3} />}
        </button>

        {/* Konten Tugas */}
        <div className="task-main-content">
          {todayRank && (
            <div className="task-badges-row">
              <div className="today-rank-indicator">
                <Star size={11} fill="#f59e0b" color="#d97706" />
                <span>Fokus #{todayRank}</span>
              </div>
            </div>
          )}
          <div
            className={`task-title ${task.isCompleted ? 'completed-title' : ''}`}
            onClick={() => {
              if (totalSubtasksCount > 0) setIsSubtasksOpen((prev) => !prev);
              else if (task.description) setShowDesc((prev) => !prev);
            }}
            style={{ cursor: 'pointer' }}
          >
            {task.title}
          </div>

          {/* Deskripsi tugas jika di-expand */}
          {task.description && showDesc && (
            <div className="task-desc-compact">
              {task.description}
            </div>
          )}

          {/* Baris Keterangan yang Rapi, Bersih & Ringkas */}
          <div className="task-meta-row">
            {/* 1. Badge Jenis Inbox */}
            {task.inboxType === 'kegiatan' ? (
              <span className="meta-item meta-inbox-badge kegiatan" title="Kategori: Kegiatan / Acara">
                <Calendar size={10} />
                <span>Acara</span>
              </span>
            ) : task.inboxType === 'pengingat' ? (
              <span className="meta-item meta-inbox-badge pengingat" title="Kategori: Pengingat">
                <Bell size={10} />
                <span>Pengingat</span>
              </span>
            ) : (
              <span className="meta-item meta-inbox-badge tugas" title="Kategori: Tugas">
                <CheckSquare size={10} />
                <span>Tugas</span>
              </span>
            )}

            {/* Badge Rutin / Berulang */}
            {task.recurrence && task.recurrence !== 'none' && (
              <span className="meta-item meta-recurrence-badge" title={`Pola Rutin: ${task.recurrence}`}>
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

            {/* 2. Prioritas Tinggi (Halus & Rapi) */}
            {task.priority === 'high' && !task.isBreakTask && (
              <span className="meta-urgent-clean" title="Prioritas Tinggi">
                <AlertCircle size={10} />
                <span>Penting</span>
              </span>
            )}

            {/* 3. Waktu & Tanggal Ringkas */}
            {(task.dueDate || task.startTime || task.dueTime) && (
              <span className="meta-item meta-date-item">
                <Calendar size={10} />
                <span>{formatReadableDate(task.dueDate)}</span>
                {task.startTime && task.endTime ? (
                  <span className="meta-time-text">• {task.startTime}-{task.endTime}</span>
                ) : task.startTime ? (
                  <span className="meta-time-text">• {task.startTime}</span>
                ) : task.dueTime ? (
                  <span className="meta-time-text">• {task.dueTime}</span>
                ) : null}
              </span>
            )}

            {/* 4. Sub-task Count */}
            {totalSubtasksCount > 0 && (
              <button
                type="button"
                className={`meta-subtask-btn ${isSubtasksOpen ? 'active' : ''}`}
                onClick={() => setIsSubtasksOpen((prev) => !prev)}
                aria-expanded={isSubtasksOpen}
              >
                <span>
                  {completedSubtasksCount}/{totalSubtasksCount} sub-task
                </span>
                {isSubtasksOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              </button>
            )}

            {/* 5. Toggle Catatan jika ada deskripsi */}
            {task.description && (
              <button
                type="button"
                className="meta-subtask-btn"
                onClick={() => setShowDesc((prev) => !prev)}
                title="Lihat catatan"
              >
                <AlignLeft size={10} />
                <span>{showDesc ? 'Tutup' : 'Catatan'}</span>
              </button>
            )}

            {/* 6. Tombol Today (Ikon Bintang Ringkas) */}
            {!hideTodayToggle && (
              <button
                type="button"
                className={`meta-today-btn-clean ${task.isToday ? 'active' : ''} ${
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
                    : 'Pilih ke Today (Maks 5)'
                }
              >
                <Star
                  size={10}
                  fill={task.isToday ? '#f59e0b' : 'none'}
                  color={
                    isScheduledEventNotToday
                      ? '#94a3b8'
                      : task.isToday
                      ? '#d97706'
                      : '#94a3b8'
                  }
                />
                <span>
                  {task.isToday
                    ? 'Today'
                    : isScheduledEventNotToday
                    ? 'Terjadwal'
                    : '+ Today'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Menu Titik Tiga (MoreVertical) Menggabungkan AI, Edit & Hapus */}
        <div className="more-menu-container">
          <button
            type="button"
            className="card-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen((prev) => !prev);
            }}
            title="Menu opsi tugas"
            aria-label="Menu opsi tugas"
          >
            <MoreVertical size={16} />
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
                className="more-menu-popover"
                onClick={(e) => e.stopPropagation()}
              >
                {/* 1. Fitur 1x Klik AI: Sub-tugas & Estimasi Waktu */}
                <button
                  type="button"
                  className="more-menu-item ai-item"
                  onClick={handleGenerateAIWithEstimate}
                  disabled={isGeneratingAI}
                >
                  {isGeneratingAI ? (
                    <Loader2 size={14} className="spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  <span>
                    {isGeneratingAI
                      ? 'AI menganalisis...'
                      : '✨ Buat Sub-tugas & Estimasi (AI)'}
                  </span>
                </button>

                {/* 2. Toggle Today */}
                <button
                  type="button"
                  className="more-menu-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    toggleTodayTask(task.id);
                  }}
                >
                  <Star size={14} fill={task.isToday ? '#f59e0b' : 'none'} color={task.isToday ? '#d97706' : 'currentColor'} />
                  <span>{task.isToday ? 'Keluarkan dari Today' : 'Pilih ke Today (Maks 5)'}</span>
                </button>

                {/* 3. Edit Tugas */}
                <button
                  type="button"
                  className="more-menu-item"
                  onClick={handleEdit}
                >
                  <Pencil size={14} />
                  <span>Edit Tugas</span>
                </button>

                {/* 4. Hapus Tugas */}
                <button
                  type="button"
                  className="more-menu-item delete-item"
                  onClick={handleDelete}
                >
                  <Trash2 size={14} />
                  <span>Hapus Tugas</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Accordion Sub-task Compact */}
      {totalSubtasksCount > 0 && isSubtasksOpen && (
        <div className="subtask-accordion-body">
          {task.subTasks.map((subTask) => (
            <div key={subTask.id} className="subtask-item">
              <button
                type="button"
                className={`subtask-checkbox ${subTask.isCompleted ? 'checked' : ''}`}
                onClick={() => toggleSubTaskStatus(task.id, subTask.id)}
                aria-label={`Toggle subtask ${subTask.title}`}
              >
                {subTask.isCompleted && <Check size={10} strokeWidth={3.2} />}
              </button>
              <span
                className={`subtask-title ${
                  subTask.isCompleted ? 'checked-text' : ''
                }`}
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
