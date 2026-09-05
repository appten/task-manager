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
  Target,
  Layers,
  Shuffle,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const {
    toggleTaskStatus,
    toggleSubTaskStatus,
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

  return (
    <div
      className={`task-card ${task.isCompleted ? 'completed' : ''} ${
        task.isBreakTask ? 'break-task-card' : ''
      }`}
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

          {/* Baris Keterangan yang Rapi dan Bersih */}
          <div className="task-meta-row">
            {/* Badge Jeda Istirahat / Pemulihan Energi */}
            {task.isBreakTask && (
              <span className="meta-item meta-break">
                ☕ Jeda Istirahat
              </span>
            )}

            {/* Prioritas Tinggi */}
            {task.priority === 'high' && !task.isBreakTask && (
              <span className="meta-urgent">
                <AlertCircle size={10} />
                Penting
              </span>
            )}

            {/* Tanggal */}
            <span className="meta-item">
              <Calendar size={11} />
              {formatReadableDate(task.dueDate)}
            </span>

            {/* Jam / Rentang Waktu */}
            {task.startTime && task.endTime ? (
              <span className="meta-item meta-time-range">
                <Clock size={11} />
                {task.startTime} - {task.endTime}
              </span>
            ) : task.startTime ? (
              <span className="meta-item">
                <Clock size={11} />
                Mulai {task.startTime}
              </span>
            ) : task.dueTime ? (
              <span className="meta-item">
                <Clock size={11} />
                {task.dueTime}
              </span>
            ) : null}

            {/* Sesi Terbagi AI (Split Sessions) */}
            {task.scheduledSessions && task.scheduledSessions.length > 1 && (
              <span
                className="meta-item meta-split-sessions"
                title={task.schedulingNote || `Dibagi menjadi ${task.scheduledSessions.length} sesi`}
              >
                <Layers size={10} />
                {task.scheduledSessions.length} Sesi
              </span>
            )}

            {/* Multitasking Badge */}
            {task.allowConcurrent && (
              <span className="meta-item meta-concurrent" title="Bisa dikerjakan bersamaan">
                <Shuffle size={10} />
                Multitask
              </span>
            )}

            {/* Estimasi Waktu dari AI jika ada */}
            {task.estimatedTime && (
              <span className="meta-item meta-estimate">
                <Clock size={10} />
                Est: {task.estimatedTime}
              </span>
            )}

            {/* Skor Keselarasan Goal AI (-100 s/d 100) */}
            {task.goalAlignmentScore !== undefined && (
              <span
                className={`meta-item meta-goal ${
                  task.goalAlignmentScore > 0
                    ? 'positive'
                    : task.goalAlignmentScore < 0
                    ? 'negative'
                    : 'neutral'
                }`}
                title={
                  task.goalAlignmentReason
                    ? `Goals (${task.goalAlignmentScore > 0 ? '+' : ''}${task.goalAlignmentScore}): ${task.goalAlignmentReason}`
                    : `Skor keselarasan goal: ${task.goalAlignmentScore}`
                }
              >
                <Target size={11} />
                <span>
                  {task.goalAlignmentScore > 0
                    ? `+${task.goalAlignmentScore}`
                    : `${task.goalAlignmentScore}`}
                </span>
              </span>
            )}

            {/* Kategori */}
            {task.category && (
              <span className="meta-item">
                #{task.category}
              </span>
            )}

            {/* Catatan toggle */}
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

            {/* Dropdown Sub-task jika ada sub-task */}
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
                {isSubtasksOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
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

                {/* 2. Edit Tugas */}
                <button
                  type="button"
                  className="more-menu-item"
                  onClick={handleEdit}
                >
                  <Pencil size={14} />
                  <span>Edit Tugas</span>
                </button>

                {/* 3. Hapus Tugas */}
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
