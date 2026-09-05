'use client';

import React, { useState, useEffect } from 'react';
import { useTask } from '../context/TaskContext';
import { TaskCard } from './TaskCard';
import { ScheduleDiffModal } from './ScheduleDiffModal';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  Sparkles,
  Layers,
  Shuffle,
  Check,
  List,
  CalendarDays,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Eye,
  Coffee,
} from 'lucide-react';
import { getFormattedDate } from '../data/seedTasks';
import { Task, ScheduledSession, ScheduleComparisonResult } from '../types/task';
import { timeToMinutes } from '../services/smartScheduler';

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const TIMELINE_HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 06:00 s/d 22:00
const TIMELINE_START_HOUR = 6; // 06:00
const TIMELINE_END_HOUR = 23; // 23:00 (17 hours)
const HOUR_HEIGHT = 56; // 56px per hour
const MINUTE_HEIGHT = HOUR_HEIGHT / 60; // ~0.9333 px per minute
const DAY_START_MIN = TIMELINE_START_HOUR * 60;
const DAY_END_MIN = TIMELINE_END_HOUR * 60;

interface RenderSessionBlock {
  taskId: string;
  taskTitle: string;
  isCompleted: boolean;
  priority: string;
  category: string;
  startTime: string;
  endTime: string;
  sessionLabel?: string;
  allowConcurrent?: boolean;
  isSplit: boolean;
  totalSessions?: number;
  note?: string;
  isBreakTask?: boolean;
  breakType?: string;
}

interface LayoutBlock extends RenderSessionBlock {
  startMin: number;
  endMin: number;
  col: number;
  totalCols: number;
}

/**
 * Menghitung tata letak blok timeline agar:
 * 1. Tugas berdurasi beberapa jam MENYATU (continuous single block).
 * 2. Tugas yang tumpang tindih BERGESER / BERBAGI TEMPAT secara proporsional.
 */
const computeTimelineLayout = (blocks: RenderSessionBlock[]): LayoutBlock[] => {
  if (!blocks || blocks.length === 0) return [];

  // Konversi jam ke menit & batasi pada rentang timeline
  const prepared: LayoutBlock[] = blocks.map((b) => {
    let s = timeToMinutes(b.startTime);
    let e = timeToMinutes(b.endTime);
    if (e <= s) {
      e = s + 30; // Default 30 menit jika tugas tanpa rentang jam pasti
    }
    s = Math.max(DAY_START_MIN, Math.min(DAY_END_MIN, s));
    e = Math.max(s + 15, Math.min(DAY_END_MIN, e));

    return {
      ...b,
      startMin: s,
      endMin: e,
      col: 0,
      totalCols: 1,
    };
  });

  // Urutkan berdasarkan jam mulai terawal, lalu durasi lebih panjang
  prepared.sort(
    (a, b) => a.startMin - b.startMin || (b.endMin - b.startMin) - (a.endMin - a.startMin)
  );

  // Kelompokkan blok yang bertabrakan / tumpang tindih ke dalam cluster
  const clusters: LayoutBlock[][] = [];
  let currentCluster: LayoutBlock[] = [];
  let clusterEnd = -1;

  prepared.forEach((item) => {
    if (currentCluster.length === 0) {
      currentCluster.push(item);
      clusterEnd = item.endMin;
    } else if (item.startMin < clusterEnd) {
      currentCluster.push(item);
      clusterEnd = Math.max(clusterEnd, item.endMin);
    } else {
      clusters.push(currentCluster);
      currentCluster = [item];
      clusterEnd = item.endMin;
    }
  });

  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // Tetapkan kolom untuk setiap tugas di dalam cluster yang tumpang tindih
  const result: LayoutBlock[] = [];
  clusters.forEach((cluster) => {
    const columnEnds: number[] = [];

    cluster.forEach((item) => {
      let placedCol = -1;
      for (let i = 0; i < columnEnds.length; i++) {
        if (columnEnds[i] <= item.startMin) {
          placedCol = i;
          columnEnds[i] = item.endMin;
          break;
        }
      }
      if (placedCol === -1) {
        placedCol = columnEnds.length;
        columnEnds.push(item.endMin);
      }
      item.col = placedCol;
    });

    const totalCols = Math.max(1, columnEnds.length);
    cluster.forEach((item) => {
      item.totalCols = totalCols;
      result.push(item);
    });
  });

  return result;
};

