'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTask } from '../context/TaskContext';
import { RoutineItem, RoutineScheduleType, RoutineRecurrence } from '../types/routine';
import {
  RotateCw,
  Plus,
  Check,
  Calendar,
  Trash2,
  Lock,
  Minus,
  Sparkles,
  X,
  CheckCircle2,
  CalendarDays,
  Target,
  ArrowRight,
  Flame,
  Clock,
} from 'lucide-react';

const STORAGE_ROUTINES_KEY = 'ten_routines_v1';

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const SHORT_DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

export const RoutineTrackerView: React.FC = () => {
  const { routines, addRoutine, deleteRoutine, toggleRoutineCheckToday, showToast } = useTask();

  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [scheduleType, setScheduleType] = useState<RoutineScheduleType>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Default: Sen-Jum
  const [recurrence, setRecurrence] = useState<RoutineRecurrence>('daily');

  // Container refs for auto-scrolling to today
  const horizontalScrollRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const todayDateStr = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();

  // Auto-scroll each routine's horizontal row to today's date box
  useEffect(() => {
    if (routines.length > 0) {
      const timer = setTimeout(() => {
        routines.forEach((r) => {
          const container = horizontalScrollRefs.current[r.id];
          if (container) {
            const todayEl = container.querySelector('.routine-compact-check-box.is-today') as HTMLElement;
            if (todayEl) {
              const scrollLeft = todayEl.offsetLeft - container.offsetWidth / 2 + todayEl.offsetWidth / 2;
              container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
            }
          }
        });
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [routines]);

  // Delete routine
  const handleDeleteRoutine = (id: string, routineTitle: string) => {
    if (window.confirm(`Hapus rutinitas "${routineTitle}"?`)) {
      deleteRoutine(id);
    }
  };

  // Open form modal with initial state
  const handleOpenCreateForm = () => {
    setTitle('');
    setDescription('');
    setStartTime('06:00');
    setEndTime('07:00');
    setStartDate('');
    setEndDate('');
    setScheduleType('daily');
    setSelectedDays([1, 2, 3, 4, 5]);
    setRecurrence('daily');
    setIsFormOpen(true);
  };

  const handleSaveRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Judul rutinitas wajib diisi');
      return;
    }
    if (startDate && endDate && startDate > endDate) {
      showToast('Tanggal mulai periode tidak boleh melebihi tanggal selesai');
      return;
    }
    if (startTime && endTime && startTime > endTime) {
      showToast('Jam mulai tidak boleh melebihi jam selesai');
      return;
    }
    if (scheduleType === 'specific_days' && selectedDays.length === 0) {
      showToast('Pilih minimal 1 hari untuk jadwal rutinitas');
      return;
    }

    addRoutine({
      title: title.trim(),
      description: description.trim() || undefined,
      startTime: startTime.trim() || undefined,
      endTime: endTime.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      scheduleType,
      selectedDays: scheduleType === 'specific_days' ? selectedDays : undefined,
      recurrence,
    });

    setIsFormOpen(false);
  };

  // Generate sequence of dates for attendance
  const getRoutineDates = (routine: RoutineItem) => {
    const dates: {
      dateStr: string;
      dayOfWeek: number;
      dayNumber: number;
      dayName: string;
      monthName: string;
      isToday: boolean;
      isPast: boolean;
      isFuture: boolean;
      isScheduled: boolean;
    }[] = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let start: Date;
    let end: Date;

    if (routine.startDate && routine.endDate) {
      start = new Date(routine.startDate + 'T00:00:00');
      end = new Date(routine.endDate + 'T00:00:00');
    } else if (routine.startDate && !routine.endDate) {
      start = new Date(routine.startDate + 'T00:00:00');
      end = new Date(Math.max(start.getTime(), today.getTime()));
      end.setDate(end.getDate() + 21);
    } else if (!routine.startDate && routine.endDate) {
      end = new Date(routine.endDate + 'T00:00:00');
      start = new Date(end);
      start.setDate(start.getDate() - 28);
    } else {
      // Tanpa batas waktu (berkelanjutan): tampilkan rentang aktif 7 hari lalu s/d 21 hari ke depan
      start = new Date(today);
      start.setDate(today.getDate() - 7);
      end = new Date(today);
      end.setDate(today.getDate() + 21);
    }

    // Safety guard to avoid infinite loops if date corrupted
    const curr = new Date(start);
    let count = 0;
    while (curr <= end && count < 180) {
      count++;
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, '0');
      const d = String(curr.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const dow = curr.getDay();

      const isScheduled =
        routine.scheduleType === 'daily' ||
        (routine.selectedDays ? routine.selectedDays.includes(dow) : true);

      // We include scheduled dates in the horizontal attendance row
      if (isScheduled) {
        dates.push({
          dateStr,
          dayOfWeek: dow,
          dayNumber: curr.getDate(),
          dayName: SHORT_DAYS[dow],
          monthName: MONTH_NAMES[curr.getMonth()],
          isToday: dateStr === todayDateStr,
          isPast: dateStr < todayDateStr,
          isFuture: dateStr > todayDateStr,
          isScheduled: true,
        });
      }

      curr.setDate(curr.getDate() + 1);
    }

    return dates;
  };

  // Format date helper: "14 Sep 2026"
  const formatDateFriendly = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const month = MONTH_NAMES[parseInt(parts[1], 10) - 1] || parts[1];
    const day = parseInt(parts[2], 10);
    return `${day} ${month} ${year}`;
  };

  return (
    <div className="routine-tracker-container animate-fade-in">
      {/* 1. Header Ringkas Rutinitas */}
      <div className="routine-goal-card">
        <div className="routine-goal-content">
          <div className="routine-goal-icon">
            <RotateCw size={18} />
          </div>
          <div className="routine-goal-info">
            <h4 className="routine-goal-title">Absensi Rutinitas Harian & Berkala</h4>
            <p className="routine-goal-desc">
              Rutinitas aktif otomatis masuk ke daftar tugas hari ini agar dapat dipilah dan diprioritaskan.
              Absensi hanya dapat diceklist pada hari berjalan.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Tombol Tambah Rutinitas & Jumlah Aktif */}
      <div className="routine-section-header">
        <div className="routine-count-badge">
          <CalendarDays size={14} className="text-slate-500" />
          <span>
            Total Rutinitas: <strong>{routines.length}</strong>
          </span>
        </div>

        <button
          type="button"
          className="btn-add-routine"
          onClick={handleOpenCreateForm}
          title="Tambah Rutinitas Baru"
        >
          <Plus size={14} />
          <span>Tambah Rutinitas</span>
        </button>
      </div>

      {/* 3. Modal Form Tambah Rutinitas */}
      {isFormOpen && (
        <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div
            className="modal-container routine-form-modal animate-scale-up"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RotateCw size={17} className="text-primary" />
                <h3 className="modal-title">Tambah Rutinitas Baru</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsFormOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRoutine} className="routine-form-body">
              {/* Judul Rutinitas */}
              <div className="routine-form-group">
                <label className="routine-form-label">
                  Judul Rutinitas <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="routine-input-text"
                  placeholder="Contoh: Briefing Pagi Tim / Olahraga 20 Menit / Baca Buku"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {/* Deskripsi / Catatan */}
              <div className="routine-form-group">
                <label className="routine-form-label">Catatan / Keterangan (Opsional)</label>
                <input
                  type="text"
                  className="routine-input-text"
                  placeholder="Keterangan singkat mengenai rutinitas ini..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* 2. Jam Pelaksanaan Harian (Spesifik Kegiatan) */}
              <div className="routine-form-section">
                <div className="routine-section-header-wrap">
                  <label className="routine-form-label section-title">
                    <Clock size={13} className="text-primary" />
                    <span>Jam Pelaksanaan Aktivitas (Opsional)</span>
                  </label>
                  <span className="routine-section-hint">
                    Tentukan jam spesifik kapan kegiatan ini dilakukan setiap harinya (kosongkan jika fleksibel).
                  </span>
                </div>

                <div className="routine-form-row">
                  <div className="routine-form-group half">
                    <label className="routine-sub-label">Jam Mulai</label>
                    <input
                      type="time"
                      className="routine-input-text"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>

                  <div className="routine-form-group half">
                    <label className="routine-sub-label">Jam Selesai</label>
                    <input
                      type="time"
                      className="routine-input-text"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* Preset waktu cepat */}
                <div className="routine-quick-times-row">
                  <button
                    type="button"
                    className="routine-quick-time-chip"
                    onClick={() => {
                      setStartTime('06:00');
                      setEndTime('07:00');
                    }}
                  >
                    Pagi (06:00)
                  </button>
                  <button
                    type="button"
                    className="routine-quick-time-chip"
                    onClick={() => {
                      setStartTime('13:00');
                      setEndTime('13:30');
                    }}
                  >
                    Siang (13:00)
                  </button>
                  <button
                    type="button"
                    className="routine-quick-time-chip"
                    onClick={() => {
                      setStartTime('17:00');
                      setEndTime('18:00');
                    }}
                  >
                    Sore (17:00)
                  </button>
                  <button
                    type="button"
                    className="routine-quick-time-chip"
                    onClick={() => {
                      setStartTime('20:30');
                      setEndTime('21:30');
                    }}
                  >
                    Malam (20:30)
                  </button>
                  {(startTime || endTime) && (
                    <button
                      type="button"
                      className="routine-quick-time-chip clear"
                      onClick={() => {
                        setStartTime('');
                        setEndTime('');
                      }}
                    >
                      Reset / Fleksibel
                    </button>
                  )}
                </div>
              </div>

              {/* 3. Pengaturan Jadwal Hari: Setiap Hari vs Hari-Hari Tertentu */}
              <div className="routine-form-group">
                <label className="routine-form-label">Jadwal Pelaksanaan Hari</label>
                <div className="routine-schedule-tabs">
                  <button
                    type="button"
                    className={`routine-schedule-tab ${scheduleType === 'daily' ? 'active' : ''}`}
                    onClick={() => {
                      setScheduleType('daily');
                      setRecurrence('daily');
                    }}
                  >
                    Setiap Hari
                  </button>
                  <button
                    type="button"
                    className={`routine-schedule-tab ${scheduleType === 'specific_days' ? 'active' : ''}`}
                    onClick={() => {
                      setScheduleType('specific_days');
                      if (recurrence === 'daily') {
                        setRecurrence('weekly');
                      }
                    }}
                  >
                    Hari-Hari Tertentu
                  </button>
                </div>

                {scheduleType === 'specific_days' && (
                  <div className="routine-days-selector animate-fade-in">
                    <span className="routine-days-caption">Pilih hari aktif pelaksanaan:</span>
                    <div className="routine-days-chips-row">
                      {SHORT_DAYS.map((dayLabel, idx) => {
                        const isSelected = selectedDays.includes(idx);
                        return (
                          <button
                            key={idx}
                            type="button"
                            className={`routine-day-chip ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              if (isSelected) {
                                if (selectedDays.length <= 1) return;
                                setSelectedDays(selectedDays.filter((d) => d !== idx));
                              } else {
                                setSelectedDays([...selectedDays, idx]);
                              }
                            }}
                            title={DAY_NAMES[idx]}
                          >
                            {dayLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Pilihan Pengulangan (Recurrence) */}
              <div className="routine-form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label className="routine-form-label" style={{ margin: 0 }}>Perulangan Rutinitas</label>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>
                    {scheduleType === 'daily' ? 'Otomatis harian' : 'Pilih mingguan atau bulanan'}
                  </span>
                </div>
                <div className="routine-recurrence-options">
                  <button
                    type="button"
                    disabled={scheduleType === 'specific_days'}
                    className={`routine-recurrence-btn ${recurrence === 'daily' ? 'active' : ''} ${
                      scheduleType === 'specific_days' ? 'disabled' : ''
                    }`}
                    onClick={() => setRecurrence('daily')}
                    title={
                      scheduleType === 'specific_days'
                        ? 'Tidak aktif untuk jadwal hari-hari tertentu'
                        : 'Berulang setiap hari'
                    }
                  >
                    Setiap Hari
                  </button>
                  <button
                    type="button"
                    disabled={scheduleType === 'daily'}
                    className={`routine-recurrence-btn ${recurrence === 'weekly' ? 'active' : ''} ${
                      scheduleType === 'daily' ? 'disabled' : ''
                    }`}
                    onClick={() => setRecurrence('weekly')}
                    title={
                      scheduleType === 'daily'
                        ? 'Jadwal setiap hari otomatis berulang harian'
                        : 'Berulang setiap minggu pada hari yang dipilih'
                    }
                  >
                    Setiap Minggu
                  </button>
                  <button
                    type="button"
                    disabled={scheduleType === 'daily'}
                    className={`routine-recurrence-btn ${recurrence === 'monthly' ? 'active' : ''} ${
                      scheduleType === 'daily' ? 'disabled' : ''
                    }`}
                    onClick={() => setRecurrence('monthly')}
                    title={
                      scheduleType === 'daily'
                        ? 'Jadwal setiap hari otomatis berulang harian'
                        : 'Berulang setiap bulan pada hari yang dipilih'
                    }
                  >
                    Setiap Bulan
                  </button>
                </div>
              </div>

              {/* 5. Periode Target Rutinitas (Opsional) */}
              <div className="routine-form-section optional-period">
                <div className="routine-section-header-wrap">
                  <label className="routine-form-label section-title">
                    <Calendar size={13} className="text-primary" />
                    <span>Periode Masa Berlaku Rutinitas (Opsional)</span>
                  </label>
                  <span className="routine-section-hint">
                    Atur jika rutinitas ini memiliki target durasi (misal program 30 hari). Kosongkan jika berlaku selamanya.
                  </span>
                </div>

                <div className="routine-form-row">
                  <div className="routine-form-group half">
                    <label className="routine-sub-label">Mulai Tanggal</label>
                    <input
                      type="date"
                      className="routine-input-text"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div className="routine-form-group half">
                    <label className="routine-sub-label">Selesai Tanggal</label>
                    <input
                      type="date"
                      className="routine-input-text"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsFormOpen(false)}
                >
                  Batal
                </button>
                <button type="submit" className="btn-save-routine-submit">
                  Simpan Rutinitas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Daftar Kartu Rutinitas */}
      <div className="routine-cards-list">
        {routines.length === 0 ? (
          <div className="routine-empty-card">
            <CheckCircle2 size={36} className="text-emerald" />
            <h4 className="routine-empty-title">Belum Ada Rutinitas Terdaftar</h4>
            <p className="routine-empty-desc">
              Buat rutinitas baru untuk mencatat kedisiplinan Anda. Kotak absensi akan berjejer sesuai
              rentang tanggal dan siap diceklist setiap harinya.
            </p>
            <button
              type="button"
              className="btn-add-routine"
              onClick={handleOpenCreateForm}
              style={{ marginTop: '12px' }}
            >
              <Plus size={14} />
              <span>Buat Rutinitas Baru</span>
            </button>
          </div>
        ) : (
          routines.map((routine) => {
            const scheduledDates = getRoutineDates(routine);
            const isDoneToday = routine.completedDates.includes(todayDateStr);
            const totalScheduled = scheduledDates.length;
            const completedCount = routine.completedDates.length;

            // Recurrence label
            const recurrenceLabel =
              routine.recurrence === 'daily'
                ? 'Berulang Harian'
                : routine.recurrence === 'weekly'
                ? 'Berulang Mingguan'
                : 'Berulang Bulanan';

            // Schedule label
            const scheduleLabel =
              routine.scheduleType === 'daily'
                ? 'Setiap Hari'
                : routine.selectedDays
                ? routine.selectedDays.map((d) => SHORT_DAYS[d]).join(', ')
                : 'Hari Pilihan';

            return (
              <div key={routine.id} className="routine-card">
                {/* Header Kartu Ringkas: Judul & Aksi */}
                <div className="routine-card-header">
                  <div className="routine-card-title-col">
                    <div className="routine-title-line">
                      <h4 className="routine-card-title">{routine.title}</h4>
                      <span className={`routine-inline-today-status ${isDoneToday ? 'done' : 'pending'}`}>
                        {isDoneToday ? 'Sudah Absen ✓' : 'Belum Absen'}
                      </span>
                    </div>
                    {routine.description && (
                      <p className="routine-card-desc">{routine.description}</p>
                    )}

                    {/* Metadata Badges Mini */}
                    <div className="routine-badges-row">
                      {/* Jam Pelaksanaan Aktivitas */}
                      {routine.startTime && (
                        <span className="routine-badge time" title="Waktu Pelaksanaan Aktivitas">
                          <Clock size={10} />
                          <span>
                            {routine.startTime}
                            {routine.endTime ? ` - ${routine.endTime}` : ''}
                          </span>
                        </span>
                      )}

                      {/* Periode Rutinitas (Opsional) */}
                      {(routine.startDate || routine.endDate) ? (
                        <span className="routine-badge period" title="Periode Target Rutinitas">
                          <Calendar size={10} />
                          <span>
                            {routine.startDate ? formatDateFriendly(routine.startDate) : 'Mulai'}
                            {' - '}
                            {routine.endDate ? formatDateFriendly(routine.endDate) : 'Seterusnya'}
                          </span>
                        </span>
                      ) : (
                        <span className="routine-badge period ongoing" title="Periode: Berkelanjutan Tanpa Batas">
                          <Calendar size={10} />
                          <span>Berkelanjutan</span>
                        </span>
                      )}

                      <span className="routine-badge recurrence" title="Perulangan">
                        <RotateCw size={10} />
                        <span>{recurrenceLabel}</span>
                      </span>

                      <span className="routine-badge days" title="Jadwal">
                        <span>{scheduleLabel}</span>
                      </span>

                      <span className="routine-badge stats" title="Progres">
                        <Check size={10} />
                        <span>
                          {completedCount}/{totalScheduled} Hari
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Tombol Hapus */}
                  <button
                    type="button"
                    className="btn-delete-routine"
                    onClick={() => handleDeleteRoutine(routine.id, routine.title)}
                    title="Hapus rutinitas"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Kotak Ceklist Berjejer Secara Horizontal (Kompak, Tanpa Icon Check) */}
                <div
                  className="routine-horizontal-dates-container"
                  ref={(el) => {
                    horizontalScrollRefs.current[routine.id] = el;
                  }}
                >
                  <div className="routine-horizontal-dates-track">
                    {scheduledDates.map((item) => {
                      const isCompleted = routine.completedDates.includes(item.dateStr);

                      if (item.isToday) {
                        // KOTAK HARI INI: Ceklist kecil interaktif dengan tanggal di dalam (tanpa icon ceklist saat tuntas)
                        return (
                          <button
                            key={item.dateStr}
                            type="button"
                            className={`routine-compact-check-box is-today ${isCompleted ? 'checked' : ''}`}
                            onClick={() => toggleRoutineCheckToday(routine.id)}
                            title={
                              isCompleted
                                ? 'Hari Ini: Sudah diceklist (Klik untuk batalkan)'
                                : 'Hari Ini: Klik untuk ceklist absensi'
                            }
                          >
                            <span className="compact-box-day">{item.dayName}</span>
                            <span className="compact-box-num">{item.dayNumber}</span>
                          </button>
                        );
                      }

                      if (item.isPast) {
                        // KOTAK MASA LALU: Read-only (tanpa icon ceklist saat tuntas)
                        return (
                          <div
                            key={item.dateStr}
                            className={`routine-compact-check-box is-past ${isCompleted ? 'checked' : 'missed'}`}
                            title={isCompleted ? `${item.dateStr}: Selesai` : `${item.dateStr}: Terlewat`}
                          >
                            <span className="compact-box-day">{item.dayName}</span>
                            <span className="compact-box-num">{item.dayNumber}</span>
                          </div>
                        );
                      }

                      // KOTAK MASA DEPAN: Terkunci
                      return (
                        <div
                          key={item.dateStr}
                          className="routine-compact-check-box is-future"
                          title={`Terkunci sampai ${item.dayNumber} ${item.monthName}`}
                        >
                          <span className="compact-box-day">{item.dayName}</span>
                          <span className="compact-box-num">{item.dayNumber}</span>
                        </div>
                      );
                    })}
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
