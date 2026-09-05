'use client';

import React, { useState } from 'react';
import { useTask } from '../context/TaskContext';
import { TaskCard } from './TaskCard';
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
} from 'lucide-react';
import { getFormattedDate } from '../data/seedTasks';
import { Task, ScheduledSession } from '../types/task';
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
}

export const CalendarView: React.FC = () => {
  const {
    tasks,
    selectedDate,
    setSelectedDate,
    setActiveTab,
    autoScheduleDay,
    setEditingTask,
    toggleTaskStatus,
  } = useTask();

  const [dailyViewMode, setDailyViewMode] = useState<'timeline' | 'list'>('timeline');

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

  const calendarDays = [];

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

  const tasksForSelectedDate = tasks.filter((t) => t.dueDate === selectedDate);

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
      });
    } else if (task.startTime) {
      // Hanya punya start time
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
      });
    } else if (task.dueTime) {
      // Hanya punya dueTime
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
      });
    } else {
      unscheduledTasks.push(task);
    }
  });

  return (
    <div>
      {/* Calendar Card View */}
      <div className="calendar-card">
        {/* Header Bulan & Navigasi */}
        <div className="calendar-month-header">
          <div className="calendar-month-title">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </div>
          <div className="calendar-nav-btns">
            <button
              type="button"
              className="android-icon-btn"
              onClick={jumpToToday}
              style={{
                fontSize: '12px',
                width: 'auto',
                padding: '0 10px',
                height: '32px',
                borderRadius: '16px',
                background: '#f0f4f9',
                fontWeight: 600,
                color: 'var(--md-sys-color-primary)',
              }}
              title="Pergi ke Hari Ini"
            >
              Hari Ini
            </button>
            <button
              type="button"
              className="android-icon-btn"
              onClick={prevMonth}
              style={{ width: '32px', height: '32px' }}
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="android-icon-btn"
              onClick={nextMonth}
              style={{ width: '32px', height: '32px' }}
              aria-label="Bulan berikutnya"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Hari dalam seminggu */}
        <div className="calendar-weekdays-row">
          {WEEKDAYS.map((w, idx) => (
            <div key={idx} className="calendar-weekday-cell">
              {w}
            </div>
          ))}
        </div>

        {/* Grid tanggal */}
        <div className="calendar-days-grid">
          {calendarDays.map((cell, idx) => {
            const cellDateStr = formatYMD(cell.year, cell.month, cell.day);
            const isToday = cellDateStr === todayStr;
            const isSelected = cellDateStr === selectedDate;
            const taskCount = tasks.filter((t) => t.dueDate === cellDateStr).length;

            return (
              <div
                key={idx}
                className={`calendar-day-cell ${
                  !cell.isCurrentMonth ? 'other-month' : ''
                } ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  if (cell.isCurrentMonth) {
                    setSelectedDate(cellDateStr);
                  }
                }}
              >
                <span>{cell.day}</span>
                {cell.isCurrentMonth && taskCount > 0 && (
                  <div className="calendar-dot-row">
                    <span className="calendar-dot" />
                    {taskCount > 1 && <span className="calendar-dot" />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Agenda Harian & Timeline Kalender */}
      <div className="calendar-agenda-wrapper">
        <div className="agenda-header">
          <div>
            <div className="agenda-title">
              <CalendarIcon size={16} color="var(--md-sys-color-primary)" />
              <span>Agenda {selectedDate === todayStr ? '(Hari Ini)' : ''}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#444746', marginTop: '2px' }}>
              {formatReadableSelected()}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
        </div>

        {/* Tombol Aksi AI Auto-Schedule Anti-Bentrok */}
        {tasksForSelectedDate.length > 0 && (
          <div className="timeline-ai-banner">
            <div className="timeline-ai-text">
              <Sparkles size={14} className="text-primary" />
              <span>
                <strong>Penjadwalan Bebas Tabrakan:</strong> AI dapat merapikan seluruh agenda hari ini.
              </span>
            </div>
            <button
              type="button"
              className="ai-schedule-btn"
              onClick={() => autoScheduleDay(selectedDate)}
              title="Susun jadwal otomatis bebas bentrok dengan alokasi sesi terbagi"
            >
              <Sparkles size={12} />
              <span>⚡ Susun Jadwal Cerdas AI</span>
            </button>
          </div>
        )}

        {/* Unscheduled Tasks Alert & Dock */}
        {dailyViewMode === 'timeline' && unscheduledTasks.length > 0 && (
          <div className="unscheduled-tasks-box">
            <div className="unscheduled-header">
              <Clock size={13} />
              <span>{unscheduledTasks.length} Tugas Belum Memiliki Jam Spesifik:</span>
            </div>
            <div className="unscheduled-chips">
              {unscheduledTasks.map((ut) => (
                <div
                  key={ut.id}
                  className="unscheduled-chip"
                  onClick={() => setEditingTask(ut)}
                  title="Klik untuk set jam atau klik tombol 'Susun Jadwal AI'"
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
              padding: '24px 16px',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e0e2ec',
              marginTop: '10px',
            }}
          >
            <p className="empty-desc" style={{ marginBottom: '10px', color: '#444746' }}>
              Tidak ada task terjadwal untuk tanggal ini.
            </p>
            <button
              type="button"
              className="material-chip active"
              onClick={() => setActiveTab('new')}
              style={{ padding: '7px 14px' }}
            >
              <Plus size={14} /> Tambah Tugas
            </button>
          </div>
        ) : dailyViewMode === 'list' ? (
          /* List Mode */
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: '10px' }}>
            {tasksForSelectedDate.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          /* Timeline Hourly View (06:00 - 22:00) */
          <div className="daily-timeline-container">
            {TIMELINE_HOURS.map((hour) => {
              const hourStr = `${String(hour).padStart(2, '0')}:00`;
              const nextHourStr = `${String(hour + 1).padStart(2, '0')}:00`;
              const hourStartMin = hour * 60;
              const hourEndMin = (hour + 1) * 60;

              // Find blocks that overlap with this hour
              const matchingBlocks = sessionBlocks.filter((block) => {
                const bStart = timeToMinutes(block.startTime);
                const bEnd = timeToMinutes(block.endTime);
                if (bStart === bEnd) {
                  return bStart >= hourStartMin && bStart < hourEndMin;
                }
                return Math.max(hourStartMin, bStart) < Math.min(hourEndMin, bEnd);
              });

              return (
                <div key={hour} className="timeline-hour-row">
                  {/* Label Jam di Kolom Kiri */}
                  <div className="timeline-time-col">
                    <span className="hour-label">{hourStr}</span>
                  </div>

                  {/* Area Blok Tugas di Kolom Kanan */}
                  <div className="timeline-content-col">
                    <div className="timeline-guide-line" />

                    {matchingBlocks.length > 0 ? (
                      <div className="timeline-blocks-wrapper">
                        {matchingBlocks.map((block, bIdx) => {
                          const originalTask = tasks.find((t) => t.id === block.taskId);
                          return (
                            <div
                              key={`${block.taskId}-${bIdx}`}
                              className={`timeline-task-block ${
                                block.isCompleted ? 'completed' : ''
                              } priority-${block.priority}`}
                              onClick={() => originalTask && setEditingTask(originalTask)}
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

                                {block.sessionLabel && (
                                  <span className="block-session-badge">
                                    <Layers size={9} />
                                    {block.sessionLabel}
                                  </span>
                                )}

                                {block.allowConcurrent && (
                                  <span className="block-multitask-badge">
                                    <Shuffle size={9} />
                                    Multitask
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
                    ) : (
                      <div className="timeline-empty-slot" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