export const CalendarView: React.FC = () => {
  const {
    tasks,
    selectedDate,
    setSelectedDate,
    setActiveTab,
    autoScheduleDay,
    addRecoveryBreak,
    setEditingTask,
    toggleTaskStatus,
    previewAiSchedule,
    applyAiSchedule,
    revertToOriginal,
    refreshAiSchedule,
    hasOriginalSnapshot,
    activeScheduleModes,
    activeScheduleVersion,
    setActiveScheduleVersion,
    toggleScheduleVersion,
    getTasksForDateAndVersion,
  } = useTask();

  const [dailyViewMode, setDailyViewMode] = useState<'timeline' | 'list'>('timeline');
  const [calendarSpan, setCalendarSpan] = useState<'month' | 'week'>('month');
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [diffComparison, setDiffComparison] = useState<ScheduleComparisonResult | null>(null);

  const handleOpenDiffModal = () => {
    const comp = previewAiSchedule(selectedDate);
    if (comp) {
      setDiffComparison(comp);
      setIsDiffModalOpen(true);
    }
  };

  const handleRefreshDiff = () => {
    const fresh = refreshAiSchedule(selectedDate);
    if (fresh) {
      setDiffComparison(fresh);
    }
  };

  // Current real-time clock for today indicator
  const [nowTime, setNowTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNowTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Calendar month navigation state
  const initialDate = selectedDate ? new Date(selectedDate) : new Date();
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());

  const formatYMD = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const todayStr = getFormattedDate(0);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const jumpToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(todayStr);
  };

  // Build calendar matrix
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const calendarDays: {
    day: number;
    month: number;
    year: number;
    isCurrentMonth: boolean;
  }[] = [];

  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({
      day: daysInPrevMonth - i,
      month: currentMonth - 1,
      year: currentYear,
      isCurrentMonth: false,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({
      day: d,
      month: currentMonth,
      year: currentYear,
      isCurrentMonth: true,
    });
  }

  const remainingCells = (7 - (calendarDays.length % 7)) % 7;
  for (let d = 1; d <= remainingCells; d++) {
    calendarDays.push({
      day: d,
      month: currentMonth + 1,
      year: currentYear,
      isCurrentMonth: false,
    });
  }

  // Week vs Month filter
  let displayedDays = calendarDays;
  if (calendarSpan === 'week') {
    const selectedIdx = calendarDays.findIndex(
      (c) => formatYMD(c.year, c.month, c.day) === selectedDate
    );
    if (selectedIdx !== -1) {
      const weekStartIdx = Math.floor(selectedIdx / 7) * 7;
      displayedDays = calendarDays.slice(weekStartIdx, weekStartIdx + 7);
    } else {
      displayedDays = calendarDays.slice(0, 7);
    }
  }

  const rawDayTasks = tasks.filter((t) => t.dueDate === selectedDate);
  const tasksForSelectedDate = getTasksForDateAndVersion(selectedDate, activeScheduleVersion);
  const totalTasksToday = tasksForSelectedDate.length;
  const completedTasksToday = tasksForSelectedDate.filter((t) => t.isCompleted).length;
  const pendingTasksToday = totalTasksToday - completedTasksToday;
  const completionPercent =
    totalTasksToday > 0 ? Math.round((completedTasksToday / totalTasksToday) * 100) : 0;

  const isTodaySelected = selectedDate === todayStr;
  const currentHour = nowTime.getHours();
  const currentMinute = nowTime.getMinutes();

  const formatReadableSelected = () => {
    if (!selectedDate) return '';
    try {
      const [y, m, d] = selectedDate.split('-');
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  };

  // Collect scheduled session blocks for timeline
  const sessionBlocks: RenderSessionBlock[] = [];
  const unscheduledTasks: Task[] = [];

  tasksForSelectedDate.forEach((task) => {
    if (task.scheduledSessions && task.scheduledSessions.length > 0) {
      task.scheduledSessions.forEach((sess) => {
        sessionBlocks.push({
          taskId: task.id,
          taskTitle: task.title,
          isCompleted: task.isCompleted,
          priority: task.priority,
          category: task.category,
          startTime: sess.startTime,
          endTime: sess.endTime,
          sessionLabel: sess.label,
          allowConcurrent: task.allowConcurrent,
          isSplit: task.scheduledSessions!.length > 1,
          totalSessions: task.scheduledSessions!.length,
          note: task.schedulingNote,
          isBreakTask: task.isBreakTask,
          breakType: task.breakType,
        });
      });
    } else if (task.startTime && task.endTime) {
      sessionBlocks.push({
        taskId: task.id,
        taskTitle: task.title,
        isCompleted: task.isCompleted,
        priority: task.priority,
        category: task.category,
        startTime: task.startTime,
        endTime: task.endTime,
        allowConcurrent: task.allowConcurrent,
        isSplit: false,
        note: task.schedulingNote,
        isBreakTask: task.isBreakTask,
        breakType: task.breakType,
      });
    } else if (task.startTime) {
      const sMin = timeToMinutes(task.startTime);
      const eMin = sMin + (task.effortHours ? Math.round(task.effortHours * 60) : 60);
      const endFormatted = `${String(Math.floor(eMin / 60)).padStart(2, '0')}:${String(
        eMin % 60
      ).padStart(2, '0')}`;
      sessionBlocks.push({
        taskId: task.id,
        taskTitle: task.title,
        isCompleted: task.isCompleted,
        priority: task.priority,
        category: task.category,
        startTime: task.startTime,
        endTime: endFormatted,
        allowConcurrent: task.allowConcurrent,
        isSplit: false,
        note: task.schedulingNote,
        isBreakTask: task.isBreakTask,
        breakType: task.breakType,
      });
    } else if (task.dueTime) {
      sessionBlocks.push({
        taskId: task.id,
        taskTitle: task.title,
        isCompleted: task.isCompleted,
        priority: task.priority,
        category: task.category,
        startTime: task.dueTime,
        endTime: task.dueTime,
        allowConcurrent: task.allowConcurrent,
        isSplit: false,
        isBreakTask: task.isBreakTask,
        breakType: task.breakType,
      });
    } else {
      unscheduledTasks.push(task);
    }
  });

  const currentMinuteOfDay = currentHour * 60 + currentMinute;
  const layoutBlocks = computeTimelineLayout(sessionBlocks);

  return (
    <div style={{ paddingBottom: '32px' }}>
      {/* Calendar Card View */}
      <div className="calendar-card">
        {/* Header Bulan & Navigasi */}
        <div className="calendar-month-header">
          <div className="calendar-month-title">
            <CalendarIcon size={18} style={{ color: '#0284c7' }} />
            <span>
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>
            <div className="calendar-span-toggle">
              <button
                type="button"
                className={`calendar-span-btn ${calendarSpan === 'month' ? 'active' : ''}`}
                onClick={() => setCalendarSpan('month')}
                title="Tampilkan 1 Bulan Penuh"
              >
                Bulan
              </button>
              <button
                type="button"
                className={`calendar-span-btn ${calendarSpan === 'week' ? 'active' : ''}`}
                onClick={() => setCalendarSpan('week')}
                title="Tampilkan 1 Minggu Ringkas"
              >
                Minggu
              </button>
            </div>
          </div>

          <div className="calendar-nav-btns">
            <button
              type="button"
              className="calendar-today-btn"
              onClick={jumpToToday}
              title="Pergi ke Hari Ini"
            >
              Hari Ini
            </button>
            <button
              type="button"
              className="android-icon-btn"
              onClick={prevMonth}
              style={{ width: '30px', height: '30px' }}
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="android-icon-btn"
              onClick={nextMonth}
              style={{ width: '30px', height: '30px' }}
              aria-label="Bulan berikutnya"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Hari dalam seminggu */}
        <div className="calendar-weekdays-row">
          {WEEKDAYS.map((w, idx) => (
            <div
              key={idx}
              className={`calendar-weekday-cell ${idx === 0 ? 'is-sunday' : ''} ${
                idx === 6 ? 'is-saturday' : ''
              }`}
            >
              {w}
            </div>
          ))}
        </div>

        {/* Grid tanggal */}
        <div className="calendar-days-grid">
          {displayedDays.map((cell, idx) => {
            const cellDateStr = formatYMD(cell.year, cell.month, cell.day);
            const isToday = cellDateStr === todayStr;
            const isSelected = cellDateStr === selectedDate;
            const dayTasks = tasks.filter((t) => t.dueDate === cellDateStr);
            const taskCount = dayTasks.length;
            const hasHigh = dayTasks.some((t) => t.priority === 'high' && !t.isCompleted);
            const hasMedium = dayTasks.some((t) => t.priority === 'medium' && !t.isCompleted);
            const hasLow = dayTasks.some((t) => t.priority === 'low' && !t.isCompleted);
            const allDone = taskCount > 0 && dayTasks.every((t) => t.isCompleted);

            return (
              <div
                key={idx}
                className={`calendar-day-cell ${
                  !cell.isCurrentMonth ? 'other-month' : ''
                } ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  if (cell.isCurrentMonth || calendarSpan === 'week') {
                    setSelectedDate(cellDateStr);
                  }
                }}
              >
                <span>{cell.day}</span>
                {taskCount > 0 && (
                  <div className="calendar-dot-row">
                    {allDone ? (
                      <span className="calendar-dot dot-completed" />
                    ) : (
                      <>
                        {hasHigh && <span className="calendar-dot dot-high" />}
                        {hasMedium && <span className="calendar-dot dot-medium" />}
                        {hasLow && <span className="calendar-dot dot-low" />}
                        {!hasHigh && !hasMedium && !hasLow && <span className="calendar-dot" />}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Agenda Harian & Summary Card */}
      <div className="calendar-agenda-wrapper">
        <div className="agenda-day-card">
          <div className="agenda-day-header-flex">
            <div>
              <div className="agenda-day-text-title">{formatReadableSelected()}</div>
              <div className="agenda-day-text-sub">
                {isTodaySelected ? 'Hari Ini' : 'Agenda Tanggal Terpilih'}
              </div>
            </div>

            {/* Switch Mode: Timeline vs List */}
            <div className="view-mode-toggle">
              <button
                type="button"
                className={`mode-btn ${dailyViewMode === 'timeline' ? 'active' : ''}`}
                onClick={() => setDailyViewMode('timeline')}
                title="Tampilan Garis Waktu Jam"
              >
                <CalendarDays size={13} />
                <span>Timeline</span>
              </button>
              <button
                type="button"
                className={`mode-btn ${dailyViewMode === 'list' ? 'active' : ''}`}
                onClick={() => setDailyViewMode('list')}
                title="Tampilan Daftar Tugas"
              >
                <List size={13} />
                <span>Daftar</span>
              </button>
            </div>
          </div>

          {totalTasksToday > 0 ? (
            <>
              <div className="agenda-stats-pills">
                <span className="agenda-stat-pill">
                  <Check size={12} /> {totalTasksToday} Total
                </span>
                <span className="agenda-stat-pill stat-done">
                  {completedTasksToday} Selesai ({completionPercent}%)
                </span>
                {pendingTasksToday > 0 && (
                  <span className="agenda-stat-pill stat-pending">
                    {pendingTasksToday} Tertunda
                  </span>
                )}
              </div>
              <div
                style={{
                  width: '100%',
                  height: '4px',
                  background: '#e2e8f0',
                  borderRadius: '2px',
                  marginTop: '10px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${completionPercent}%`,
                    height: '100%',
                    background: completionPercent === 100 ? '#10b981' : '#0284c7',
                    borderRadius: '2px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </>
          ) : (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#94a3b8' }}>
              Belum ada tugas terjadwal pada tanggal ini.
            </div>
          )}
        </div>

        {/* Banner Kontrol Paralel: Versi Ori vs Versi AI (1x Klik Berpindah) */}
        {(rawDayTasks.length > 0 || tasksForSelectedDate.length > 0) && (
          <div
            style={{
              background:
                activeScheduleVersion === 'ai'
                  ? 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)'
                  : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              border: activeScheduleVersion === 'ai' ? '1px solid #bbf7d0' : '1px solid #cbd5e1',
              borderRadius: '12px',
              padding: '10px 12px',
              marginBottom: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              transition: 'all 0.25s ease',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '999px',
                    background: activeScheduleVersion === 'ai' ? '#dcfce7' : '#e2e8f0',
                    color: activeScheduleVersion === 'ai' ? '#15803d' : '#334155',
                    border: `1px solid ${activeScheduleVersion === 'ai' ? '#86efac' : '#cbd5e1'}`,
                  }}
                >
                  {activeScheduleVersion === 'ai' ? (
                    <>
                      <Sparkles size={11} /> Versi AI Aktif
                    </>
                  ) : (
                    <>
                      <List size={11} /> Versi Ori Aktif
                    </>
                  )}
                </span>
                <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                  {activeScheduleVersion === 'ai'
                    ? 'Jadwal anti-bentrok + jeda istirahat otomatis'
                    : 'Jadwal asli sesuai input manual Anda'}
                </span>
              </div>

              {/* 1-Click Parallel Version Switcher */}
              <div className="parallel-toggle-pills">
                <button
                  type="button"
                  className={`parallel-toggle-pill ${
                    activeScheduleVersion === 'ori' ? 'active-ori' : ''
                  }`}
                  onClick={() => setActiveScheduleVersion('ori')}
                  title="Klik 1x untuk beralih ke Versi Ori (Jadwal Manual)"
                >
                  📋 Versi Ori
                </button>
                <button
                  type="button"
                  className={`parallel-toggle-pill ${
                    activeScheduleVersion === 'ai' ? 'active-ai' : ''
                  }`}
                  onClick={() => setActiveScheduleVersion('ai')}
                  title="Klik 1x untuk beralih ke Versi AI (Jadwal Cerdas AI)"
                >
                  ⚡ Versi AI
                </button>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '6px',
                flexWrap: 'wrap',
                paddingTop: '2px',
              }}
            >
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{
                    fontSize: '11px',
                    padding: '5px 8px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => addRecoveryBreak(selectedDate, 'lunch', '12:00')}
                  title="Sisipkan jeda makan siang & istirahat 45 menit"
                >
                  <Coffee size={11} />
                  <span>+ Istirahat</span>
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  style={{
                    fontSize: '11px',
                    padding: '5px 8px',
                    borderRadius: '8px',
                    border: '1px solid #86efac',
                    background: '#ffffff',
                    color: '#166534',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={handleOpenDiffModal}
                  title="Buka dialog komparasi sebelum (asli) vs sesudah (rekomendasi AI)"
                >
                  <Eye size={12} />
                  <span>Bandingkan Sebelum & Sesudah</span>
                </button>
              </div>

              <button
                type="button"
                className="ai-schedule-btn"
                onClick={handleOpenDiffModal}
                title="Buka detail komparasi dan pengaturan jadwal AI"
              >
                <Sparkles size={12} />
                <span>Analisis AI</span>
              </button>
            </div>
          </div>
        )}

        {/* Unscheduled Tasks Alert & Dock */}
        {dailyViewMode === 'timeline' && unscheduledTasks.length > 0 && (
          <div className="unscheduled-tasks-box">
            <div className="unscheduled-header">
              <Clock size={13} />
              <span>{unscheduledTasks.length} Tugas Belum Memiliki Jam:</span>
            </div>
            <div className="unscheduled-chips">
              {unscheduledTasks.map((ut) => (
                <div
                  key={ut.id}
                  className="unscheduled-chip"
                  onClick={() => setEditingTask(ut)}
                  title="Klik untuk set jam atau gunakan 'Susun Jadwal AI'"
                >
                  <span>{ut.title}</span>
                  {ut.effortHours && <span className="chip-effort">{ut.effortHours}j</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONTENT: TIMELINE VIEW ATAU LIST VIEW */}
        {tasksForSelectedDate.length === 0 ? (
          <div
            className="empty-state"
            style={{
              padding: '28px 16px',
              background: '#ffffff',
              borderRadius: '18px',
              border: '1px solid #e2e8f0',
              marginTop: '10px',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)',
            }}
          >
            <div className="empty-icon-circle">
              <CalendarIcon size={24} />
            </div>
            <div className="empty-title">Agenda Kosong</div>
            <p className="empty-desc" style={{ marginBottom: '14px', color: '#64748b' }}>
              Tidak ada tugas yang jatuh tempo atau terjadwal pada hari ini.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setActiveTab('new')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                borderRadius: '12px',
                fontSize: '13px',
              }}
            >
              <Plus size={16} /> Buat Tugas Baru
            </button>
          </div>
        ) : dailyViewMode === 'list' ? (
          /* List Mode */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
            {tasksForSelectedDate.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          /* Timeline Continuous Unified View (06:00 - 23:00) */
          <div className="daily-timeline-continuous">
            {/* Background Hour Grid Slots */}
            <div className="timeline-grid-background">
              {TIMELINE_HOURS.map((hour) => {
                const hourStr = `${String(hour).padStart(2, '0')}:00`;
                return (
                  <div key={hour} className="timeline-hour-slot">
                    <div className="timeline-time-col">
                      <span className="hour-label">{hourStr}</span>
                    </div>
                    <div className="timeline-slot-line" />
                  </div>
                );
              })}
            </div>

            {/* Real-time Indicator Line (Exact minute accuracy) */}
            {isTodaySelected &&
              currentMinuteOfDay >= DAY_START_MIN &&
              currentMinuteOfDay <= DAY_END_MIN && (
                <div
                  className="current-time-indicator"
                  style={{
                    top: `${(currentMinuteOfDay - DAY_START_MIN) * MINUTE_HEIGHT + 12}px`,
                  }}
                >
                  <div className="current-time-dot" />
                  <div className="current-time-line" />
                  <span className="current-time-badge">
                    {String(currentHour).padStart(2, '0')}:
                    {String(currentMinute).padStart(2, '0')}
                  </span>
                </div>
              )}

            {/* Foreground Unified Continuous & Overlap Blocks */}
            <div className="timeline-tasks-overlay">
              {layoutBlocks.map((block, bIdx) => {
                const originalTask = tasks.find((t) => t.id === block.taskId);
                const topPx = (block.startMin - DAY_START_MIN) * MINUTE_HEIGHT;
                const heightPx = Math.max(34, (block.endMin - block.startMin) * MINUTE_HEIGHT - 3);

                // Overlap calculations for sharing horizontal space
                const widthPercent = 100 / block.totalCols;
                const leftPercent = (block.col * 100) / block.totalCols;

                return (
                  <div
                    key={`${block.taskId}-${bIdx}`}
                    className={`timeline-task-block continuous-block ${
                      block.isCompleted ? 'completed' : ''
                    } ${block.isBreakTask ? 'break-block' : `priority-${block.priority}`} ${
                      block.totalCols > 1 ? 'is-shared-col' : ''
                    }`}
                    style={{
                      top: `${topPx}px`,
                      height: `${heightPx}px`,
                      left: block.totalCols > 1 ? `calc(${leftPercent}% + 2px)` : '0%',
                      width: block.totalCols > 1 ? `calc(${widthPercent}% - 4px)` : '100%',
                    }}
                    onClick={() => originalTask && setEditingTask(originalTask)}
                    title={`${block.taskTitle} (${block.startTime} - ${block.endTime})`}
                  >
                    <div className="timeline-block-header">
                      <button
                        type="button"
                        className={`timeline-mini-checkbox ${
                          block.isCompleted ? 'checked' : ''
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskStatus(block.taskId);
                        }}
                        aria-label="Toggle task status"
                      >
                        {block.isCompleted && <Check size={10} strokeWidth={3} />}
                      </button>
                      <span
                        className={`timeline-block-title ${
                          block.isCompleted ? 'checked-title' : ''
                        }`}
                      >
                        {block.taskTitle}
                      </span>
                    </div>

                    <div className="timeline-block-meta">
                      <span className="block-time-range">
                        <Clock size={10} />
                        {block.startTime} - {block.endTime}
                      </span>

                      {block.isBreakTask && (
                        <span className="block-break-badge">☕ Rehat</span>
                      )}

                      {block.sessionLabel && (
                        <span className="block-session-badge">
                          <Layers size={9} />
                          {block.sessionLabel}
                        </span>
                      )}

                      {block.totalCols > 1 && (
                        <span
                          className="block-multitask-badge"
                          title="Tugas berbagi waktu bersamaan (side-by-side)"
                        >
                          <Shuffle size={9} />
                          Berbagi Waktu
                        </span>
                      )}

                      {block.isSplit && (
                        <span
                          className="block-split-indicator"
                          title={block.note || 'Sesi terbagi'}
                        >
                          Terbagi
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Dialog Modal Komparasi Sebelum vs Sesudah (Original vs AI) */}
      <ScheduleDiffModal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        comparison={diffComparison}
        onRefresh={handleRefreshDiff}
      />
    </div>
  );
};
