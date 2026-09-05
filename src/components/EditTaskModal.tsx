'use client';

import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { Priority, Category, SubTask, Task } from '../types/task';
import { X, Plus, Trash2, Calendar, Clock, Tag, Flag, CheckCircle } from 'lucide-react';

export const EditTaskModal: React.FC = () => {
  const { editingTask, setEditingTask, updateTask } = useTask();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  
  // Jadwal Mulai & Selesai (Opsional)
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [effortHours, setEffortHours] = useState<number | ''>('');
  const [allowConcurrent, setAllowConcurrent] = useState(false);

  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<Category>('Pekerjaan');
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [newSubTaskInput, setNewSubTaskInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setDueDate(editingTask.dueDate);
      setDueTime(editingTask.dueTime || '');
      setStartDate(editingTask.startDate || editingTask.dueDate || '');
      setStartTime(editingTask.startTime || '');
      setEndDate(editingTask.endDate || editingTask.dueDate || '');
      setEndTime(editingTask.endTime || editingTask.dueTime || '');
      setEffortHours(editingTask.effortHours !== undefined ? editingTask.effortHours : '');
      setAllowConcurrent(Boolean(editingTask.allowConcurrent));
      setPriority(editingTask.priority);
      setCategory(editingTask.category);
      setSubTasks(editingTask.subTasks || []);
      setErrorMsg('');
    }
  }, [editingTask]);

  if (!editingTask) return null;

  const handleAddSubTask = () => {
    if (!newSubTaskInput.trim()) return;
    const newSub: SubTask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: newSubTaskInput.trim(),
      isCompleted: false,
    };
    setSubTasks((prev) => [...prev, newSub]);
    setNewSubTaskInput('');
  };

  const handleRemoveSubTask = (id: string) => {
    setSubTasks((prev) => prev.filter((st) => st.id !== id));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Judul task wajib diisi');
      return;
    }

    const isUserStartTimeFixed = Boolean(startTime.trim());
    const isUserEndTimeFixed = Boolean(endTime.trim());
    const finalDueDate = endDate || startDate || dueDate;
    const finalDueTime = endTime.trim() || undefined;

    const updated: Task = {
      ...editingTask,
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: finalDueDate,
      dueTime: finalDueTime,
      startDate: startDate || finalDueDate,
      startTime: startTime.trim() || undefined,
      endDate: endDate || finalDueDate,
      endTime: endTime.trim() || undefined,
      isUserStartTimeFixed,
      isUserEndTimeFixed,
      effortHours: effortHours ? Number(effortHours) : undefined,
      estimatedTime: effortHours ? `${effortHours} jam` : editingTask.estimatedTime,
      allowConcurrent,
      priority,
      category,
      subTasks,
    };

    updateTask(updated);
  };

  return (
    <div className="modal-overlay" onClick={() => setEditingTask(null)}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle-bar" />

        <div className="sheet-header">
          <div className="sheet-title">Edit Task</div>
          <button
            type="button"
            className="android-icon-btn"
            onClick={() => setEditingTask(null)}
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="form-container">
          {/* Judul Task */}
          <div className="form-group">
            <label className="form-label" htmlFor="edit-task-title">
              Judul Task <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            <input
              id="edit-task-title"
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
            />
            {errorMsg && (
              <span style={{ fontSize: '11px', color: '#f43f5e', fontWeight: 600 }}>
                {errorMsg}
              </span>
            )}
          </div>

          {/* Deskripsi */}
          <div className="form-group">
            <label className="form-label" htmlFor="edit-task-desc">
              Deskripsi
            </label>
            <textarea
              id="edit-task-desc"
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Card Pengaturan Jadwal Mulai & Selesai (Opsional) */}
          <div className="schedule-card-group">
            <div className="schedule-card-header">
              <div className="schedule-card-title">
                <Clock size={15} />
                <span>Jadwal Mulai & Selesai (Opsional)</span>
              </div>
              <span className="schedule-card-hint">
                Jadwal yang Anda isi terkunci (fixed), AI hanya mengisi kekosongan.
              </span>
            </div>

            {/* Baris 1: Jadwal Mulai */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="edit-task-start-date">
                  <Calendar size={12} /> Tgl Mulai
                </label>
                <input
                  id="edit-task-start-date"
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (!endDate || endDate < e.target.value) setEndDate(e.target.value);
                  }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-task-start-time">
                  <Clock size={12} /> Jam Mulai
                </label>
                <input
                  id="edit-task-start-time"
                  type="time"
                  className="form-input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="--:--"
                />
              </div>
            </div>

            {/* Baris 2: Jadwal Selesai */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="edit-task-end-date">
                  <Calendar size={12} /> Tgl Selesai
                </label>
                <input
                  id="edit-task-end-date"
                  type="date"
                  className="form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-task-end-time">
                  <Clock size={12} /> Jam Selesai
                </label>
                <input
                  id="edit-task-end-time"
                  type="time"
                  className="form-input"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="--:--"
                />
              </div>
            </div>

            {/* Baris 3: Estimasi Durasi Usaha (Jam Kerja) */}
            <div className="form-group" style={{ marginTop: '6px' }}>
              <label className="form-label" htmlFor="edit-task-effort-hours">
                Estimasi Usaha Total (Jam)
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  id="edit-task-effort-hours"
                  type="number"
                  step="0.5"
                  min="0.25"
                  max="24"
                  className="form-input"
                  placeholder="Contoh: 5 (jam)"
                  value={effortHours}
                  onChange={(e) =>
                    setEffortHours(e.target.value ? parseFloat(e.target.value) : '')
                  }
                  style={{ flex: 1 }}
                />
                <div className="quick-effort-chips">
                  {[0.5, 1, 2, 5].map((h) => (
                    <button
                      key={h}
                      type="button"
                      className={`effort-chip ${effortHours === h ? 'active' : ''}`}
                      onClick={() => setEffortHours(h)}
                    >
                      {h >= 1 ? `${h}j` : '30m'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Checkbox Multitasking / Beban Ringan */}
            <label className="concurrent-checkbox-label">
              <input
                type="checkbox"
                checked={allowConcurrent}
                onChange={(e) => setAllowConcurrent(e.target.checked)}
              />
              <span>Bisa dikerjakan bersamaan dengan tugas lain (Multitasking / Bobot Ringan)</span>
            </label>
          </div>

          {/* Prioritas */}
          <div className="form-group">
            <label className="form-label">
              <Flag size={13} /> Prioritas
            </label>
            <div className="priority-selector">
              <button
                type="button"
                className={`priority-btn low ${priority === 'low' ? 'active' : ''}`}
                onClick={() => setPriority('low')}
              >
                Rendah
              </button>
              <button
                type="button"
                className={`priority-btn medium ${priority === 'medium' ? 'active' : ''}`}
                onClick={() => setPriority('medium')}
              >
                Sedang
              </button>
              <button
                type="button"
                className={`priority-btn high ${priority === 'high' ? 'active' : ''}`}
                onClick={() => setPriority('high')}
              >
                Tinggi
              </button>
            </div>
          </div>

          {/* Kategori */}
          <div className="form-group">
            <label className="form-label" htmlFor="edit-task-cat">
              <Tag size={13} /> Kategori
            </label>
            <select
              id="edit-task-cat"
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              <option value="Pekerjaan">💼 Pekerjaan</option>
              <option value="Pribadi">🏠 Pribadi</option>
              <option value="Belajar">📚 Belajar</option>
              <option value="Kesehatan">🏃 Kesehatan</option>
              <option value="Lainnya">✨ Lainnya</option>
            </select>
          </div>

          {/* Sub-tasks */}
          <div className="form-group">
            <label className="form-label">
              <CheckCircle size={13} /> Sub-task
            </label>
            <div className="subtask-builder-wrapper">
              <div className="subtask-input-row">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Tambah sub-task baru..."
                  value={newSubTaskInput}
                  onChange={(e) => setNewSubTaskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubTask();
                    }
                  }}
                  style={{ padding: '8px 12px' }}
                />
                <button
                  type="button"
                  className="subtask-add-btn"
                  onClick={handleAddSubTask}
                >
                  <Plus size={14} /> Tambah
                </button>
              </div>

              {subTasks.length > 0 && (
                <div className="built-subtask-list">
                  {subTasks.map((st, idx) => (
                    <div key={st.id} className="built-subtask-chip">
                      <span>
                        {idx + 1}. {st.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubTask(st.id)}
                        title="Hapus sub-task"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tombol Simpan Perubahan */}
          <button type="submit" className="btn-primary">
            Simpan Perubahan
          </button>
        </form>
      </div>
    </div>
  );
};
