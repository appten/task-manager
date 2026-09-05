'use client';

import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { getFormattedDate } from '../data/seedTasks';
import { Priority, Category, SubTask } from '../types/task';
import { Plus, Trash2, Calendar, Clock, Tag, Flag, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { generateSubTasksWithAI } from '../services/geminiService';

export const TaskForm: React.FC = () => {
  const { addTask, showToast } = useTask();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Jadwal Mulai & Selesai yang Fleksibel (Opsional)
  const [startDate, setStartDate] = useState(getFormattedDate(0));
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState(getFormattedDate(0));
  const [endTime, setEndTime] = useState('');
  const [effortHours, setEffortHours] = useState<number | ''>('');
  const [allowConcurrent, setAllowConcurrent] = useState(false);

  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<Category>('Pekerjaan');

  // Dynamic Subtasks Builder
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [currentSubTaskInput, setCurrentSubTaskInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleGenerateAI = async () => {
    if (!title.trim()) {
      setErrorMsg('Ketik judul tugas terlebih dahulu agar AI bisa membuat sub-tugas.');
      return;
    }
    setIsGeneratingAI(true);
    try {
      const generated = await generateSubTasksWithAI(title, description);
      if (generated && generated.length > 0) {
        const newSubs: SubTask[] = generated.map((t, idx) => ({
          id: `sub-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
          title: t,
          isCompleted: false,
        }));
        setSubTasks((prev) => [...prev, ...newSubs]);
        showToast(`AI berhasil menambahkan ${generated.length} sub-tugas! ✨`);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Gagal membuat sub-tugas AI');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleAddSubTask = () => {
    if (!currentSubTaskInput.trim()) return;
    const newSub: SubTask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: currentSubTaskInput.trim(),
      isCompleted: false,
    };
    setSubTasks((prev) => [...prev, newSub]);
    setCurrentSubTaskInput('');
  };

  const handleRemoveSubTask = (id: string) => {
    setSubTasks((prev) => prev.filter((st) => st.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Judul task wajib diisi');
      return;
    }

    const isUserStartTimeFixed = Boolean(startTime.trim());
    const isUserEndTimeFixed = Boolean(endTime.trim());
    const finalDueDate = endDate || startDate || getFormattedDate(0);
    const finalDueTime = endTime.trim() || undefined;

    addTask({
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
      estimatedTime: effortHours ? `${effortHours} jam` : undefined,
      allowConcurrent,
      priority,
      category,
      isCompleted: false,
      subTasks,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setStartDate(getFormattedDate(0));
    setStartTime('');
    setEndDate(getFormattedDate(0));
    setEndTime('');
    setEffortHours('');
    setAllowConcurrent(false);
    setPriority('medium');
    setCategory('Pekerjaan');
    setSubTasks([]);
    setErrorMsg('');
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <div style={{ marginBottom: '6px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1f1f1f' }}>
          Buat Tugas Baru
        </h2>
        <p style={{ fontSize: '13px', color: '#444746', marginTop: '2px' }}>
          Atur jadwal fleksibel. AI akan mengisi kekosongan jadwal tanpa bentrok.
        </p>
      </div>

      {/* Judul Task */}
      <div className="form-group">
        <label className="form-label" htmlFor="task-title">
          Judul Task <span style={{ color: '#f43f5e' }}>*</span>
        </label>
        <input
          id="task-title"
          type="text"
          className="form-input"
          placeholder="Contoh: Menyelesaikan laporan kuartal"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errorMsg) setErrorMsg('');
          }}
          autoFocus
        />
        {errorMsg && (
          <span style={{ fontSize: '11px', color: '#f43f5e', fontWeight: 600 }}>
            {errorMsg}
          </span>
        )}
      </div>

      {/* Deskripsi */}
      <div className="form-group">
        <label className="form-label" htmlFor="task-desc">
          Deskripsi / Catatan Tambahan
        </label>
        <textarea
          id="task-desc"
          className="form-textarea"
          placeholder="Tuliskan catatan penting atau instruksi..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Card Pengaturan Jadwal Mulai & Selesai (Opsional) */}
      <div className="schedule-card-group">
        <div className="schedule-card-header">
          <div className="schedule-card-title">
            <Clock size={15} />
            <span>Ketentuan Waktu Pengerjaan (Opsional)</span>
          </div>
          <span className="schedule-card-hint">
            <strong>Mulai</strong>: Tugas hanya bisa dimulai pada/setelah waktu ini.<br />
            <strong>Selesai</strong>: Tugas harus sudah beres sebelum batas waktu ini.
          </span>
        </div>

        {/* Baris 1: Jadwal Mulai */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="task-start-date">
              <Calendar size={12} /> Tgl Mulai Terawal
            </label>
            <input
              id="task-start-date"
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
            <label className="form-label" htmlFor="task-start-time">
              <Clock size={12} /> Jam Mulai Terawal
            </label>
            <input
              id="task-start-time"
              type="time"
              className="form-input"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="--:--"
            />
            <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', display: 'block' }}>
              Hanya boleh mulai ≥ jam ini
            </span>
          </div>
        </div>

        {/* Baris 2: Jadwal Selesai */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="task-end-date">
              <Calendar size={12} /> Tgl Batas Akhir
            </label>
            <input
              id="task-end-date"
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="task-end-time">
              <Clock size={12} /> Batas Jam Selesai
            </label>
            <input
              id="task-end-time"
              type="time"
              className="form-input"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder="--:--"
            />
            <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', display: 'block' }}>
              Harus selesai ≤ jam ini
            </span>
          </div>
        </div>

        {/* Baris 3: Estimasi Durasi Usaha (Jam Kerja) */}
        <div className="form-group" style={{ marginTop: '6px' }}>
          <label className="form-label" htmlFor="task-effort-hours">
            Estimasi Usaha Total (Jam)
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              id="task-effort-hours"
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
          <span className="form-help">
            Digunakan AI untuk membagi ke sesi-sesi kosong jika ada jadwal lain yang memotong.
          </span>
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

      {/* Prioritas Selector */}
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
        <label className="form-label" htmlFor="task-category">
          <Tag size={13} /> Kategori
        </label>
        <select
          id="task-category"
          className="form-select"
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
        >
          <option value="Pekerjaan">💼 Pekerjaan</option>
          <option value="Pribadi">🏠 Pribadi</option>
          <option value="Belajar">📚 Belajar</option>
          <option value="Kesehatan">🏃 Kesehatan</option>
          <option value="Istirahat">☕ Istirahat & Recharge</option>
          <option value="Lainnya">✨ Lainnya</option>
        </select>
      </div>

      {/* Dynamic Sub-task Builder */}
      <div className="form-group">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
          <label className="form-label" style={{ marginBottom: 0 }}>
            <CheckCircle2 size={13} /> Sub-task (Opsional)
          </label>
          <button
            type="button"
            className="meta-ai-btn"
            onClick={handleGenerateAI}
            disabled={isGeneratingAI}
            title="Buat sub-tugas otomatis berdasarkan judul & catatan tugas"
          >
            {isGeneratingAI ? (
              <Loader2 size={11} className="spin" />
            ) : (
              <Sparkles size={11} />
            )}
            <span>{isGeneratingAI ? 'AI membuatkan...' : '✨ Buat dengan AI'}</span>
          </button>
        </div>
        <div className="subtask-builder-wrapper">
          <div className="subtask-input-row">
            <input
              type="text"
              className="form-input"
              placeholder="Tambahkan langkah/sub-task..."
              value={currentSubTaskInput}
              onChange={(e) => setCurrentSubTaskInput(e.target.value)}
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

      {/* Tombol Simpan */}
      <button type="submit" className="btn-primary">
        <Plus size={18} /> Simpan Task Baru
      </button>
    </form>
  );
};
