'use client';

import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { getFormattedDate } from '../data/seedTasks';
import { Priority, Category, SubTask, InboxType, RecurrenceType } from '../types/task';
import {
  Plus,
  Trash2,
  Calendar,
  Clock,
  Tag,
  Flag,
  CheckCircle2,
  Sparkles,
  Loader2,
  CheckSquare,
  Bell,
  Repeat,
  HeartHandshake,
  ChevronDown,
  ChevronUp,
  X,
  Zap,
} from 'lucide-react';
import { generateSubTasksWithAI } from '../services/geminiService';

export interface TaskFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  defaultRelationshipId?: string;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  onSuccess,
  onCancel,
  defaultRelationshipId,
}) => {
  const {
    addTask,
    showToast,
    relationships,
    getActiveTaskForRelationship,
    setIsTaskFormOpen,
  } = useTask();

  const [inboxType, setInboxType] = useState<InboxType>('tugas');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Peran / Relasi yang dipilih (Opsional)
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string>(
    defaultRelationshipId || ''
  );

  // Jadwal Tanggal & Jam Cepat
  const [selectedDatePreset, setSelectedDatePreset] = useState<'today' | 'tomorrow' | 'dayAfter' | 'custom'>('today');
  const [dueDate, setDueDate] = useState(getFormattedDate(0));
  const [dueTime, setDueTime] = useState('');

  // Jadwal Detail Lanjutan (Collapsible)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [startDate, setStartDate] = useState(getFormattedDate(0));
  const [startTime, setStartTime] = useState('');
  const [effortHours, setEffortHours] = useState<number | ''>('');
  const [allowConcurrent, setAllowConcurrent] = useState(false);

  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<Category>(
    defaultRelationshipId ? 'Relasi' : 'Pekerjaan'
  );

  // Dynamic Subtasks Builder
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [currentSubTaskInput, setCurrentSubTaskInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Sinkronisasi defaultRelationshipId jika berubah
  useEffect(() => {
    if (defaultRelationshipId) {
      setSelectedRelationshipId(defaultRelationshipId);
      setCategory('Relasi');
    }
  }, [defaultRelationshipId]);

  // Tangani shortcut tanggal cepat
  const handleDatePreset = (preset: 'today' | 'tomorrow' | 'dayAfter') => {
    setSelectedDatePreset(preset);
    const dayOffset = preset === 'today' ? 0 : preset === 'tomorrow' ? 1 : 2;
    const formatted = getFormattedDate(dayOffset);
    setDueDate(formatted);
    setStartDate(formatted);
  };

  // Tangani shortcut jam cepat
  const handleTimePreset = (timeStr: string) => {
    setDueTime(timeStr);
    if (!startTime && timeStr) {
      setStartTime(timeStr);
    }
  };

  // Handle Generate Sub-tasks dengan AI
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

  // Handle Submit Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Judul wajib diisi');
      return;
    }

    // Periksa apakah memilih relasi yang sudah punya tugas aktif
    if (selectedRelationshipId) {
      const activeTask = getActiveTaskForRelationship(selectedRelationshipId);
      if (activeTask) {
        const rel = relationships.find((r) => r.id === selectedRelationshipId);
        const relName = rel ? rel.roleName : 'Relasi ini';
        setErrorMsg(
          `Hubungan "${relName}" sudah memiliki 1 aktivitas aktif ("${activeTask.title}"). Setiap hubungan dibatasi 1 tugas fokus agar tidak terpecah.`
        );
        return;
      }
    }

    const isUserStartTimeFixed = Boolean(startTime.trim());
    const isUserEndTimeFixed = Boolean(dueTime.trim());
    const finalDate = dueDate || startDate || getFormattedDate(0);

    const targetRel = relationships.find((r) => r.id === selectedRelationshipId);

    addTask({
      title: title.trim(),
      description: description.trim() || undefined,
      inboxType,
      recurrence,
      dueDate: finalDate,
      dueTime: dueTime.trim() || undefined,
      startDate: startDate || finalDate,
      startTime: startTime.trim() || undefined,
      endDate: finalDate,
      endTime: dueTime.trim() || undefined,
      isUserStartTimeFixed,
      isUserEndTimeFixed,
      effortHours: effortHours ? Number(effortHours) : undefined,
      estimatedTime: effortHours ? `${effortHours} jam` : undefined,
      allowConcurrent,
      priority,
      category: selectedRelationshipId ? 'Relasi' : category,
      relationshipRole: selectedRelationshipId || undefined,
      relationshipName: targetRel ? targetRel.roleName : undefined,
      isCompleted: false,
      subTasks,
    });

    if (onSuccess) {
      onSuccess();
    } else {
      setIsTaskFormOpen(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="task-fast-form">
      {/* 1. Tipe Item: Segmented Pills Nyaman */}
      <div className="fast-form-section">
        <label className="fast-form-label">
          Jenis Catatan <span className="req-star">*</span>
        </label>
        <div className="fast-inbox-type-grid">
          <button
            type="button"
            className={`fast-type-card ${inboxType === 'tugas' ? 'active tugas' : ''}`}
            onClick={() => setInboxType('tugas')}
          >
            <CheckSquare size={16} />
            <div className="type-card-texts">
              <span className="type-card-name">Tugas</span>
              <span className="type-card-hint">Pekerjaan & to-do</span>
            </div>
          </button>

          <button
            type="button"
            className={`fast-type-card ${inboxType === 'kegiatan' ? 'active kegiatan' : ''}`}
            onClick={() => {
              setInboxType('kegiatan');
              setShowAdvanced(true);
            }}
          >
            <Calendar size={16} />
            <div className="type-card-texts">
              <span className="type-card-name">Acara</span>
              <span className="type-card-hint">Agenda & rapat</span>
            </div>
          </button>

          <button
            type="button"
            className={`fast-type-card ${inboxType === 'pengingat' ? 'active pengingat' : ''}`}
            onClick={() => setInboxType('pengingat')}
          >
            <Bell size={16} />
            <div className="type-card-texts">
              <span className="type-card-name">Pengingat</span>
              <span className="type-card-hint">Memo & notifikasi</span>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Judul Task Utama */}
      <div className="fast-form-section">
        <div className="fast-label-row">
          <label className="fast-form-label" htmlFor="fast-task-title">
            {inboxType === 'kegiatan'
              ? 'Nama Kegiatan / Acara'
              : inboxType === 'pengingat'
              ? 'Pengingat Untuk'
              : 'Judul Tugas'}
            <span className="req-star"> *</span>
          </label>
        </div>
        <input
          id="fast-task-title"
          type="text"
          className="fast-text-input primary-title"
          placeholder={
            inboxType === 'kegiatan'
              ? 'Contoh: Rapat evaluasi program kerja...'
              : inboxType === 'pengingat'
              ? 'Contoh: Ingat bayar tagihan listrik...'
              : 'Contoh: Siapkan laporan mingguan...'
          }
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errorMsg) setErrorMsg('');
          }}
          autoFocus
        />
        {errorMsg && <p className="fast-error-banner">{errorMsg}</p>}
      </div>

      {/* 3. Peran & Hubungan (Relasi) - Trigger Psikologis & Pembatasan 1 Tugas */}
      <div className="fast-form-section">
        <div className="fast-label-row">
          <label className="fast-form-label">
            <HeartHandshake size={14} className="label-icon rel-icon" />
            <span>Peran & Hubungan (Opsional)</span>
          </label>
          <span className="fast-label-subtext">Maks 1 aktivitas per hubungan</span>
        </div>
        <div className="relationship-chips-scroll">
          <button
            type="button"
            className={`rel-selector-chip ${!selectedRelationshipId ? 'active' : ''}`}
            onClick={() => {
              setSelectedRelationshipId('');
              if (category === 'Relasi') setCategory('Pribadi');
            }}
          >
            <span>Diri Sendiri / Umum</span>
          </button>
          {relationships.map((rel) => {
            const activeTask = getActiveTaskForRelationship(rel.id);
            const isFull = Boolean(activeTask);
            const isSelected = selectedRelationshipId === rel.id;

            return (
              <button
                key={rel.id}
                type="button"
                className={`rel-selector-chip ${isSelected ? 'active' : ''} ${
                  isFull && !isSelected ? 'disabled-full' : ''
                }`}
                onClick={() => {
                  if (isFull && !isSelected) {
                    showToast(
                      `Hubungan "${rel.roleName}" sudah memiliki 1 tugas aktif: "${activeTask?.title}". Selesaikan tugas tersebut terlebih dahulu.`
                    );
                    return;
                  }
                  setSelectedRelationshipId(isSelected ? '' : rel.id);
                  setCategory('Relasi');
                }}
                title={
                  isFull && !isSelected
                    ? `Sudah ada 1 tugas aktif: ${activeTask?.title}`
                    : `Tugaskan untuk peran ${rel.roleName}`
                }
              >
                <span className="rel-chip-dot" style={{ backgroundColor: rel.color }} />
                <span>{rel.roleName}</span>
                {isFull && !isSelected && (
                  <span className="rel-full-badge">1/1 Aktif</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Shortcut Tanggal & Jam Cepat (1-Tap) */}
      <div className="fast-form-section">
        <label className="fast-form-label">
          <Calendar size={13} className="label-icon" />
          <span>Waktu Penyelesaian</span>
        </label>

        {/* Date Quick Presets */}
        <div className="fast-date-presets">
          <button
            type="button"
            className={`fast-preset-chip ${selectedDatePreset === 'today' ? 'active' : ''}`}
            onClick={() => handleDatePreset('today')}
          >
            Hari Ini
          </button>
          <button
            type="button"
            className={`fast-preset-chip ${selectedDatePreset === 'tomorrow' ? 'active' : ''}`}
            onClick={() => handleDatePreset('tomorrow')}
          >
            Besok
          </button>
          <button
            type="button"
            className={`fast-preset-chip ${selectedDatePreset === 'dayAfter' ? 'active' : ''}`}
            onClick={() => handleDatePreset('dayAfter')}
          >
            Lusa
          </button>
          <div className="custom-date-input-box">
            <input
              type="date"
              className="fast-date-picker-input"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                setStartDate(e.target.value);
                setSelectedDatePreset('custom');
              }}
              title="Pilih tanggal manual"
            />
          </div>
        </div>

        {/* Time Quick Presets */}
        <div className="fast-time-presets">
          <span className="time-preset-label">Jam:</span>
          {[
            { label: '08:00', time: '08:00' },
            { label: '13:00', time: '13:00' },
            { label: '16:00', time: '16:00' },
            { label: '19:00', time: '19:00' },
          ].map((item) => (
            <button
              key={item.time}
              type="button"
              className={`fast-time-chip ${dueTime === item.time ? 'active' : ''}`}
              onClick={() => handleTimePreset(dueTime === item.time ? '' : item.time)}
            >
              {item.label}
            </button>
          ))}
          <input
            type="time"
            className="fast-time-picker-input"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            title="Pilih jam tepat"
          />
          {dueTime && (
            <button
              type="button"
              className="fast-time-clear-btn"
              onClick={() => setDueTime('')}
              title="Hapus jam"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* 5. Prioritas & Kategori */}
      <div className="fast-form-row">
        {/* Prioritas */}
        <div className="fast-form-col">
          <label className="fast-form-label">
            <Flag size={13} className="label-icon" /> Prioritas
          </label>
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

        {/* Kategori */}
        <div className="fast-form-col">
          <label className="fast-form-label" htmlFor="fast-category-select">
            <Tag size={13} className="label-icon" /> Kategori
          </label>
          <select
            id="fast-category-select"
            className="fast-select-input"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          >
            <option value="Pekerjaan">💼 Pekerjaan</option>
            <option value="Pribadi">🏠 Pribadi</option>
            <option value="Relasi">🤝 Relasi & Peran</option>
            <option value="Belajar">📚 Belajar</option>
            <option value="Kesehatan">🏃 Kesehatan</option>
            <option value="Istirahat">☕ Istirahat</option>
            <option value="Lainnya">✨ Lainnya</option>
          </select>
        </div>
      </div>

      {/* 6. Catatan / Deskripsi Singkat */}
      <div className="fast-form-section">
        <label className="fast-form-label" htmlFor="fast-task-desc">
          Catatan / Rincian Singkat
        </label>
        <textarea
          id="fast-task-desc"
          className="fast-text-area"
          rows={2}
          placeholder="Catatan tambahan, konteks, atau lokasi..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* 7. Akordeon Opsi Lanjutan & Sub-Task AI */}
      <div className="fast-advanced-accordion">
        <button
          type="button"
          className="fast-advanced-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span className="adv-title">
            <Zap size={14} className="adv-icon" />
            <span>Opsi Lanjutan & Sub-Task AI</span>
          </span>
          {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showAdvanced && (
          <div className="fast-advanced-content">
            {/* Durasi & Rutin */}
            <div className="fast-form-row">
              <div className="fast-form-col">
                <label className="fast-form-label" htmlFor="fast-effort">
                  Estimasi Usaha (Jam)
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    id="fast-effort"
                    type="number"
                    step="0.5"
                    min="0.25"
                    max="24"
                    className="fast-text-input"
                    placeholder="Contoh: 2"
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

              <div className="fast-form-col">
                <label className="fast-form-label" htmlFor="fast-recurrence">
                  <Repeat size={13} className="label-icon" /> Rutinitas
                </label>
                <select
                  id="fast-recurrence"
                  className="fast-select-input"
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                >
                  <option value="none">Sekali Saja</option>
                  <option value="daily">🔁 Setiap Hari</option>
                  <option value="weekdays">🔁 Hari Kerja (Senin - Jumat)</option>
                  <option value="weekly">🔁 Setiap Minggu</option>
                  <option value="monthly">🔁 Setiap Bulan</option>
                </select>
              </div>
            </div>

            {/* Checkbox Multitasking */}
            <label className="fast-checkbox-label">
              <input
                type="checkbox"
                checked={allowConcurrent}
                onChange={(e) => setAllowConcurrent(e.target.checked)}
              />
              <span>Bisa dikerjakan bersamaan dengan aktivitas lain (Multitasking)</span>
            </label>

            {/* Sub-Task AI Builder */}
            <div className="fast-subtasks-box">
              <div className="subtask-header-row">
                <span className="subtask-title">
                  <CheckCircle2 size={13} /> Sub-task ({subTasks.length})
                </span>
                <button
                  type="button"
                  className="fast-ai-gen-btn"
                  onClick={handleGenerateAI}
                  disabled={isGeneratingAI}
                >
                  {isGeneratingAI ? (
                    <>
                      <Loader2 size={12} className="spin" />
                      <span>Membuat...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} />
                      <span>✨ Buat dengan AI</span>
                    </>
                  )}
                </button>
              </div>

              <div className="fast-subtask-input-row">
                <input
                  type="text"
                  className="fast-text-input"
                  placeholder="Tambahkan langkah/sub-task..."
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
                  className="fast-btn-add-sub"
                  onClick={handleAddSubTask}
                >
                  <Plus size={14} />
                </button>
              </div>

              {subTasks.length > 0 && (
                <div className="fast-subtask-chip-list">
                  {subTasks.map((st, idx) => (
                    <div key={st.id} className="fast-subtask-item">
                      <span>
                        {idx + 1}. {st.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubTask(st.id)}
                        className="btn-del-sub"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 8. Tombol Tindakan Footer (Batal & Simpan) */}
      <div className="fast-form-actions">
        {onCancel && (
          <button
            type="button"
            className="fast-btn-cancel"
            onClick={onCancel}
          >
            Batal
          </button>
        )}
        <button type="submit" className="fast-btn-submit">
          <Plus size={17} strokeWidth={2.5} />
          <span>Simpan ke Inbox</span>
        </button>
      </div>
    </form>
  );
};
