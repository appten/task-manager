'use client';

import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { Priority, Category, SubTask, Task, InboxType, RecurrenceType } from '../types/task';
import { getFormattedDate } from '../data/seedTasks';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Tag,
  Flag,
  CheckSquare,
  Bell,
  Repeat,
  Sparkles,
  Loader2,
  AlignLeft,
} from 'lucide-react';
import { generateSubTasksWithAI } from '../services/geminiService';

export const EditTaskModal: React.FC = () => {
  const { editingTask, setEditingTask, updateTask, showToast } = useTask();

  // 1. Jenis Catatan
  const [inboxType, setInboxType] = useState<InboxType>('tugas');

  // 2. Judul
  const [title, setTitle] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 3. Deskripsi
  const [showDesc, setShowDesc] = useState(false);
  const [description, setDescription] = useState('');

  // 4. Waktu & Jadwal (Timestamp Mulai & Selesai)
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  // 5. Pengulangan (Tepat setelah tanggal & waktu)
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');

  // 6. Sub-tugas
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [currentSubTaskInput, setCurrentSubTaskInput] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // 7. Prioritas (Teks kecil toggle)
  const [showPriority, setShowPriority] = useState(false);
  const [priority, setPriority] = useState<Priority>('medium');

  // 8. Kategori (Teks kecil toggle)
  const [showCategory, setShowCategory] = useState(false);
  const [category, setCategory] = useState<Category>('Pekerjaan');

  // 9. Estimasi Waktu (Teks kecil toggle)
  const [showEffort, setShowEffort] = useState(false);
  const [effortHours, setEffortHours] = useState<number | ''>('');

  useEffect(() => {
    if (editingTask) {
      setInboxType(editingTask.inboxType || 'tugas');
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setShowDesc(Boolean(editingTask.description));

      setStartDate(editingTask.startDate || editingTask.dueDate || '');
      setStartTime(editingTask.startTime || '');
      setEndDate(editingTask.endDate || editingTask.dueDate || '');
      setEndTime(editingTask.endTime || editingTask.dueTime || '');

      setRecurrence(editingTask.recurrence || 'none');
      setSubTasks(editingTask.subTasks || []);
      setShowSubtasks((editingTask.subTasks && editingTask.subTasks.length > 0) || false);

      setPriority(editingTask.priority);
      setCategory(editingTask.category);
      setEffortHours(editingTask.effortHours !== undefined ? editingTask.effortHours : '');
      setShowEffort(editingTask.effortHours !== undefined && editingTask.effortHours > 0);
      setErrorMsg('');
    }
  }, [editingTask]);

  if (!editingTask) return null;

  // Handle Preset Cepat Tanggal
  const handleDatePreset = (preset: 'today' | 'tomorrow' | 'dayAfter') => {
    const dayOffset = preset === 'today' ? 0 : preset === 'tomorrow' ? 1 : 2;
    const formatted = getFormattedDate(dayOffset);
    setStartDate(formatted);
    setEndDate(formatted);
  };

  // AI Sub-tasks Generator
  const handleGenerateAI = async () => {
    if (!title.trim()) {
      setErrorMsg('Ketik judul tugas terlebih dahulu agar AI bisa merancang sub-tugas.');
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
        setShowSubtasks(true);
        showToast(`AI menambahkan ${generated.length} sub-tugas! ✨`);
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Judul task wajib diisi');
      return;
    }

    const isUserStartTimeFixed = Boolean(startTime.trim());
    const isUserEndTimeFixed = Boolean(endTime.trim());
    const finalDueDate = endDate || startDate || editingTask.dueDate || getFormattedDate(0);

    const updated: Task = {
      ...editingTask,
      title: title.trim(),
      description: description.trim() || undefined,
      inboxType,
      recurrence,
      dueDate: finalDueDate,
      dueTime: endTime.trim() || undefined,
      startDate: startDate || undefined,
      startTime: startTime.trim() || undefined,
      endDate: endDate || undefined,
      endTime: endTime.trim() || undefined,
      isUserStartTimeFixed,
      isUserEndTimeFixed,
      effortHours: effortHours ? Number(effortHours) : undefined,
      estimatedTime: effortHours ? `${effortHours} jam` : editingTask.estimatedTime,
      priority,
      category,
      subTasks,
    };

    updateTask(updated);
    setEditingTask(null);
  };

  return (
    <div className="modal-overlay" onClick={() => setEditingTask(null)}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle-bar" />

        <div className="sheet-header">
          <div className="sheet-title">Edit Item Inbox</div>
          <button
            type="button"
            className="android-icon-btn"
            onClick={() => setEditingTask(null)}
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="task-fast-form" style={{ padding: '4px 0 16px 0' }}>
          {/* 1. Jenis Catatan */}
          <div className="fast-form-group">
            <label className="fast-section-label">
              Jenis Catatan <span className="req-star">*</span>
            </label>
            <div className="fast-inbox-type-grid">
              <button
                type="button"
                className={`fast-type-card ${inboxType === 'tugas' ? 'active tugas' : ''}`}
                onClick={() => setInboxType('tugas')}
              >
                <div className="type-icon-wrapper">
                  <CheckSquare size={16} />
                </div>
                <div className="type-card-texts">
                  <span className="type-card-name">Tugas</span>
                  <span className="type-card-hint">To-do & aksi</span>
                </div>
              </button>

              <button
                type="button"
                className={`fast-type-card ${inboxType === 'kegiatan' ? 'active kegiatan' : ''}`}
                onClick={() => setInboxType('kegiatan')}
              >
                <div className="type-icon-wrapper">
                  <Calendar size={16} />
                </div>
                <div className="type-card-texts">
                  <span className="type-card-name">Acara</span>
                  <span className="type-card-hint">Rapat & jadwal</span>
                </div>
              </button>

              <button
                type="button"
                className={`fast-type-card ${inboxType === 'pengingat' ? 'active pengingat' : ''}`}
                onClick={() => setInboxType('pengingat')}
              >
                <div className="type-icon-wrapper">
                  <Bell size={16} />
                </div>
                <div className="type-card-texts">
                  <span className="type-card-name">Pengingat</span>
                  <span className="type-card-hint">Memo & alarm</span>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Judul Pokok */}
          <div className="fast-form-group">
            <label className="fast-section-label" htmlFor="edit-task-title">
              {inboxType === 'kegiatan'
                ? 'Nama Kegiatan / Acara'
                : inboxType === 'pengingat'
                ? 'Pengingat Untuk'
                : 'Judul Tugas'}
              <span className="req-star"> *</span>
            </label>
            <input
              id="edit-task-title"
              type="text"
              className="fast-text-input primary-title"
              placeholder="Tuliskan judul tugas atau acara..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              autoFocus
            />
            {errorMsg && <p className="fast-error-banner">{errorMsg}</p>}

            {/* 3. Deskripsi: Berupa teks kecil toggle di bawah judul */}
            <div className="fast-desc-toggle-wrapper">
              {!showDesc ? (
                <button
                  type="button"
                  className="fast-small-toggle-btn"
                  onClick={() => setShowDesc(true)}
                >
                  <AlignLeft size={12} />
                  <span>{description ? 'Edit deskripsi / keterangan' : '+ Tambah deskripsi / keterangan'}</span>
                </button>
              ) : (
                <div className="fast-desc-box animate-fade-in">
                  <div className="fast-desc-header">
                    <span className="fast-desc-label">
                      <AlignLeft size={12} /> Deskripsi / Keterangan
                    </span>
                    <button
                      type="button"
                      className="fast-desc-hide-btn"
                      onClick={() => setShowDesc(false)}
                    >
                      {description ? 'Tutup' : 'Batal'}
                    </button>
                  </div>
                  <textarea
                    id="edit-task-desc"
                    className="fast-text-area"
                    rows={2}
                    placeholder="Detail catatan, tautan, lokasi, atau instruksi..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 4. Waktu & Jadwal: Timestamp Mulai & Timestamp Selesai (Opsional) */}
          <div className="fast-form-group">
            <div className="fast-schedule-header-row">
              <label className="fast-section-label">
                <Calendar size={13} className="label-icon" />
                <span>Waktu & Jadwal</span>
              </label>
              {/* Preset Tanggal Cepat */}
              <div className="fast-quick-presets">
                <button
                  type="button"
                  className="fast-quick-preset-chip"
                  onClick={() => handleDatePreset('today')}
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  className="fast-quick-preset-chip"
                  onClick={() => handleDatePreset('tomorrow')}
                >
                  Besok
                </button>
                <button
                  type="button"
                  className="fast-quick-preset-chip"
                  onClick={() => handleDatePreset('dayAfter')}
                >
                  Lusa
                </button>
              </div>
            </div>

            <div className="fast-timestamp-grid">
              {/* Timestamp Mulai */}
              <div className="fast-timestamp-card">
                <div className="timestamp-card-title">
                  <Clock size={12} className="text-emerald" />
                  <span>Mulai (Opsional)</span>
                </div>
                <div className="timestamp-inputs-row">
                  <div className="timestamp-date-col">
                    <span className="timestamp-input-caption">Tanggal:</span>
                    <input
                      type="date"
                      className="fast-date-picker-input"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      title="Tanggal mulai (opsional)"
                    />
                  </div>
                  <div className="timestamp-time-col">
                    <span className="timestamp-input-caption">Jam:</span>
                    <div className="time-input-with-clear">
                      <input
                        type="time"
                        className="fast-time-picker-input"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        title="Jam mulai (opsional)"
                      />
                      {startTime && (
                        <button
                          type="button"
                          className="fast-time-clear-btn"
                          onClick={() => setStartTime('')}
                          title="Hapus jam"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Timestamp Selesai / Tenggat */}
              <div className="fast-timestamp-card">
                <div className="timestamp-card-title">
                  <Clock size={12} className="text-rose" />
                  <span>Selesai / Batas Akhir (Opsional)</span>
                </div>
                <div className="timestamp-inputs-row">
                  <div className="timestamp-date-col">
                    <span className="timestamp-input-caption">Tanggal:</span>
                    <input
                      type="date"
                      className="fast-date-picker-input"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      title="Tanggal selesai (opsional)"
                    />
                  </div>
                  <div className="timestamp-time-col">
                    <span className="timestamp-input-caption">Jam:</span>
                    <div className="time-input-with-clear">
                      <input
                        type="time"
                        className="fast-time-picker-input"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        title="Jam selesai (opsional)"
                      />
                      {endTime && (
                        <button
                          type="button"
                          className="fast-time-clear-btn"
                          onClick={() => setEndTime('')}
                          title="Hapus jam"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <span className="fast-timestamp-hint">
              * Anda dapat mengatur tanggal saja tanpa jam, atau mengisi salah satu / kedua timestamp sesuai kebutuhan.
            </span>
          </div>

          {/* 5. Bagian Pengulangan (Posisinya Tepat Setelah Tanggal Waktu) */}
          <div className="fast-form-group">
            <label className="fast-section-label" htmlFor="edit-task-recurrence">
              <Repeat size={13} className="label-icon" />
              <span>Pengulangan Jadwal</span>
            </label>
            <select
              id="edit-task-recurrence"
              className="fast-select-input"
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
            >
              <option value="none">Sekali Saja (Tidak Berulang)</option>
              <option value="daily">🔁 Setiap Hari</option>
              <option value="weekdays">🔁 Hari Kerja (Senin - Jumat)</option>
              <option value="weekly">🔁 Setiap Minggu</option>
              <option value="monthly">🔁 Setiap Bulan</option>
            </select>
          </div>

          {/* 6. Bagian Sub Tugas (Di Bawah Pengulangan, Teks Kecil Dulu) */}
          <div className="fast-form-group">
            {!showSubtasks && subTasks.length === 0 ? (
              <button
                type="button"
                className="fast-small-toggle-btn"
                onClick={() => setShowSubtasks(true)}
              >
                <CheckSquare size={12} />
                <span>+ Tambah sub-tugas</span>
              </button>
            ) : (
              <div className="fast-subtasks-panel animate-fade-in">
                <div className="fast-subtasks-header">
                  <span className="fast-subtasks-title">
                    <CheckSquare size={13} />
                    <span>Daftar Sub-tugas ({subTasks.length})</span>
                  </span>
                  <button
                    type="button"
                    className="fast-desc-hide-btn"
                    onClick={() => setShowSubtasks(!showSubtasks)}
                  >
                    {showSubtasks ? 'Sembunyikan' : 'Tampilkan'}
                  </button>
                </div>

                {showSubtasks && (
                  <>
                    {/* List Sub-Tasks */}
                    {subTasks.length > 0 && (
                      <div className="fast-subtask-list">
                        {subTasks.map((st) => (
                          <div key={st.id} className="fast-subtask-item">
                            <span className="subtask-bullet">•</span>
                            <span className="subtask-name">{st.title}</span>
                            <button
                              type="button"
                              className="fast-subtask-del-btn"
                              onClick={() => handleRemoveSubTask(st.id)}
                              title="Hapus sub-tugas"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Input Tambah Sub-Task */}
                    <div className="fast-subtask-input-row">
                      <input
                        type="text"
                        className="fast-text-input mini-subtask-input"
                        placeholder="Tulis langkah sub-tugas..."
                        value={currentSubTaskInput}
                        onChange={(e) => setCurrentSubTaskInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSubTask();
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn-add-subtask"
                        onClick={handleAddSubTask}
                        disabled={!currentSubTaskInput.trim()}
                      >
                        <Plus size={14} />
                        <span>Tambah</span>
                      </button>
                    </div>

                    {/* AI Sub-task Generator */}
                    <button
                      type="button"
                      className="btn-ai-gen-subtasks"
                      onClick={handleGenerateAI}
                      disabled={isGeneratingAI || !title.trim()}
                    >
                      {isGeneratingAI ? (
                        <>
                          <Loader2 size={13} className="spin" />
                          <span>AI sedang merancang...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={13} />
                          <span>Bantu Rancang Sub-tugas dengan AI</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 7, 8, 9: Opsi Tambahan Cepat (Prioritas, Kategori, Estimasi Waktu) Berupa Teks Kecil */}
          <div className="fast-optional-row">
            {/* 7. Prioritas (Teks Kecil Toggle) */}
            <div className="fast-optional-item">
              {!showPriority ? (
                <button
                  type="button"
                  className="fast-small-toggle-btn"
                  onClick={() => setShowPriority(true)}
                >
                  <Flag size={12} />
                  <span>
                    Prioritas:{' '}
                    <strong className={`prio-val-text ${priority}`}>
                      {priority === 'high' ? 'Tinggi' : priority === 'medium' ? 'Sedang' : 'Rendah'}
                    </strong>
                  </span>
                </button>
              ) : (
                <div className="fast-toggle-card animate-fade-in">
                  <div className="toggle-card-header">
                    <span className="toggle-card-title">
                      <Flag size={12} /> Atur Prioritas
                    </span>
                    <button
                      type="button"
                      className="fast-desc-hide-btn"
                      onClick={() => setShowPriority(false)}
                    >
                      Tutup
                    </button>
                  </div>
                  <div className="fast-priority-group">
                    <button
                      type="button"
                      className={`fast-prio-btn low ${priority === 'low' ? 'active' : ''}`}
                      onClick={() => setPriority('low')}
                    >
                      Rendah
                    </button>
                    <button
                      type="button"
                      className={`fast-prio-btn medium ${priority === 'medium' ? 'active' : ''}`}
                      onClick={() => setPriority('medium')}
                    >
                      Sedang
                    </button>
                    <button
                      type="button"
                      className={`fast-prio-btn high ${priority === 'high' ? 'active' : ''}`}
                      onClick={() => setPriority('high')}
                    >
                      Tinggi
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 8. Kategori (Teks Kecil Toggle) */}
            <div className="fast-optional-item">
              {!showCategory ? (
                <button
                  type="button"
                  className="fast-small-toggle-btn"
                  onClick={() => setShowCategory(true)}
                >
                  <Tag size={12} />
                  <span>
                    Kategori: <strong>{category}</strong>
                  </span>
                </button>
              ) : (
                <div className="fast-toggle-card animate-fade-in">
                  <div className="toggle-card-header">
                    <span className="toggle-card-title">
                      <Tag size={12} /> Pilih Kategori
                    </span>
                    <button
                      type="button"
                      className="fast-desc-hide-btn"
                      onClick={() => setShowCategory(false)}
                    >
                      Tutup
                    </button>
                  </div>
                  <select
                    className="fast-select-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                  >
                    <option value="Pekerjaan">💼 Pekerjaan</option>
                    <option value="Pribadi">🏠 Pribadi</option>
                    <option value="Belajar">📚 Belajar</option>
                    <option value="Kesehatan">🏃 Kesehatan</option>
                    <option value="Istirahat">☕ Istirahat</option>
                    <option value="Relasi">🤝 Relasi</option>
                    <option value="Lainnya">✨ Lainnya</option>
                  </select>
                </div>
              )}
            </div>

            {/* 9. Estimasi Waktu (Teks Kecil Toggle) */}
            <div className="fast-optional-item">
              {!showEffort ? (
                <button
                  type="button"
                  className="fast-small-toggle-btn"
                  onClick={() => setShowEffort(true)}
                >
                  <Clock size={12} />
                  <span>
                    {effortHours ? `Estimasi: ${effortHours} jam` : '+ Atur estimasi waktu'}
                  </span>
                </button>
              ) : (
                <div className="fast-toggle-card animate-fade-in">
                  <div className="toggle-card-header">
                    <span className="toggle-card-title">
                      <Clock size={12} /> Estimasi Waktu Pengerjaan
                    </span>
                    <button
                      type="button"
                      className="fast-desc-hide-btn"
                      onClick={() => setShowEffort(false)}
                    >
                      Tutup
                    </button>
                  </div>
                  <div className="fast-effort-input-row">
                    <input
                      type="number"
                      step="0.5"
                      min="0.25"
                      max="24"
                      className="fast-text-input effort-num-input"
                      placeholder="Jam (e.g. 1.5)"
                      value={effortHours}
                      onChange={(e) =>
                        setEffortHours(e.target.value ? parseFloat(e.target.value) : '')
                      }
                    />
                    <div className="fast-quick-effort-chips">
                      {[0.5, 1, 2, 4].map((h) => (
                        <button
                          key={h}
                          type="button"
                          className={`mini-effort-btn ${effortHours === h ? 'active' : ''}`}
                          onClick={() => setEffortHours(h)}
                        >
                          {h >= 1 ? `${h}j` : '30m'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tombol Aksi Form */}
          <div className="fast-form-actions" style={{ marginTop: '14px' }}>
            <button
              type="button"
              className="fast-btn-cancel"
              onClick={() => setEditingTask(null)}
            >
              Batal
            </button>
            <button
              type="submit"
              className="fast-btn-submit"
              disabled={!title.trim()}
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
