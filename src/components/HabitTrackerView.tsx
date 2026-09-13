'use client';

import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { HabitItem, HabitFrequency } from '../types/habit';
import {
  Sparkles,
  Plus,
  Check,
  Calendar,
  Clock,
  Trash2,
  AlertCircle,
  Flame,
  Target,
  Repeat,
  CheckCircle2,
  X,
  Info,
  CalendarDays,
} from 'lucide-react';

const STORAGE_HABITS_KEY = 'ten_habits_v1';

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const SHORT_DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const HabitTrackerView: React.FC = () => {
  const { userGoal, showToast } = useTask();

  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [customDays, setCustomDays] = useState<number[]>([1, 2, 3, 4, 5]);

  // Weekly routine states (Max 1 per habit)
  const [enableWeeklyRoutine, setEnableWeeklyRoutine] = useState(false);
  const [weeklyTitle, setWeeklyTitle] = useState('');
  const [weeklyDay, setWeeklyDay] = useState<number>(0); // 0 = Minggu
  const [weeklyTime, setWeeklyTime] = useState('09:00');

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_HABITS_KEY);
      if (saved) {
        setHabits(JSON.parse(saved));
      } else {
        // Seed contoh habit pertama jika belum ada
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        const todayStr = `${y}-${m}-${d}`;
        const nextMonth = new Date(today);
        nextMonth.setDate(today.getDate() + 30);
        const ny = nextMonth.getFullYear();
        const nm = String(nextMonth.getMonth() + 1).padStart(2, '0');
        const nd = String(nextMonth.getDate()).padStart(2, '0');
        const nextMonthStr = `${ny}-${nm}-${nd}`;

        const initialHabits: HabitItem[] = [
          {
            id: 'habit-seed-1',
            title: 'Membaca Buku & Refleksi 20 Menit',
            description: 'Memperluas wawasan dan mendukung pengembangan diri yang berkesinambungan.',
            startDate: todayStr,
            endDate: nextMonthStr,
            frequency: 'daily',
            weeklyRoutine: {
              title: 'Evaluasi & Rangkum Pelajaran Mingguan',
              dayOfWeek: 0,
              time: '19:30',
            },
            completedDates: [],
            createdAt: new Date().toISOString(),
          },
        ];
        setHabits(initialHabits);
        localStorage.setItem(STORAGE_HABITS_KEY, JSON.stringify(initialHabits));
      }
    } catch {}
  }, []);

  // Save to localStorage
  const saveHabits = (newHabits: HabitItem[]) => {
    setHabits(newHabits);
    try {
      localStorage.setItem(STORAGE_HABITS_KEY, JSON.stringify(newHabits));
    } catch {}
  };

  const todayDateStr = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();

  const currentDayOfWeek = new Date().getDay();

  // Helper current week key, e.g. "2026-W37"
  const getCurrentWeekKey = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
    const weekNum = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${weekNum}`;
  };

  // Toggle habit check-in for today
  const handleToggleHabitToday = (habitId: string) => {
    const updated = habits.map((h) => {
      if (h.id !== habitId) return h;
      const isDoneToday = h.completedDates.includes(todayDateStr);
      let newDates: string[];
      if (isDoneToday) {
        newDates = h.completedDates.filter((d) => d !== todayDateStr);
      } else {
        newDates = [...h.completedDates, todayDateStr];
      }
      return { ...h, completedDates: newDates };
    });
    saveHabits(updated);
    showToast('Progres habit berhasil diperbarui! Tetap konsisten 🎯');
  };

  // Toggle weekly routine check-in
  const handleToggleWeeklyRoutine = (habitId: string) => {
    const weekKey = getCurrentWeekKey();
    const updated = habits.map((h) => {
      if (h.id !== habitId || !h.weeklyRoutine) return h;
      const isCompleted = h.weeklyRoutine.lastCompletedWeek === weekKey;
      return {
        ...h,
        weeklyRoutine: {
          ...h.weeklyRoutine,
          lastCompletedWeek: isCompleted ? undefined : weekKey,
        },
      };
    });
    saveHabits(updated);
    showToast('Aktivitas mingguan berhasil diperbarui! ✨');
  };

  // Delete habit
  const handleDeleteHabit = (id: string, habitTitle: string) => {
    if (window.confirm(`Hapus habit "${habitTitle}"?`)) {
      const filtered = habits.filter((h) => h.id !== id);
      saveHabits(filtered);
      showToast('Habit berhasil dihapus');
    }
  };

  // Reset form
  const handleOpenCreateForm = () => {
    if (habits.length >= 3) {
      showToast('Maksimal 3 habit aktif untuk menjaga fokus & kualitas konsistensi Anda.');
      return;
    }
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    const nextMonth = new Date(today);
    nextMonth.setDate(today.getDate() + 30);
    const ny = nextMonth.getFullYear();
    const nm = String(nextMonth.getMonth() + 1).padStart(2, '0');
    const nd = String(nextMonth.getDate()).padStart(2, '0');
    const nextMonthStr = `${ny}-${nm}-${nd}`;

    setTitle('');
    setDescription('');
    setStartDate(todayStr);
    setEndDate(nextMonthStr);
    setFrequency('daily');
    setCustomDays([1, 2, 3, 4, 5]);
    setEnableWeeklyRoutine(false);
    setWeeklyTitle('');
    setWeeklyDay(0);
    setWeeklyTime('09:00');
    setIsFormOpen(true);
  };

  const handleSaveHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Nama habit wajib diisi');
      return;
    }
    if (!startDate || !endDate) {
      showToast('Tanggal mulai dan berakhir wajib diisi');
      return;
    }
    if (startDate > endDate) {
      showToast('Tanggal mulai tidak boleh melebihi tanggal berakhir');
      return;
    }
    if (habits.length >= 3) {
      showToast('Maksimal 3 habit aktif yang diizinkan');
      return;
    }

    const newHabit: HabitItem = {
      id: `habit-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      startDate,
      endDate,
      frequency,
      customDays: frequency === 'specific_days' ? customDays : undefined,
      weeklyRoutine:
        enableWeeklyRoutine && weeklyTitle.trim()
          ? {
              title: weeklyTitle.trim(),
              dayOfWeek: weeklyDay,
              time: weeklyTime || undefined,
            }
          : undefined,
      completedDates: [],
      createdAt: new Date().toISOString(),
    };

    saveHabits([...habits, newHabit]);
    setIsFormOpen(false);
    showToast(`Habit "${newHabit.title}" berhasil ditambahkan! 🚀`);
  };

  // Calculate streak
  const calculateStreak = (completedDates: string[]): number => {
    if (!completedDates || completedDates.length === 0) return 0;
    const sorted = [...completedDates].sort().reverse();
    let streak = 0;
    const checkDate = new Date();

    // Cek apakah hari ini sudah dicentang
    const checkStr = checkDate.toISOString().slice(0, 10);
    if (!sorted.includes(checkStr)) {
      // Jika hari ini belum, periksa apakah kemarin dicentang
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateStr = checkDate.toISOString().slice(0, 10);
      if (sorted.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  return (
    <div className="habit-tracker-container animate-fade-in">
      {/* 1. Banner Peringatan & Keselarasan Goal */}
      <div className="habit-goal-alert-card">
        <div className="habit-goal-lead">
          <div className="habit-goal-icon-badge">
            <Target size={16} />
          </div>
          <div className="habit-goal-texts">
            <h4 className="habit-goal-title">Keselarasan Kebiasaan & Sasaran Hidup</h4>
            <p className="habit-goal-desc">
              Habit atau hobi baru sebaiknya <strong>selaras dan mempercepat Goal utama Anda</strong>
              {userGoal ? `: "${userGoal}"` : ' yang telah ditentukan'}
              . Batasi maksimal <strong>3 habit</strong> agar fokus energi Anda terjaga konsisten.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Sub-Header: Kuota Habit & Tombol Tambah */}
      <div className="habit-section-header">
        <div className="habit-quota-badge">
          <Sparkles size={13} className="text-amber" />
          <span>
            Habit Aktif: <strong>{habits.length}/3</strong>
          </span>
        </div>

        <button
          type="button"
          className="btn-add-habit"
          onClick={handleOpenCreateForm}
          disabled={habits.length >= 3}
          title={
            habits.length >= 3
              ? 'Kuota maksimal 3 habit telah tercapai'
              : 'Tambah Habit Baru (Maks 3)'
          }
        >
          <Plus size={14} />
          <span>Tambah Habit</span>
        </button>
      </div>

      {/* 3. Modal Form Tambah Habit */}
      {isFormOpen && (
        <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div
            className="modal-container habit-form-modal animate-scale-up"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} className="text-amber" />
                <h3 className="modal-title">Tambah Habit Baru (Beta)</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsFormOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveHabit} className="habit-form-body">
              {/* Nama Habit */}
              <div className="habit-form-group">
                <label className="habit-form-label">
                  Nama Kebiasaan / Habit <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="habit-input-text"
                  placeholder="Contoh: Olahraga Pagi 15 Menit / Belajar Coding"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {/* Deskripsi */}
              <div className="habit-form-group">
                <label className="habit-form-label">Catatan / Manfaat</label>
                <input
                  type="text"
                  className="habit-input-text"
                  placeholder="Alasan mengapa habit ini penting untuk tujuan Anda"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Tanggal Mulai & Berakhir */}
              <div className="habit-form-row">
                <div className="habit-form-group half">
                  <label className="habit-form-label">
                    <Calendar size={12} />
                    <span>Mulai</span>
                  </label>
                  <input
                    type="date"
                    className="habit-input-text"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="habit-form-group half">
                  <label className="habit-form-label">
                    <Calendar size={12} />
                    <span>Berakhir</span>
                  </label>
                  <input
                    type="date"
                    className="habit-input-text"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Frekuensi Pengerjaan */}
              <div className="habit-form-group">
                <label className="habit-form-label">
                  <Repeat size={12} />
                  <span>Setiap Kapan Dilakukan?</span>
                </label>
                <div className="habit-freq-tabs">
                  <button
                    type="button"
                    className={`habit-freq-btn ${frequency === 'daily' ? 'active' : ''}`}
                    onClick={() => setFrequency('daily')}
                  >
                    Setiap Hari
                  </button>
                  <button
                    type="button"
                    className={`habit-freq-btn ${frequency === 'weekdays' ? 'active' : ''}`}
                    onClick={() => setFrequency('weekdays')}
                  >
                    Senin - Jumat
                  </button>
                  <button
                    type="button"
                    className={`habit-freq-btn ${frequency === 'specific_days' ? 'active' : ''}`}
                    onClick={() => setFrequency('specific_days')}
                  >
                    Hari Tertentu
                  </button>
                </div>

                {frequency === 'specific_days' && (
                  <div className="habit-days-picker">
                    {SHORT_DAYS.map((dayLabel, idx) => {
                      const isSelected = customDays.includes(idx);
                      return (
                        <button
                          key={idx}
                          type="button"
                          className={`habit-day-chip ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            if (isSelected) {
                              if (customDays.length <= 1) return;
                              setCustomDays(customDays.filter((d) => d !== idx));
                            } else {
                              setCustomDays([...customDays, idx]);
                            }
                          }}
                        >
                          {dayLabel}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 1 Aktivitas Rutin Mingguan Opsional */}
              <div className="habit-weekly-toggle-section">
                <label className="habit-checkbox-label">
                  <input
                    type="checkbox"
                    checked={enableWeeklyRoutine}
                    onChange={(e) => setEnableWeeklyRoutine(e.target.checked)}
                  />
                  <span>Tambahkan 1 aktivitas rutin mingguan (Opsional)</span>
                </label>

                {enableWeeklyRoutine && (
                  <div className="habit-weekly-fields-card">
                    <div className="habit-form-group">
                      <label className="habit-form-label">Nama Aktivitas Mingguan</label>
                      <input
                        type="text"
                        className="habit-input-text"
                        placeholder="Contoh: Belanja bahan sehat / Evaluasi mingguan"
                        value={weeklyTitle}
                        onChange={(e) => setWeeklyTitle(e.target.value)}
                        required={enableWeeklyRoutine}
                      />
                    </div>

                    <div className="habit-form-row">
                      <div className="habit-form-group half">
                        <label className="habit-form-label">Hari Pelaksanaan</label>
                        <select
                          className="habit-input-text"
                          value={weeklyDay}
                          onChange={(e) => setWeeklyDay(Number(e.target.value))}
                        >
                          {DAY_NAMES.map((d, idx) => (
                            <option key={idx} value={idx}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="habit-form-group half">
                        <label className="habit-form-label">
                          <Clock size={12} /> Jam
                        </label>
                        <input
                          type="time"
                          className="habit-input-text"
                          value={weeklyTime}
                          onChange={(e) => setWeeklyTime(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Modal Actions */}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsFormOpen(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn-save-habit-submit">
                  Simpan Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Daftar Habit Cards */}
      <div className="habit-cards-list">
        {habits.length === 0 ? (
          <div className="habit-empty-state">
            <CheckCircle2 size={36} className="text-emerald" />
            <h4 className="habit-empty-title">Belum Ada Habit Terdaftar</h4>
            <p className="habit-empty-desc">
              Mulai bangun kebiasaan baru yang mendukung tujuan Anda. Maksimal 3 habit aktif untuk
              menjaga konsistensi harian.
            </p>
            <button
              type="button"
              className="btn-add-habit"
              onClick={handleOpenCreateForm}
              style={{ marginTop: '12px' }}
            >
              <Plus size={14} />
              <span>Tambah Habit Pertama</span>
            </button>
          </div>
        ) : (
          habits.map((habit) => {
            const isDoneToday = habit.completedDates.includes(todayDateStr);
            const streak = calculateStreak(habit.completedDates);
            const weekKey = getCurrentWeekKey();
            const isWeeklyDone = habit.weeklyRoutine?.lastCompletedWeek === weekKey;

            const isDueToday = (() => {
              if (habit.frequency === 'daily') return true;
              if (habit.frequency === 'weekdays') return currentDayOfWeek >= 1 && currentDayOfWeek <= 5;
              if (habit.frequency === 'specific_days' && habit.customDays) {
                return habit.customDays.includes(currentDayOfWeek);
              }
              return true;
            })();

            return (
              <div
                key={habit.id}
                className={`habit-card ${isDoneToday ? 'is-done-today' : ''}`}
              >
                <div className="habit-card-main">
                  {/* Tombol Checklist Harian Besar & Nyaman */}
                  <button
                    type="button"
                    className={`habit-check-circle ${isDoneToday ? 'checked' : ''}`}
                    onClick={() => handleToggleHabitToday(habit.id)}
                    title={
                      isDoneToday ? 'Tandai belum selesai hari ini' : 'Tandai selesai hari ini'
                    }
                  >
                    {isDoneToday && <Check size={18} strokeWidth={3} />}
                  </button>

                  <div className="habit-card-content">
                    <div className="habit-card-header-line">
                      <h4 className={`habit-title ${isDoneToday ? 'title-done' : ''}`}>
                        {habit.title}
                      </h4>
                      <button
                        type="button"
                        className="btn-delete-habit"
                        onClick={() => handleDeleteHabit(habit.id, habit.title)}
                        title="Hapus habit"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {habit.description && (
                      <p className="habit-description">{habit.description}</p>
                    )}

                    {/* Metadata: Periode & Frekuensi */}
                    <div className="habit-meta-badges">
                      <span className="habit-meta-pill">
                        <Calendar size={11} />
                        <span>
                          {habit.startDate} s/d {habit.endDate}
                        </span>
                      </span>

                      <span className="habit-meta-pill">
                        <Repeat size={11} />
                        <span>
                          {habit.frequency === 'daily'
                            ? 'Setiap Hari'
                            : habit.frequency === 'weekdays'
                            ? 'Senin-Jumat'
                            : 'Hari Pilihan'}
                        </span>
                      </span>

                      {/* Streak Counter */}
                      <span className="habit-streak-badge" title="Runtutan hari konsisten">
                        <Flame size={12} color="#f97316" fill="#f97316" />
                        <span>{streak} Hari Streak</span>
                      </span>
                    </div>

                    {/* Rutinitas Mingguan Card (Maks 1) */}
                    {habit.weeklyRoutine && (
                      <div
                        className={`habit-weekly-routine-box ${isWeeklyDone ? 'weekly-done' : ''}`}
                      >
                        <button
                          type="button"
                          className={`habit-mini-checkbox ${isWeeklyDone ? 'checked' : ''}`}
                          onClick={() => handleToggleWeeklyRoutine(habit.id)}
                          title="Tandai aktivitas mingguan ini tuntas minggu ini"
                        >
                          {isWeeklyDone && <Check size={11} strokeWidth={3} />}
                        </button>
                        <div className="weekly-routine-text-col">
                          <span className="weekly-routine-label">
                            Rutin Mingguan ({DAY_NAMES[habit.weeklyRoutine.dayOfWeek]}
                            {habit.weeklyRoutine.time ? ` • ${habit.weeklyRoutine.time}` : ''})
                          </span>
                          <span
                            className={`weekly-routine-title ${
                              isWeeklyDone ? 'line-through text-slate-400' : ''
                            }`}
                          >
                            {habit.weeklyRoutine.title}
                          </span>
                        </div>
                        {isWeeklyDone && (
                          <span className="weekly-done-tag">Minggu Ini Tuntas</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
