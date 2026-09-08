'use client';

import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import {
  ArrowLeft,
  CalendarCheck2,
  Check,
  Flame,
  Award,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

export interface TodayHistoryTaskItem {
  id: string;
  title: string;
  isCompleted: boolean;
  todayDaysCount?: number;
}

export interface DailyTodayLog {
  date: string; // 'YYYY-MM-DD'
  dayName: string; // 'Selasa'
  formattedDate: string; // '8 Sept 2026'
  totalSlots: number; // 5
  completedCount: number; // 0 - 5
  tasks?: TodayHistoryTaskItem[];
}

interface TodayHistoryViewProps {
  onBack: () => void;
}

const STORAGE_KEY = 'today_daily_completion_logs_v1';

export const TodayHistoryView: React.FC<TodayHistoryViewProps> = ({ onBack }) => {
  const { todayTasks } = useTask();

  // Accordion State: Hanya satu tanggal yang terbuka dalam satu waktu
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  // Current real date
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const todayDateStr = `${y}-${m}-${d}`;

  const currentDayName = now.toLocaleDateString('id-ID', { weekday: 'long' });
  const currentFormattedDate = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const todayCompletedCount = todayTasks.filter((t) => t.isCompleted).length;

  const [logs, setLogs] = useState<DailyTodayLog[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }

    // Default initial sample data jika belum ada riwayat sebelumnya
    const initialPastLogs: DailyTodayLog[] = [];

    // Sampel judul task realistis untuk riwayat masa lalu
    const sampleTaskPool = [
      ['Rilis pembaruan modul layanan', 'Rapat koordinasi tim kerja', 'Tinjau alur kerja harian', 'Dokumentasi pedoman pengguna', 'Evaluasi pencapaian target'],
      ['Susun proposal kerja sama', 'Hubungi mitra strategis', 'Review laporan anggaran', 'Diskusi agenda bulanan', 'Perbarui data ringkasan kerja'],
      ['Pemeriksaan kelengkapan berkas', 'Pencadangan data kerja', 'Briefing awal pekan', 'Penjadwalan kegiatan penting', 'Refleksi target mingguan'],
      ['Riset ide program baru', 'Penyusunan prioritas mingguan', 'Tinjau kemajuan target', 'Evaluasi alur pelayanan', 'Penyusunan laporan bulanan'],
    ];

    // Buat data untuk 4 hari sebelumnya
    for (let i = 4; i >= 1; i--) {
      const pastDate = new Date(now);
      pastDate.setDate(pastDate.getDate() - i);
      const pastY = pastDate.getFullYear();
      const pastM = String(pastDate.getMonth() + 1).padStart(2, '0');
      const pastD = String(pastDate.getDate()).padStart(2, '0');
      const dateStr = `${pastY}-${pastM}-${pastD}`;

      const sampleCompleted = i === 1 ? 4 : i === 2 ? 5 : i === 3 ? 3 : 5;
      const titles = sampleTaskPool[(i - 1) % sampleTaskPool.length];

      const sampleTasks: TodayHistoryTaskItem[] = titles.map((title, idx) => ({
        id: `past-task-${dateStr}-${idx}`,
        title,
        isCompleted: idx < sampleCompleted,
        todayDaysCount: idx >= sampleCompleted ? 2 : 1,
      }));

      initialPastLogs.push({
        date: dateStr,
        dayName: pastDate.toLocaleDateString('id-ID', { weekday: 'long' }),
        formattedDate: pastDate.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        totalSlots: 5,
        completedCount: sampleCompleted,
        tasks: sampleTasks,
      });
    }

    return initialPastLogs;
  });

  // Sync log dengan hari ini secara dinamis & real-time
  useEffect(() => {
    setLogs((prevLogs) => {
      const existingTodayIndex = prevLogs.findIndex((log) => log.date === todayDateStr);

      const currentLiveTasks: TodayHistoryTaskItem[] = todayTasks.map((t) => ({
        id: t.id,
        title: t.title,
        isCompleted: t.isCompleted,
        todayDaysCount: t.todayDaysCount || 1,
      }));

      let updatedLogs: DailyTodayLog[];

      if (existingTodayIndex >= 0) {
        // Perbarui entri hari ini dengan progres terkini
        updatedLogs = prevLogs.map((log, idx) =>
          idx === existingTodayIndex
            ? {
                ...log,
                completedCount: todayCompletedCount,
                dayName: currentDayName,
                formattedDate: currentFormattedDate,
                tasks: currentLiveTasks,
              }
            : log
        );
      } else {
        // Buat entri baru untuk hari ini di paling atas
        const newTodayEntry: DailyTodayLog = {
          date: todayDateStr,
          dayName: currentDayName,
          formattedDate: currentFormattedDate,
          totalSlots: 5,
          completedCount: todayCompletedCount,
          tasks: currentLiveTasks,
        };
        updatedLogs = [newTodayEntry, ...prevLogs];
      }

      // Urutkan tanggal terbaru di paling atas
      updatedLogs.sort((a, b) => b.date.localeCompare(a.date));

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
      } catch (e) {
        console.error(e);
      }

      return updatedLogs;
    });
  }, [todayDateStr, todayCompletedCount, currentDayName, currentFormattedDate, todayTasks]);

  // Statistik Ringkas
  const perfectDaysCount = logs.filter((l) => l.completedCount === 5).length;
  const totalTasksCompleted = logs.reduce((acc, curr) => acc + curr.completedCount, 0);

  const handleToggleExpand = (date: string) => {
    setExpandedDate((prev) => (prev === date ? null : date));
  };

  return (
    <div className="today-history-container">
      {/* 1. Header dengan Tombol Kembali */}
      <div className="history-top-bar">
        <button
          type="button"
          className="btn-history-back"
          onClick={onBack}
          title="Kembali ke Today"
        >
          <ArrowLeft size={17} />
          <span>Kembali ke Today</span>
        </button>
      </div>

      {/* 2. Hero Banner Riwayat */}
      <div className="history-hero-card">
        <div className="history-hero-badge">
          <CalendarCheck2 size={14} />
          <span>Riwayat Fokus Today</span>
        </div>
        <h2 className="history-hero-title">Log Penyelesaian 5 Tugas Harian</h2>
        <p className="history-hero-desc">
          Ketuk tanggal untuk melihat detail minimalis 5 tugas hari itu. Baris baru otomatis tercipta saat melewati jam 12 malam.
        </p>

        {/* Mini Stats Row */}
        <div className="history-stats-row">
          <div className="history-stat-pill">
            <Award size={13} color="#f59e0b" />
            <span>
              <strong>{perfectDaysCount}</strong> Hari Tuntas 100%
            </span>
          </div>
          <div className="history-stat-pill">
            <Flame size={13} color="#f97316" />
            <span>
              <strong>{totalTasksCompleted}</strong> Total Tugas Selesai
            </span>
          </div>
        </div>
      </div>

      {/* 3. Daftar Log Riwayat Per Tanggal (Accordion Interaktif) */}
      <div className="history-list-card">
        <div className="history-list-header">
          <span className="col-label-date">HARI & TANGGAL</span>
          <span className="col-label-status">5 CEKLIST FOKUS (KIRI KE KANAN)</span>
        </div>

        <div className="history-log-items">
          {logs.map((log) => {
            const isCurrentToday = log.date === todayDateStr;
            const isAllCompleted = log.completedCount === 5;
            const isExpanded = expandedDate === log.date;

            // Tugas yang akan ditampilkan di detail
            const tasksList = isCurrentToday
              ? todayTasks.map((t) => ({
                  id: t.id,
                  title: t.title,
                  isCompleted: t.isCompleted,
                  todayDaysCount: t.todayDaysCount || 1,
                }))
              : log.tasks || [];

            return (
              <div
                key={log.date}
                className={`history-log-wrapper ${isExpanded ? 'expanded' : ''}`}
              >
                {/* Baris Utama Tanggal (Dapat Diklik untuk Expand/Collapse) */}
                <div
                  className={`history-log-row ${isCurrentToday ? 'is-today' : ''} ${
                    isExpanded ? 'active-row' : ''
                  }`}
                  onClick={() => handleToggleExpand(log.date)}
                  role="button"
                  tabIndex={0}
                  title="Klik untuk membuka/menutup detail tugas"
                >
                  {/* Sisi Kiri: Badge Hari & Tanggal */}
                  <div className="log-date-col">
                    <div className="log-day-row">
                      <span className="log-day-badge">{log.dayName}</span>
                      {isCurrentToday && <span className="log-today-tag">Hari Ini</span>}
                    </div>
                    <div className="log-date-text">{log.formattedDate}</div>
                  </div>

                  {/* Sisi Kanan: 5 Kotak Ceklist + Indikator Expand */}
                  <div className="log-checklist-col">
                    <div className="log-checklist-row">
                      {Array.from({ length: 5 }, (_, i) => {
                        const isChecked = i < log.completedCount;
                        return (
                          <div
                            key={`box-${log.date}-${i}`}
                            className={`log-check-box ${isChecked ? 'checked' : 'pending'}`}
                            title={`Tugas #${i + 1}: ${isChecked ? 'Selesai' : 'Belum selesai'}`}
                          >
                            {isChecked ? (
                              <Check size={12} strokeWidth={3.5} />
                            ) : (
                              <span className="dot-indicator" />
                            )}
                          </div>
                        );
                      })}

                      <div className="log-expand-icon">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </div>

                    <div className="log-progress-caption">
                      <span className={`caption-number ${isAllCompleted ? 'all-done' : ''}`}>
                        {log.completedCount}/5 selesai
                      </span>
                      {isAllCompleted && (
                        <span className="caption-trophy" title="Selesai 100%">
                          🎉
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bagian Detail Accordion (Minimalis Sederhana) */}
                {isExpanded && (
                  <div className="history-accordion-body">
                    <div className="history-accordion-label">
                      Detail 5 Tugas {log.formattedDate}:
                    </div>

                    {tasksList.length > 0 ? (
                      <div className="history-task-list">
                        {tasksList.map((taskItem, idx) => (
                          <div
                            key={taskItem.id || `task-item-${idx}`}
                            className="history-task-detail-row"
                          >
                            <div
                              className={`history-task-check ${
                                taskItem.isCompleted ? 'done' : 'pending'
                              }`}
                            >
                              {taskItem.isCompleted ? (
                                <Check size={10} strokeWidth={3.5} />
                              ) : (
                                <span className="mini-dot" />
                              )}
                            </div>

                            <span
                              className={`history-task-title ${
                                taskItem.isCompleted ? 'title-done' : ''
                              }`}
                            >
                              {taskItem.title}
                            </span>

                            {taskItem.todayDaysCount && taskItem.todayDaysCount > 1 && (
                              <span className="history-carryover-tag">
                                Hari ke-{taskItem.todayDaysCount}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="history-task-empty-hint">
                        Belum ada tugas yang terpilih di Today pada tanggal ini.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
